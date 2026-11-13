/**
 * Smoke end-to-end de la API (CU1 / CU2 / CU5 + auth + bandeja CU3/CU4).
 *
 * Uso (con Postgres y `pnpm dev:backend` arriba):
 *   node scripts/smoke-e2e.mjs
 *
 * Escribe el reporte en `out-e2e-smoke.txt`.
 *
 * Nota histórica: un smoke PowerShell temprano marcó FAIL falsos en CU1/CU2/CU5
 * porque el helper `H` se resolvía a `Get-History` y no enviaba
 * `X-Demo-User-Id` / `X-Demo-Role`. Las APIs ya estaban bien.
 */

const base = process.env.API_BASE ?? "http://localhost:3000/api";
const lines = [];
let pass = 0;
let fail = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    pass++;
    lines.push(`PASS | ${name} | ${detail}`);
    console.log("PASS", name, "—", detail);
  } else {
    fail++;
    lines.push(`FAIL | ${name} | ${detail}`);
    console.log("FAIL", name, "—", detail);
  }
}

async function login(email, role) {
  const r = await fetch(`${base}/demo/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "prototipo2026",
      roleCode: role,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j;
}

function hdrs(u) {
  return {
    "X-Demo-User-Id": String(u.user.id),
    "X-Demo-Role": u.user.roleCode,
    "Content-Type": "application/json",
  };
}

async function jfetch(url, opts = {}) {
  const r = await fetch(url, opts);
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = t;
  }
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j)}`);
  return j;
}

const health = await jfetch(`${base}/health`);
assert(
  "health",
  health.status === "ok" && health.database === "up",
  JSON.stringify(health),
);

const bad = await fetch(`${base}/demo/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "vie_publicacion@tec.ac.cr",
    password: "wrong",
    roleCode: "vie_publicacion",
  }),
});
assert("login rechaza pwd mala", bad.status === 401, `status=${bad.status}`);

const vie = await login("vie_publicacion@tec.ac.cr", "vie_publicacion");
const inv = await login("investigador@tec.ac.cr", "investigador");
assert("login VIE", !!vie.user.id, vie.user.email);
assert("login investigador", !!inv.user.id, inv.user.email);

for (const [email, role] of [
  ["vinculacion@tec.ac.cr", "vinculacion"],
  ["comite_evaluador@tec.ac.cr", "comite_evaluador"],
  ["consejo@tec.ac.cr", "consejo"],
  ["cie@tec.ac.cr", "cie"],
  ["admin@tec.ac.cr", "admin"],
]) {
  const u = await login(email, role);
  assert(`login ${role}`, u.user.roleCode === role, u.user.email);
}

const hv = hdrs(vie);
const hi = hdrs(inv);

const convos = await jfetch(`${base}/convocatorias`, { headers: hv });
assert(
  "CU1 list convocatorias",
  Array.isArray(convos) && convos.length >= 1,
  `count=${convos.length}`,
);

const apertura = new Date().toISOString().slice(0, 10);
const cierre = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
const nueva = await jfetch(`${base}/convocatorias`, {
  method: "POST",
  headers: hv,
  body: JSON.stringify({
    nombre: `Smoke Conv ${Date.now()}`,
    descripcion: "smoke",
    fechaApertura: apertura,
    fechaCierre: cierre,
    presupuestoEstimado: 100000,
    estado: "borrador",
    hitos: [{ nombre: "Recepción smoke", responsable: "VIE", fechaInicio: apertura, fechaFin: cierre }],
  }),
});
assert(
  "CU1 create convocatoria",
  !!nueva.id,
  `id=${nueva.id} estado=${nueva.estado}`,
);

const props = await jfetch(`${base}/propuestas`, { headers: hi });
assert("CU2 list propuestas", Array.isArray(props), `count=${props.length}`);

const activa = convos.find((c) => c.estado === "activa") || nueva;
const prop = await jfetch(`${base}/propuestas`, {
  method: "POST",
  headers: hi,
  body: JSON.stringify({
    titulo: `Smoke Prop ${Date.now()}`,
    idConvocatoria: activa.id,
    modalidad: "aplicada",
    resumen: "smoke",
    problema: "p",
    objetivoGeneral: "o",
    metodologia: "m",
  }),
});
assert(
  "CU2 create borrador",
  prop.estadoActual === "borrador",
  `id=${prop.id} codigo=${prop.codigo}`,
);

const hist = await jfetch(`${base}/historico/propuestas`, { headers: hv });
assert(
  "CU5 historico list",
  Array.isArray(hist.items) && hist.total >= 1,
  `total=${hist.total}`,
);

const histAnio = await jfetch(`${base}/historico/propuestas?anio=2025`, {
  headers: hv,
});
assert(
  "CU5 filtro anio",
  Array.isArray(histAnio.items),
  `total=${histAnio.total}`,
);

const histComb = await jfetch(
  `${base}/historico/propuestas?anio=2025&estado=aprobada`,
  { headers: hv },
);
assert(
  "CU5 filtros combinados",
  Array.isArray(histComb.items),
  `total=${histComb.total}`,
);

const ban = await jfetch(`${base}/evaluaciones/bandeja`, {
  headers: hdrs(await login("vinculacion@tec.ac.cr", "vinculacion")),
});
assert(
  "CU3/4 bandeja evaluaciones",
  Array.isArray(ban.items),
  `total=${ban.total} role=${ban.role}`,
);

const unauth = await fetch(`${base}/convocatorias`);
assert("auth gate", unauth.status === 401, `status=${unauth.status}`);

lines.push("");
lines.push(`TOTAL PASS=${pass} FAIL=${fail}`);
lines.push(`Generado: ${new Date().toISOString()}`);
lines.push(
  "Nota: el smoke PowerShell temprano marcó FAIL falsos en CU1/CU2/CU5 porque el helper H se resolvía a Get-History y no enviaba X-Demo-User-Id / X-Demo-Role.",
);

const fs = await import("node:fs");
fs.writeFileSync("out-e2e-smoke.txt", `${lines.join("\n")}\n`, "utf8");
console.log(`\nTOTAL PASS=${pass} FAIL=${fail}`);
console.log("Reporte: out-e2e-smoke.txt");
process.exit(fail ? 1 : 0);
