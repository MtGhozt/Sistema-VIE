/**
 * Regresión de endurecimiento de sesión / PII (auditoría integral).
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { testEnvironment, root } from "./test-environment.mjs";

const run = new Date().toISOString().replace(/[:.]/g, "-");
const results = [];
let env;

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, status: "PASA" });
  } catch (error) {
    results.push({ name, status: "FALLA", detail: error.message });
  }
  console.log(results.at(-1));
}

try {
  env = await testEnvironment({ ui: false });
  const api = env.api;
  let token;
  let user;

  await check("Login emite sessionToken", async () => {
    const res = await fetch(`${api}/demo/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "investigador@tec.ac.cr",
        password: "prototipo2026",
        roleCode: "investigador",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(typeof data.sessionToken, "string");
    assert.ok(data.sessionToken.length >= 32);
    token = data.sessionToken;
    user = data.user;
  });

  await check("Sesión válida autentica /propuestas", async () => {
    const res = await fetch(`${api}/propuestas`, {
      headers: { "X-Demo-Session": token },
    });
    assert.equal(res.status, 200);
  });

  await check("/demo/roles no expone id_usuario", async () => {
    const res = await fetch(`${api}/demo/roles`);
    assert.equal(res.status, 200);
    const rows = await res.json();
    assert.ok(Array.isArray(rows) && rows.length > 0);
    for (const row of rows) {
      assert.equal(row.id_usuario, undefined);
      assert.ok(row.codigo && row.correo_institucional);
    }
  });

  await check("/personas no expone cédula ni ORCID", async () => {
    const res = await fetch(`${api}/personas`, {
      headers: {
        "X-Demo-User-Id": String(user.id),
        "X-Demo-Role": "investigador",
        "X-Demo-Session": token,
      },
    });
    assert.equal(res.status, 200);
    const rows = await res.json();
    assert.ok(rows.length > 0);
    for (const row of rows) {
      assert.equal(row.cedula, undefined);
      assert.equal(row.orcid, undefined);
    }
  });

  await check("Foto ajena sin vínculo → 403 o 404", async () => {
    const adminLogin = await (
      await fetch(`${api}/demo/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@tec.ac.cr",
          password: "prototipo2026",
          roleCode: "admin",
        }),
      })
    ).json();
    const personas = await (
      await fetch(`${api}/personas`, {
        headers: {
          "X-Demo-User-Id": String(adminLogin.user.id),
          "X-Demo-Role": "admin",
          "X-Demo-Session": adminLogin.sessionToken,
        },
      })
    ).json();
    const other = personas.find((p) => p.id !== user.id);
    assert.ok(other);
    const photo = await fetch(`${api}/perfil/foto/${other.id}`, {
      headers: {
        "X-Demo-User-Id": String(user.id),
        "X-Demo-Role": "investigador",
        "X-Demo-Session": token,
      },
    });
    assert.ok([403, 404].includes(photo.status), `status=${photo.status}`);
  });

  await check("Logout invalida el token de sesión", async () => {
    const logout = await fetch(`${api}/demo/logout`, {
      method: "POST",
      headers: { "X-Demo-Session": token },
    });
    assert.equal(logout.status, 204);
    const withDeadToken = await fetch(`${api}/propuestas`, {
      headers: { "X-Demo-Session": token },
    });
    assert.equal(withDeadToken.status, 401);
  });

  await check("Headers sin token siguen válidos en desarrollo", async () => {
    const res = await fetch(`${api}/propuestas`, {
      headers: {
        "X-Demo-User-Id": String(user.id),
        "X-Demo-Role": "investigador",
      },
    });
    assert.equal(res.status, 200);
  });
} catch (error) {
  results.push({ name: "Entorno", status: "FALLA", detail: error.message });
  console.error(error);
} finally {
  if (env) await env.close();
  const dir = path.join(
    root,
    "correcciones/correcciones-finales/evidencias",
    `${run}-seguridad-sesion`,
  );
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "reporte.json"),
    `${JSON.stringify({ run, results }, null, 2)}\n`,
  );
  console.log(`Evidencia: ${path.relative(root, dir)}`);
  process.exitCode = results.some((r) => r.status !== "PASA") ? 1 : 0;
}
