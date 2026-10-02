// Frontend sin frameworks. Habla con /api/propuestas del server.js.
async function api(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json();
}

function tarjeta(p, evaluar = false) {
  const div = document.createElement("div");
  div.className = "card " + p.estado;
  div.innerHTML = `<strong>${p.titulo}</strong><br>
    ${p.coordinador} · ${p.escuela} · ${p.tematica}<br>
    <span class="estado">${p.estado}</span>
    ${p.puntaje != null ? ` · puntaje ${p.puntaje}` : ""}`;
  const acc = document.createElement("div");
  acc.className = "acciones";
  if (p.estado === "borrador") {
    const b = document.createElement("button");
    b.textContent = "Enviar a revisión";
    b.onclick = async () => { await api(`/api/propuestas/${p.id}/enviar`, { method: "PUT" }); refrescar(); };
    acc.appendChild(b);
  }
  if (evaluar && (p.estado === "en_revision" || p.estado === "observada")) {
    const inp = document.createElement("input");
    inp.type = "number"; inp.min = 0; inp.max = 100; inp.value = 80;
    const ok = document.createElement("button"); ok.textContent = "Aprobar";
    ok.onclick = () => decidir(p.id, inp.value, "aprobada");
    const no = document.createElement("button"); no.textContent = "Rechazar";
    no.onclick = () => decidir(p.id, inp.value, "rechazada");
    acc.append(inp, ok, no);
  }
  div.appendChild(acc);
  return div;
}

async function decidir(id, puntaje, decision) {
  await api(`/api/propuestas/${id}/evaluar`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ puntaje: Number(puntaje), decision })
  });
  refrescar();
}

async function cargarHistorico() {
  const q = document.getElementById("f-q").value;
  const escuela = document.getElementById("f-escuela").value;
  const tematica = document.getElementById("f-tematica").value;
  const estado = document.getElementById("f-estado").value;
  const rows = await api(`/api/propuestas?q=${encodeURIComponent(q)}&escuela=${encodeURIComponent(escuela)}&tematica=${encodeURIComponent(tematica)}&estado=${estado}`);
  const box = document.getElementById("historico");
  box.innerHTML = rows.length ? "" : "<p>Sin resultados.</p>";
  rows.forEach(p => box.appendChild(tarjeta(p)));
}

async function cargarBandeja() {
  const rows = await api("/api/propuestas?estado=en_revision");
  const box = document.getElementById("bandeja");
  box.innerHTML = rows.length ? "" : "<p>No hay propuestas en revisión.</p>";
  rows.forEach(p => box.appendChild(tarjeta(p, true)));
}

function refrescar() { cargarBandeja(); cargarHistorico(); }

document.getElementById("form-propuesta").addEventListener("submit", async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target).entries());
  f.presupuesto = Number(f.presupuesto || 0);
  await api("/api/propuestas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
  e.target.reset();
  refrescar();
});

refrescar();
