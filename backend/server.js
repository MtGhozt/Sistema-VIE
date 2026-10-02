// Prototipo BASE ultra-simple — Fondos VIE (TEC)
// Stack: Node + Express + SQLite nativo (node:sqlite, sin dependencias de DB).
// 5 endpoints + 1 tabla. Para migrar a Postgres solo cambia este archivo.
const express = require("express");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- SCHEMA (SQL estándar, portable a Postgres) ----------
const db = new DatabaseSync(path.join(__dirname, "prototipo.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS propuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    coordinador TEXT NOT NULL,
    escuela TEXT NOT NULL,
    tematica TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'borrador',
    resumen TEXT DEFAULT '',
    presupuesto REAL DEFAULT 0,
    puntaje REAL DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ---------- SEED (3 ejemplos realistas, solo si la tabla está vacía) ----------
const n = db.prepare("SELECT COUNT(*) AS c FROM propuestas").get().c;
if (n === 0) {
  const ins = db.prepare(`INSERT INTO propuestas
    (titulo, coordinador, escuela, tematica, estado, resumen, presupuesto, puntaje)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  ins.run("Biofiltros con residuos de café para agua rural", "Ana Ruiz", "Ingeniería Ambiental", "Ambiente", "en_revision", "Prototipo de biofiltro de bajo costo.", 2500000, null);
  ins.run("Detección temprana de roya con visión artificial", "Luis Mora", "Computación", "IA", "aprobada", "Modelo CNN con fotos de campo.", 4000000, 92);
  ins.run("Secado solar de cacao en la zona sur", "María Fernández", "Agronegocios", "Energía", "rechazada", "Secador solar de bajo costo.", 1800000, 58);
}

// ---------- API ----------
app.get("/api/propuestas", (req, res) => {
  const { q = "", escuela = "", tematica = "", estado = "" } = req.query;
  const rows = db.prepare(`
    SELECT * FROM propuestas
    WHERE (titulo LIKE ? OR coordinador LIKE ?)
      AND (escuela LIKE ?)
      AND (tematica LIKE ?)
      AND (estado LIKE ?)
    ORDER BY id DESC
  `).all(`%${q}%`, `%${q}%`, `%${escuela}%`, `%${tematica}%`, `%${estado}%`);
  res.json(rows);
});

app.post("/api/propuestas", (req, res) => {
  const { titulo, coordinador, escuela, tematica, resumen = "", presupuesto = 0 } = req.body;
  if (!titulo || !coordinador || !escuela || !tematica)
    return res.status(400).json({ error: "Faltan campos: titulo, coordinador, escuela, tematica" });
  const r = db.prepare(`INSERT INTO propuestas
    (titulo, coordinador, escuela, tematica, estado, resumen, presupuesto)
    VALUES (?, ?, ?, ?, 'borrador', ?, ?)`).run(titulo, coordinador, escuela, tematica, resumen, presupuesto);
  res.status(201).json(db.prepare("SELECT * FROM propuestas WHERE id = ?").get(r.lastInsertRowid));
});

app.put("/api/propuestas/:id/enviar", (req, res) => {
  db.prepare("UPDATE propuestas SET estado = 'en_revision' WHERE id = ?").run(req.params.id);
  res.json(db.prepare("SELECT * FROM propuestas WHERE id = ?").get(req.params.id));
});

// Evaluación simplificada: puntaje + estado final (la rúbrica oficial va en Etapa 2)
app.put("/api/propuestas/:id/evaluar", (req, res) => {
  const { puntaje = 0, decision = "aprobada" } = req.body; // decision: aprobada | rechazada | observada
  if (!["aprobada", "rechazada", "observada"].includes(decision))
    return res.status(400).json({ error: "decision inválida" });
  db.prepare("UPDATE propuestas SET puntaje = ?, estado = ? WHERE id = ?").run(puntaje, decision, req.params.id);
  res.json(db.prepare("SELECT * FROM propuestas WHERE id = ?").get(req.params.id));
});

app.listen(PORT, () => console.log(`Prototipo VIE en http://localhost:${PORT}`));
