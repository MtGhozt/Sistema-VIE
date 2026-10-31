import { asyncHandler } from "../middleware/asyncHandler.js";
import { Router } from "express";
import { query, transaction } from "../db.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";

export const propuestasRouter = Router();

const MODALIDAD_MAP: Record<string, string> = {
  "Investigación básica": "basica",
  "Investigación aplicada": "aplicada",
  "Investigación básica y aplicada": "basica_aplicada",
  "Desarrollo tecnológico": "desarrollo_tecnologico",
  basica: "basica",
  aplicada: "aplicada",
  basica_aplicada: "basica_aplicada",
  desarrollo_tecnologico: "desarrollo_tecnologico",
  fortalecimiento: "fortalecimiento",
};

const MODALIDAD_LABEL: Record<string, string> = {
  basica: "Investigación básica",
  aplicada: "Investigación aplicada",
  basica_aplicada: "Investigación básica y aplicada",
  desarrollo_tecnologico: "Desarrollo tecnológico",
  fortalecimiento: "Fortalecimiento",
};

type PropuestaRow = {
  id_propuesta: number;
  codigo: string;
  id_convocatoria: number;
  id_coordinador: number;
  id_escuela: number;
  titulo: string;
  modalidad: string;
  resumen: string | null;
  abstract_en: string | null;
  problema: string | null;
  objetivo_general: string | null;
  metodologia: string | null;
  estado_actual: string;
  etapa_flujo: number;
  fecha_envio: string | null;
  convocatoria_nombre: string;
  coordinador_nombre: string;
  escuela_nombre: string;
};

function mapPropuesta(row: PropuestaRow) {
  return {
    id: row.id_propuesta,
    codigo: row.codigo,
    idConvocatoria: row.id_convocatoria,
    convocatoriaNombre: row.convocatoria_nombre,
    idCoordinador: row.id_coordinador,
    coordinadorNombre: row.coordinador_nombre,
    idEscuela: row.id_escuela,
    escuelaNombre: row.escuela_nombre,
    titulo: row.titulo,
    modalidad: row.modalidad,
    modalidadLabel: MODALIDAD_LABEL[row.modalidad] ?? row.modalidad,
    resumen: row.resumen,
    abstractEn: row.abstract_en,
    problema: row.problema,
    objetivoGeneral: row.objetivo_general,
    metodologia: row.metodologia,
    estadoActual: row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
  };
}

const BASE_SELECT = `
  SELECT p.*,
    c.nombre AS convocatoria_nombre,
    u.nombre_completo AS coordinador_nombre,
    e.nombre AS escuela_nombre
  FROM propuesta p
  JOIN convocatoria c ON c.id_convocatoria = p.id_convocatoria
  JOIN usuario u ON u.id_usuario = p.id_coordinador
  JOIN escuela e ON e.id_escuela = p.id_escuela
`;

function canWriteProposals(role: string | null | undefined) {
  return role === "investigador" || role === "admin";
}

async function loadKeywords(idPropuesta: number, execute: typeof query = query) {
  const result = await execute<{ idioma: string; palabra: string }>(
    `
    SELECT idioma, palabra FROM propuesta_palabra_clave
    WHERE id_propuesta = $1
    ORDER BY id_palabra_clave
    `,
    [idPropuesta],
  );
  const es: string[] = [];
  const en: string[] = [];
  for (const row of result.rows) {
    if (row.idioma === "es") es.push(row.palabra);
    else if (row.idioma === "en") en.push(row.palabra);
  }
  return { keywordsEs: es, keywordsEn: en };
}

async function replaceKeywords(
  idPropuesta: number,
  keywordsEs: string[] | undefined,
  keywordsEn: string[] | undefined,
  execute: typeof query = query,
) {
  if (keywordsEs === undefined && keywordsEn === undefined) return;
  for (const [idioma, words] of [["es", keywordsEs], ["en", keywordsEn]] as const) {
    if (words !== undefined) {
      await execute(`DELETE FROM propuesta_palabra_clave WHERE id_propuesta = $1 AND idioma = $2`, [idPropuesta, idioma]);
    }
  }
  const pairs: [string, string][] = [];
  for (const p of keywordsEs ?? []) {
    const word = p.trim();
    if (word) pairs.push(["es", word]);
  }
  for (const p of keywordsEn ?? []) {
    const word = p.trim();
    if (word) pairs.push(["en", word]);
  }
  for (const [idioma, palabra] of pairs) {
    await execute(
      `
      INSERT INTO propuesta_palabra_clave (id_propuesta, idioma, palabra)
      VALUES ($1, $2, $3)
      `,
      [idPropuesta, idioma, palabra.slice(0, 100)],
    );
  }
}

function parseKeywordInput(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Listado: investigador ve las suyas; admin ve todas. */
propuestasRouter.get("/propuestas", requireDemoAuth, asyncHandler(async (req, res) => {
  const role = req.demoAuth!.role;
  const userId = req.demoAuth!.userId!;
  const result =
    role === "admin"
      ? await query<PropuestaRow>(
          `${BASE_SELECT} ORDER BY p.id_propuesta DESC`,
        )
      : await query<PropuestaRow>(
          `${BASE_SELECT} WHERE p.id_coordinador = $1 ORDER BY p.id_propuesta DESC`,
          [userId],
        );
  res.json(result.rows.map(mapPropuesta));
}));

propuestasRouter.get("/propuestas/:id", requireDemoAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "id inválido" });
    return;
  }
  const result = await query<PropuestaRow>(
    `${BASE_SELECT} WHERE p.id_propuesta = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  if (
    req.demoAuth!.role !== "admin" &&
    row.id_coordinador !== req.demoAuth!.userId
  ) {
    res.status(403).json({ error: "No tenés acceso a esta propuesta" });
    return;
  }
  const keywords = await loadKeywords(id);
  res.json({ ...mapPropuesta(row), ...keywords });
}));

/** Crear borrador. */
propuestasRouter.post("/propuestas", requireDemoAuth, asyncHandler(async (req, res) => {
  if (!canWriteProposals(req.demoAuth!.role)) {
    res.status(403).json({ error: "Solo la persona investigadora puede crear propuestas" });
    return;
  }

  const titulo = String(req.body?.titulo ?? "").trim();
  const idConvocatoria = Number(req.body?.idConvocatoria);
  const modalidadRaw = String(req.body?.modalidad ?? "").trim();
  const modalidad = MODALIDAD_MAP[modalidadRaw];
  const resumen = req.body?.resumen ? String(req.body.resumen).trim() : null;
  const abstractEn = req.body?.abstractEn
    ? String(req.body.abstractEn).trim()
    : null;
  const problema = req.body?.problema ? String(req.body.problema).trim() : null;
  const objetivoGeneral = req.body?.objetivoGeneral
    ? String(req.body.objetivoGeneral).trim()
    : null;
  const metodologia = req.body?.metodologia
    ? String(req.body.metodologia).trim()
    : null;
  const keywordsEs = parseKeywordInput(req.body?.keywordsEs) ?? [];
  const keywordsEn = parseKeywordInput(req.body?.keywordsEn) ?? [];

  if (!titulo || !Number.isFinite(idConvocatoria) || !modalidad) {
    res.status(400).json({
      error: "titulo, idConvocatoria y modalidad son obligatorios",
    });
    return;
  }

  const conv = await query<{ estado: string }>(
    `SELECT estado FROM convocatoria WHERE id_convocatoria = $1`,
    [idConvocatoria],
  );
  if (!conv.rows[0]) {
    res.status(400).json({ error: "Convocatoria no existe" });
    return;
  }
  if (conv.rows[0].estado !== "activa" && req.demoAuth!.role !== "admin") {
    res.status(400).json({ error: "Solo se puede postular a convocatorias activas" });
    return;
  }

  const userId = req.demoAuth!.userId!;
  const user = await query<{ id_escuela: number | null }>(
    `SELECT id_escuela FROM usuario WHERE id_usuario = $1`,
    [userId],
  );
  const idEscuela = user.rows[0]?.id_escuela;
  if (!idEscuela) {
    res.status(400).json({ error: "El usuario demo no tiene escuela asignada" });
    return;
  }

  const saved = await transaction(async (execute) => {
  const year = new Date().getFullYear();
  const codigoTmp = `TMP-${userId}-${Date.now()}`;

  const insert = await execute<{ id_propuesta: number }>(
    `
    INSERT INTO propuesta (
      codigo, id_convocatoria, id_coordinador, id_escuela,
      titulo, modalidad, resumen, abstract_en,
      problema, objetivo_general, metodologia,
      estado_actual, etapa_flujo
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'borrador', 0)
    RETURNING id_propuesta
    `,
    [
      codigoTmp,
      idConvocatoria,
      userId,
      idEscuela,
      titulo.slice(0, 500),
      modalidad,
      resumen,
      abstractEn,
      problema,
      objetivoGeneral,
      metodologia,
    ],
  );

  const id = insert.rows[0].id_propuesta;
  const codigo = `PROP-${year}-${String(id).padStart(3, "0")}`;
  await execute(`UPDATE propuesta SET codigo = $1 WHERE id_propuesta = $2`, [
    codigo,
    id,
  ]);
  await replaceKeywords(id, keywordsEs, keywordsEn, execute);

  const detail = await execute<PropuestaRow>(
    `${BASE_SELECT} WHERE p.id_propuesta = $1`,
    [id],
  );
  const keywords = await loadKeywords(id, execute);
  return { ...mapPropuesta(detail.rows[0]), ...keywords };
  });
  res.status(201).json(saved);
}));

/** Actualizar borrador. */
propuestasRouter.patch("/propuestas/:id", requireDemoAuth, asyncHandler(async (req, res) => {
  if (!canWriteProposals(req.demoAuth!.role)) {
    res.status(403).json({ error: "Sin permiso para editar propuestas" });
    return;
  }
  const id = Number(req.params.id);
  const existing = await query<{
    id_coordinador: number;
    estado_actual: string;
  }>(`SELECT id_coordinador, estado_actual FROM propuesta WHERE id_propuesta = $1`, [
    id,
  ]);
  const row = existing.rows[0];
  if (!row) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  if (
    req.demoAuth!.role !== "admin" &&
    row.id_coordinador !== req.demoAuth!.userId
  ) {
    res.status(403).json({ error: "No tenés acceso a esta propuesta" });
    return;
  }
  if (row.estado_actual !== "borrador") {
    res.status(400).json({ error: "Solo se editan propuestas en borrador" });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  const set = (col: string, val: unknown) => {
    fields.push(`${col} = $${i++}`);
    values.push(val);
  };

  if (req.body?.titulo !== undefined) {
    const titulo = String(req.body.titulo).trim();
    if (!titulo) {
      res.status(400).json({ error: "titulo vacío" });
      return;
    }
    set("titulo", titulo.slice(0, 500));
  }
  if (req.body?.modalidad !== undefined) {
    const modalidad = MODALIDAD_MAP[String(req.body.modalidad).trim()];
    if (!modalidad) {
      res.status(400).json({ error: "modalidad inválida" });
      return;
    }
    set("modalidad", modalidad);
  }
  if (req.body?.resumen !== undefined) {
    set(
      "resumen",
      req.body.resumen === null ? null : String(req.body.resumen).trim(),
    );
  }
  if (req.body?.abstractEn !== undefined) {
    set(
      "abstract_en",
      req.body.abstractEn === null ? null : String(req.body.abstractEn).trim(),
    );
  }
  if (req.body?.idConvocatoria !== undefined) {
    set("id_convocatoria", Number(req.body.idConvocatoria));
  }
  if (req.body?.problema !== undefined) {
    set(
      "problema",
      req.body.problema === null ? null : String(req.body.problema).trim(),
    );
  }
  if (req.body?.objetivoGeneral !== undefined) {
    set(
      "objetivo_general",
      req.body.objetivoGeneral === null
        ? null
        : String(req.body.objetivoGeneral).trim(),
    );
  }
  if (req.body?.metodologia !== undefined) {
    set(
      "metodologia",
      req.body.metodologia === null
        ? null
        : String(req.body.metodologia).trim(),
    );
  }

  const saved = await transaction(async (execute) => {
  if (fields.length > 0) {
    values.push(id);
    await execute(
      `UPDATE propuesta SET ${fields.join(", ")} WHERE id_propuesta = $${i}`,
      values,
    );
  }

  await replaceKeywords(
    id,
    parseKeywordInput(req.body?.keywordsEs),
    parseKeywordInput(req.body?.keywordsEn),
    execute,
  );

  const detail = await execute<PropuestaRow>(
    `${BASE_SELECT} WHERE p.id_propuesta = $1`,
    [id],
  );
  const keywords = await loadKeywords(id, execute);
  return { ...mapPropuesta(detail.rows[0]), ...keywords };
  });
  res.json(saved);
}));

/** Enviar a revisión (sale de borrador). */
propuestasRouter.post(
  "/propuestas/:id/enviar",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    if (!canWriteProposals(req.demoAuth!.role)) {
      res.status(403).json({ error: "Sin permiso para enviar propuestas" });
      return;
    }
    const id = Number(req.params.id);
    const existing = await query<{
      id_coordinador: number;
      estado_actual: string;
      titulo: string;
    }>(
      `SELECT id_coordinador, estado_actual, titulo FROM propuesta WHERE id_propuesta = $1`,
      [id],
    );
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    if (
      req.demoAuth!.role !== "admin" &&
      row.id_coordinador !== req.demoAuth!.userId
    ) {
      res.status(403).json({ error: "No tenés acceso a esta propuesta" });
      return;
    }
    if (row.estado_actual !== "borrador") {
      res.status(400).json({ error: "La propuesta ya fue enviada" });
      return;
    }
    if (!row.titulo.trim()) {
      res.status(400).json({ error: "Falta el título para enviar" });
      return;
    }

    await query(
      `
      UPDATE propuesta
      SET estado_actual = 'enviada',
          etapa_flujo = 1,
          fecha_envio = NOW()
      WHERE id_propuesta = $1
      `,
      [id],
    );
    await query(
      `
      INSERT INTO propuesta_historial_estado (
        id_propuesta, estado_anterior, estado_nuevo, id_usuario, fecha_hora, observacion
      ) VALUES ($1, 'borrador', 'enviada', $2, NOW(), 'Envío inicial desde el prototipo')
      `,
      [id, req.demoAuth!.userId],
    );

    const detail = await query<PropuestaRow>(
      `${BASE_SELECT} WHERE p.id_propuesta = $1`,
      [id],
    );
    const keywords = await loadKeywords(id);
    res.json({ ...mapPropuesta(detail.rows[0]), ...keywords });
  }),
);
