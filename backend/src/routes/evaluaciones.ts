import { Router } from "express";
import { pool, query } from "../db.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";
import {
  getOfficialRubric,
  requestAiEvaluation,
} from "../services/aiEvaluation.js";

/**
 * CU3 / CU4 — Persistencia de dictamen PI, resultado de comité, aval y resolución CIE.
 *
 * Las pantallas del frontend siguen siendo por rol; este router escribe en Postgres
 * y avanza `propuesta.estado_actual` / `etapa_flujo` para que el histórico (CU5)
 * refleje las decisiones.
 *
 * etapa_flujo (alineado al seed):
 *   0 redacción · 1 vinculación/envío · 2 comité · 3 consejo · 4 VIE · 5 CIE · 6 resolución
 */

export const evaluacionesRouter = Router();

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  en_evaluacion: "En evaluación",
  dictaminada: "Dictaminada",
  avalada: "Avalada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const MODALIDAD_LABEL: Record<string, string> = {
  basica: "Investigación básica",
  aplicada: "Investigación aplicada",
  basica_aplicada: "Investigación básica y aplicada",
  desarrollo_tecnologico: "Desarrollo tecnológico",
  fortalecimiento: "Fortalecimiento",
};

type BandejaRow = {
  id_propuesta: number;
  codigo: string;
  titulo: string;
  modalidad: string;
  estado_actual: string;
  etapa_flujo: number;
  fecha_envio: string | null;
  resumen: string | null;
  abstract_en: string | null;
  requiere_dictamen_pi: boolean;
  escuela_nombre: string;
  coordinador_nombre: string;
  convocatoria_nombre: string;
  oficio_pi: string | null;
  oficio_comite: string | null;
  oficio_aval: string | null;
  resolucion: string | null;
  calificacion_comite: string | null;
};

const BANDEJA_SQL = `
  SELECT
    p.id_propuesta,
    p.codigo,
    p.titulo,
    p.modalidad,
    p.estado_actual,
    p.etapa_flujo,
    p.fecha_envio,
    p.resumen,
    p.abstract_en,
    p.requiere_dictamen_pi,
    e.nombre AS escuela_nombre,
    u.nombre_completo AS coordinador_nombre,
    c.nombre AS convocatoria_nombre,
    dpi.numero_oficio AS oficio_pi,
    rc.numero_oficio AS oficio_comite,
    av.numero_oficio AS oficio_aval,
    r.numero_resolucion AS resolucion,
    rc.calificacion_promedio::text AS calificacion_comite
  FROM propuesta p
  JOIN escuela e ON e.id_escuela = p.id_escuela
  JOIN usuario u ON u.id_usuario = p.id_coordinador
  JOIN convocatoria c ON c.id_convocatoria = p.id_convocatoria
  LEFT JOIN dictamen_pi dpi ON dpi.id_propuesta = p.id_propuesta
  LEFT JOIN resultado_comite rc ON rc.id_propuesta = p.id_propuesta
  LEFT JOIN aval_consejo av ON av.id_propuesta = p.id_propuesta
  LEFT JOIN resolucion_cie r ON r.id_propuesta = p.id_propuesta
  WHERE p.estado_actual <> 'borrador'
`;

function mapBandeja(row: BandejaRow) {
  return {
    id: row.id_propuesta,
    codigo: row.codigo,
    titulo: row.titulo,
    modalidad: row.modalidad,
    modalidadLabel: MODALIDAD_LABEL[row.modalidad] ?? row.modalidad,
    estadoActual: row.estado_actual,
    estadoLabel: ESTADO_LABEL[row.estado_actual] ?? row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
    resumen: row.resumen,
    abstractEn: row.abstract_en,
    piRequired: row.requiere_dictamen_pi,
    escuela: row.escuela_nombre,
    investigadora: row.coordinador_nombre,
    convocatoria: row.convocatoria_nombre,
    oficioPI: row.oficio_pi,
    oficioComite: row.oficio_comite,
    oficioAval: row.oficio_aval,
    resolucion: row.resolucion,
    evaluacionComite: row.calificacion_comite
      ? { average: Number(row.calificacion_comite) }
      : null,
  };
}

/** Roles que pueden operar cada acción del prototipo. */
const ACTION_ROLES: Record<string, Set<string>> = {
  pi: new Set(["vinculacion", "admin"]),
  "committee-ready": new Set(["comite_asistente", "admin"]),
  return: new Set(["comite_asistente", "admin"]),
  "save-rubric": new Set(["comite_evaluador", "cie", "admin"]),
  "committee-score": new Set(["comite_evaluador", "admin"]),
  "send-council": new Set(["consejo_asistente", "admin"]),
  "council-approve": new Set(["consejo", "admin"]),
  "council-reject": new Set(["consejo", "admin"]),
  "communicate-aval": new Set(["direccion_escuela", "admin"]),
  "vie-observation": new Set(["gestora_vie", "admin"]),
  "send-cie": new Set(["gestora_vie", "admin"]),
  "cie-approve": new Set(["cie", "admin"]),
  "cie-reject": new Set(["cie", "admin"]),
  "notify-resolution": new Set(["direccion_investigacion", "admin"]),
};

function roleOk(role: string | null | undefined, action: string) {
  const allowed = ACTION_ROLES[action];
  if (!allowed) return false;
  return !!role && allowed.has(role);
}

/** Filtro de bandeja por rol (etapa / estado). */
function bandejaClause(role: string | null | undefined): {
  sql: string;
  params: unknown[];
} {
  switch (role) {
    case "vinculacion":
      return {
        sql: ` AND p.etapa_flujo <= 1 AND p.estado_actual IN ('enviada', 'en_evaluacion')`,
        params: [],
      };
    case "comite_asistente":
    case "comite_evaluador":
      return {
        sql: ` AND p.etapa_flujo BETWEEN 1 AND 2 AND p.estado_actual IN ('enviada', 'en_evaluacion', 'dictaminada')`,
        params: [],
      };
    case "consejo_asistente":
    case "consejo":
    case "direccion_escuela":
      return {
        // Incluye dictaminada/en_evaluación (por decidir) y avalada (ya decidida, aún visible).
        sql: ` AND p.etapa_flujo BETWEEN 2 AND 4 AND p.estado_actual IN ('en_evaluacion', 'dictaminada', 'avalada')`,
        params: [],
      };
    case "gestora_vie":
      return {
        sql: ` AND p.etapa_flujo BETWEEN 3 AND 4 AND p.estado_actual IN ('dictaminada', 'avalada')`,
        params: [],
      };
    case "cie":
      return {
        sql: ` AND p.etapa_flujo >= 4 AND p.estado_actual IN ('avalada', 'en_evaluacion', 'dictaminada') AND p.estado_actual NOT IN ('aprobada', 'rechazada')`,
        params: [],
      };
    case "direccion_investigacion":
      return {
        sql: ` AND p.estado_actual IN ('aprobada', 'rechazada')`,
        params: [],
      };
    case "admin":
    default:
      return { sql: "", params: [] };
  }
}

async function loadPropuesta(id: number) {
  const result = await query<{
    id_propuesta: number;
    codigo: string;
    estado_actual: string;
    etapa_flujo: number;
    id_escuela: number;
    id_coordinador: number;
    titulo: string;
    modalidad: string;
  }>(
    `SELECT id_propuesta, codigo, estado_actual, etapa_flujo, id_escuela, id_coordinador, titulo, modalidad
     FROM propuesta WHERE id_propuesta = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function advanceEstado(
  client: { query: typeof pool.query },
  opts: {
    idPropuesta: number;
    estadoAnterior: string;
    estadoNuevo: string;
    etapa: number;
    userId: number;
    observacion: string;
  },
) {
  await client.query(
    `UPDATE propuesta
     SET estado_actual = $1, etapa_flujo = $2
     WHERE id_propuesta = $3`,
    [opts.estadoNuevo, opts.etapa, opts.idPropuesta],
  );
  await client.query(
    `INSERT INTO propuesta_historial_estado (
       id_propuesta, estado_anterior, estado_nuevo, id_usuario, fecha_hora, observacion
     ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
    [
      opts.idPropuesta,
      opts.estadoAnterior,
      opts.estadoNuevo,
      opts.userId,
      opts.observacion.slice(0, 500),
    ],
  );
}

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function yes(v: unknown): boolean {
  const s = str(v).toLowerCase();
  return s === "sí" || s === "si" || s === "true" || s === "1";
}

async function persistCommitteeEvaluation(
  client: { query: typeof pool.query },
  opts: {
    proposalId: number;
    evaluatorId: number;
    modality: string;
    rubric: Awaited<ReturnType<typeof getOfficialRubric>>;
    payload: Record<string, unknown>;
    state: "borrador" | "enviada";
  },
) {
  const scoreRows = asRecord(opts.payload.scores);
  const aiScores = asRecord(opts.payload.aiScores);
  const parsedScores = opts.rubric.criteria.map((criterion) => {
    const human = asRecord(scoreRows[criterion.id]);
    const score = typeof human.score === "number" ? human.score : null;
    const justification = str(human.reason);
    if (
      opts.state === "enviada" &&
      (score === null || ![0, 6, 8, 10].includes(score) || !justification)
    ) {
      throw new Error("Cada criterio requiere una calificación y una justificación humana");
    }
    if (score === null || ![0, 6, 8, 10].includes(score)) return null;
    const aiScoreValue = Number(aiScores[criterion.id]);
    const aiScore = [0, 6, 8, 10].includes(aiScoreValue) ? aiScoreValue : null;
    return { criterion, score, justification, aiScore };
  }).filter((row): row is NonNullable<typeof row> => row !== null);
  if (
    opts.state === "enviada" &&
    (parsedScores.length !== opts.rubric.criteria.length ||
      str(opts.payload.productsCompliance) === "indeterminado" ||
      !str(opts.payload.productsJustification))
  ) {
    throw new Error("Verifique los productos académicos y complete todas las justificaciones antes de enviar");
  }
  const totalWeight = opts.rubric.criteria.reduce(
    (total, criterion) => total + criterion.weight,
    0,
  );
  const weightedScore = parsedScores.length === opts.rubric.criteria.length
    ? Math.round(
    (parsedScores.reduce(
      (total, item) => total + item.criterion.weight * item.score,
      0,
    ) / (totalWeight * 10)) * 10000,
      ) / 100
    : null;
  const productsStatus = str(opts.payload.productsCompliance, "indeterminado");
  const failedRequired = parsedScores.some(
    (item) => item.criterion.required && item.score < 6,
  );
  const recommendation =
    weightedScore !== null &&
    weightedScore >= 70 &&
    !failedRequired &&
    productsStatus === "cumple"
      ? "recomienda"
      : "no_recomienda";

  const rubricResult = await client.query<{ id_rubrica: number }>(
    `INSERT INTO rubrica (codigo, nombre, modalidad_aplica, puntaje_maximo)
     VALUES ($1, $2, $3, 100)
     ON CONFLICT (codigo) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       modalidad_aplica = EXCLUDED.modalidad_aplica
     RETURNING id_rubrica`,
    [
      `${opts.rubric.code}_${opts.modality.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      opts.rubric.name,
      opts.modality,
    ],
  );
  const rubricId = rubricResult.rows[0].id_rubrica;
  const existingCriteria = await client.query<{
    id_criterio: number;
    numero: number;
    nombre: string;
  }>(
    `SELECT id_criterio, numero, nombre FROM rubrica_criterio WHERE id_rubrica = $1`,
    [rubricId],
  );
  const criteriaByNumber = new Map(
    existingCriteria.rows.map((criterion) => [criterion.numero, criterion]),
  );
  const criterionIds = new Map<number, number>();

  for (const criterion of opts.rubric.criteria) {
    let existing = criteriaByNumber.get(criterion.number);
    if (!existing) {
      const inserted = await client.query<{ id_criterio: number }>(
        `INSERT INTO rubrica_criterio (
           id_rubrica, seccion, numero, nombre, peso, puntaje_maximo, es_obligatorio
         ) VALUES ($1, $2, $3, $4, $5, 10, $6)
         RETURNING id_criterio`,
        [
          rubricId,
          criterion.section,
          criterion.number,
          criterion.name,
          criterion.weight * 100,
          criterion.required,
        ],
      );
      existing = {
        id_criterio: inserted.rows[0].id_criterio,
        numero: criterion.number,
        nombre: criterion.name,
      };
      criteriaByNumber.set(criterion.number, existing);
    }
    await client.query(
      `UPDATE rubrica_criterio SET seccion = $1, nombre = $2, peso = $3,
         puntaje_maximo = 10, es_obligatorio = $4
       WHERE id_criterio = $5`,
      [
        criterion.section,
        criterion.name,
        criterion.weight * 100,
        criterion.required,
        existing.id_criterio,
      ],
    );
    for (const level of criterion.levels) {
      await client.query(
        `INSERT INTO rubrica_nivel (id_criterio, puntaje, etiqueta, descripcion)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_criterio, puntaje) DO UPDATE SET
           etiqueta = EXCLUDED.etiqueta,
           descripcion = EXCLUDED.descripcion`,
        [
          existing.id_criterio,
          level.score,
          ({ 0: "Deficiente", 6: "Regular", 8: "Bueno", 10: "Excelente" })[level.score],
          level.description,
        ],
      );
    }
    criterionIds.set(criterion.number, existing.id_criterio);
  }

  const comments = JSON.stringify({
    productsCompliance: productsStatus,
    productsJustification: str(opts.payload.productsJustification),
    aiSummary: str(opts.payload.aiSummary),
    aiModel: str(opts.payload.aiModel),
    aiSuggestions: Array.isArray(opts.payload.aiSuggestions)
      ? opts.payload.aiSuggestions
      : [],
    aiProductsCompliance: asRecord(opts.payload.aiProductsCompliance),
  });
  const existingEvaluation = await client.query<{ id_evaluacion: number }>(
    `SELECT id_evaluacion FROM evaluacion
     WHERE id_propuesta = $1 AND id_evaluador = $2 AND instancia = 'comite'
     ORDER BY id_evaluacion DESC LIMIT 1`,
    [opts.proposalId, opts.evaluatorId],
  );
  const evaluationId = existingEvaluation.rows[0]
    ? (
        await client.query<{ id_evaluacion: number }>(
          `UPDATE evaluacion SET id_rubrica = $1, puntaje_total = $2,
             estado = $3, comentarios = $4,
             fecha_envio = CASE WHEN $3 = 'enviada' THEN NOW() ELSE NULL END
           WHERE id_evaluacion = $5 RETURNING id_evaluacion`,
          [rubricId, weightedScore, opts.state, comments, existingEvaluation.rows[0].id_evaluacion],
        )
      ).rows[0].id_evaluacion
    : (
        await client.query<{ id_evaluacion: number }>(
          `INSERT INTO evaluacion (
             id_propuesta, id_rubrica, id_evaluador, instancia,
             puntaje_total, estado, comentarios, fecha_envio
           ) VALUES ($1, $2, $3, 'comite', $4, $5, $6,
             CASE WHEN $5 = 'enviada' THEN NOW() ELSE NULL END)
           RETURNING id_evaluacion`,
          [opts.proposalId, rubricId, opts.evaluatorId, weightedScore, opts.state, comments],
        )
      ).rows[0].id_evaluacion;

  await client.query(`DELETE FROM evaluacion_puntaje WHERE id_evaluacion = $1`, [evaluationId]);
  for (const item of parsedScores) {
    const criterionId = criterionIds.get(item.criterion.number)!;
    const levelResult = await client.query<{ id_nivel: number }>(
      `SELECT id_nivel FROM rubrica_nivel
       WHERE id_criterio = $1 AND puntaje = $2`,
      [criterionId, item.score],
    );
    await client.query(
      `INSERT INTO evaluacion_puntaje (
         id_evaluacion, id_criterio, id_nivel, puntaje,
         puntaje_sugerido_ia, justificacion
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        evaluationId,
        criterionId,
        levelResult.rows[0]?.id_nivel ?? null,
        item.score,
        item.aiScore,
        item.justification,
      ],
    );
  }

  return { weightedScore, recommendation };
}

/** Listado de expedientes para la bandeja del rol actual. */
evaluacionesRouter.get(
  "/evaluaciones/bandeja",
  requireDemoAuth,
  async (req, res) => {
    const role = req.demoAuth!.role;
    const clause = bandejaClause(role);
    const result = await query<BandejaRow>(
      `${BANDEJA_SQL}${clause.sql}
       ORDER BY p.fecha_envio DESC NULLS LAST, p.id_propuesta DESC
       LIMIT 100`,
      clause.params,
    );
    res.json({
      role,
      items: result.rows.map(mapBandeja),
      total: result.rows.length,
    });
  },
);

/** Detalle de un expediente en bandeja (por id numérico). */
evaluacionesRouter.get(
  "/evaluaciones/propuestas/:id",
  requireDemoAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const result = await query<BandejaRow>(
      `${BANDEJA_SQL} AND p.id_propuesta = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    res.json(mapBandeja(row));
  },
);

evaluacionesRouter.get(
  "/evaluaciones/propuestas/:id/rubrica",
  requireDemoAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    const role = req.demoAuth!.role;
    if (role !== "comite_evaluador" && role !== "admin") {
      res.status(403).json({ error: "Solo el evaluador del comité puede consultar esta rúbrica" });
      return;
    }
    const result = await query<{ modalidad: string; estado_actual: string; etapa_flujo: number }>(
      `SELECT modalidad, estado_actual, etapa_flujo FROM propuesta WHERE id_propuesta = $1`,
      [id],
    );
    const proposal = result.rows[0];
    if (!proposal) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    if (
      proposal.estado_actual === "borrador" ||
      ![1, 2].includes(proposal.etapa_flujo)
    ) {
      res.status(400).json({ error: "La propuesta aún no está en evaluación del Comité Técnico" });
      return;
    }
    try {
      res.json({ rubric: await getOfficialRubric(proposal.modalidad) });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "No se pudo cargar la rúbrica oficial",
      });
    }
  },
);

evaluacionesRouter.get(
  "/evaluaciones/propuestas/:id/evaluacion-individual",
  requireDemoAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    const role = req.demoAuth!.role;
    if (role !== "comite_evaluador" && role !== "admin") {
      res.status(403).json({ error: "Solo el evaluador del comité puede consultar su evaluación" });
      return;
    }
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const proposal = await loadPropuesta(id);
    if (!proposal) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    try {
      const rubric = await getOfficialRubric(proposal.modalidad);
      const result = await query<{
        numero: number | null;
        puntaje: number | null;
        puntaje_sugerido_ia: number | null;
        justificacion: string | null;
        comentarios: string | null;
      }>(
        `SELECT rc.numero, ep.puntaje, ep.puntaje_sugerido_ia, ep.justificacion,
                ev.comentarios
         FROM evaluacion ev
         LEFT JOIN evaluacion_puntaje ep ON ep.id_evaluacion = ev.id_evaluacion
         LEFT JOIN rubrica_criterio rc ON rc.id_criterio = ep.id_criterio
         WHERE ev.id_propuesta = $1 AND ev.id_evaluador = $2 AND ev.instancia = 'comite'
         ORDER BY ev.id_evaluacion DESC, rc.numero`,
        [id, req.demoAuth!.userId!],
      );
      if (result.rows.length === 0) {
        res.json({ evaluation: null });
        return;
      }

      const first = result.rows[0];
      let comments: Record<string, unknown> = {};
      try {
        comments = first.comentarios ? JSON.parse(first.comentarios) as Record<string, unknown> : {};
      } catch {
        comments = {};
      }
      const criterionByNumber = new Map(
        rubric.criteria.map((criterion) => [criterion.number, criterion]),
      );
      const scores: Record<string, { score: number; reason: string }> = {};
      const aiScores: Record<string, number> = {};
      for (const row of result.rows) {
        if (row.numero === null) continue;
        const criterion = criterionByNumber.get(row.numero);
        if (!criterion) continue;
        if (row.puntaje !== null) {
          scores[criterion.id] = {
            score: Number(row.puntaje),
            reason: row.justificacion ?? "",
          };
        }
        if (row.puntaje_sugerido_ia !== null) {
          aiScores[criterion.id] = Number(row.puntaje_sugerido_ia);
        }
      }
      const validSuggestions = Array.isArray(comments.aiSuggestions)
        ? comments.aiSuggestions.flatMap((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return [];
            const suggestion = item as Record<string, unknown>;
            if (!rubric.criteria.some((criterion) => criterion.id === suggestion.id)) return [];
            return [{
              id: String(suggestion.id),
              score: Number(suggestion.score),
              justification: String(suggestion.justification ?? ""),
              evidence: String(suggestion.evidence ?? ""),
              missingInformation: String(suggestion.missingInformation ?? ""),
            }];
          })
        : [];
      const aiProducts = asRecord(comments.aiProductsCompliance);
      const productsStatus = str(comments.productsCompliance);
      res.json({
        evaluation: {
          scores,
          aiScores,
          productsCompliance:
            productsStatus === "cumple" || productsStatus === "no_cumple"
              ? productsStatus
              : "indeterminado",
          productsJustification: str(comments.productsJustification),
          aiSummary: str(comments.aiSummary),
          aiModel: str(comments.aiModel),
          aiSuggestions: validSuggestions,
          aiProductsCompliance: {
            status: aiProducts.status,
            justification: str(aiProducts.justification),
            evidence: str(aiProducts.evidence),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "No se pudo cargar la evaluación guardada",
      });
    }
  },
);

/** Genera sugerencias no vinculantes usando la rúbrica oficial de la modalidad. */
evaluacionesRouter.post(
  "/evaluaciones/propuestas/:id/sugerencia-ia",
  requireDemoAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    const role = req.demoAuth!.role;
    if (role !== "comite_evaluador" && role !== "admin") {
      res.status(403).json({ error: "Solo el evaluador del comité puede solicitar sugerencias de IA" });
      return;
    }
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "id inválido" });
      return;
    }

    const proposalResult = await query<Record<string, unknown>>(
      `SELECT p.id_propuesta, p.codigo, p.titulo, p.modalidad, p.resumen,
              p.abstract_en AS "abstractEn", p.problema,
              p.objetivo_general AS "objetivoGeneral", p.estado_arte AS "estadoArte",
              p.metodologia, p.hoja_ruta AS "hojaRuta", p.referencias,
              p.divulgacion, p.trl_actual AS "trlActual", p.trl_esperado AS "trlEsperado",
              p.estado_actual AS "estadoActual", p.etapa_flujo AS "etapaFlujo",
              e.nombre AS escuela, c.nombre AS convocatoria
       FROM propuesta p
       JOIN escuela e ON e.id_escuela = p.id_escuela
       JOIN convocatoria c ON c.id_convocatoria = p.id_convocatoria
       WHERE p.id_propuesta = $1`,
      [id],
    );
    const proposal = proposalResult.rows[0];
    if (!proposal) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    if (
      proposal.estadoActual === "borrador" ||
      ![1, 2].includes(Number(proposal.etapaFlujo))
    ) {
      res.status(400).json({ error: "La propuesta aún no está en evaluación del Comité Técnico" });
      return;
    }

    try {
      const [rubric, participants, objectives, actionPlan, budgets, financing, products, generalAnswers, ethics, permissions, piReview] = await Promise.all([
        getOfficialRubric(String(proposal.modalidad ?? "")),
        query<Record<string, unknown>>(
          `SELECT pp.tipo, pp.instancia_o_institucion AS instancia,
                  pp.rol_en_proyecto AS rol,
                  COALESCE(SUM(pph.cantidad_horas), 0)::text AS horas
           FROM propuesta_participante pp
           LEFT JOIN propuesta_participante_hora pph
             ON pph.id_participante = pp.id_participante
           WHERE pp.id_propuesta = $1
           GROUP BY pp.id_participante`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT numero, descripcion FROM propuesta_objetivo_especifico
           WHERE id_propuesta = $1 ORDER BY numero`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT ap.numero, oe.numero AS "numeroObjetivo", oe.descripcion AS objetivo,
                  ap.descripcion, ap.resultado_esperado AS "resultadoEsperado",
                  ap.responsabilidad, ap.mes_inicio AS "mesInicio",
                  ap.duracion_meses AS "duracionMeses",
                  COALESCE((SELECT json_agg(json_build_object(
                    'responsabilidad', apu.responsabilidad
                  )) FROM actividad_participante apu
                    WHERE apu.id_actividad = ap.id_actividad), '[]'::json) AS participantes,
                  COALESCE((SELECT json_agg(json_build_object(
                    'riesgo', ar.riesgo_identificado,
                    'mitigacion', ar.medida_mitigacion
                  )) FROM actividad_riesgo ar
                    WHERE ar.id_actividad = ap.id_actividad), '[]'::json) AS riesgos
           FROM actividad_plan ap
           JOIN propuesta_objetivo_especifico oe ON oe.id_objetivo = ap.id_objetivo
           WHERE ap.id_propuesta = $1 ORDER BY oe.numero, ap.numero`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT anio, monto_operativo AS operativo,
                  monto_bienes_duraderos AS duraderos, monto_total AS total
           FROM propuesta_presupuesto_anual WHERE id_propuesta = $1 ORDER BY anio`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT tipo, anio, monto, numero_oficio AS oficio
           FROM propuesta_financiamiento WHERE id_propuesta = $1 ORDER BY anio`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT ambito, codigo_opcion AS tipo, descripcion, cantidad
           FROM propuesta_producto WHERE id_propuesta = $1 ORDER BY id_producto`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT codigo_pregunta AS codigo, respuesta, detalle
           FROM propuesta_pregunta_general WHERE id_propuesta = $1 ORDER BY numero_pregunta`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT involucra_humanos AS humanos,
                  involucra_biodiversidad AS biodiversidad,
                  involucra_animales AS animales,
                  involucra_pueblos_indigenas AS pueblosIndigenas,
                  justificacion_exencion AS justificacionExencion
           FROM aspecto_etico WHERE id_propuesta = $1`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT ente, detalle, estado_tramite AS estado
           FROM permiso_etico WHERE id_propuesta = $1 ORDER BY id_permiso`,
          [id],
        ),
        query<Record<string, unknown>>(
          `SELECT potencial_proteccion AS potencialProteccion,
                  es_innovador AS esInnovador, activo_identificable AS activo,
                  mecanismo_pi AS mecanismo, novedad, titularidad,
                  analisis_tecnico AS analisis, recomendaciones_vinculacion AS recomendaciones
           FROM dictamen_pi WHERE id_propuesta = $1`,
          [id],
        ),
      ]);

      const suggestion = await requestAiEvaluation(
        {
          proposal,
          participants: participants.rows,
          objectives: objectives.rows,
          actionPlan: actionPlan.rows,
          budgets: budgets.rows,
          financing: financing.rows,
          products: products.rows,
          generalAnswers: generalAnswers.rows,
          ethics: ethics.rows[0] ?? null,
          ethicalPermits: permissions.rows,
          intellectualPropertyReview: piReview.rows[0] ?? null,
        },
        rubric,
      );
      const totalWeight = rubric.criteria.reduce((total, criterion) => total + criterion.weight, 0);
      const weightedScore = Math.round(
        (rubric.criteria.reduce((total, criterion) => {
          const scored = suggestion.criteria.find((item) => item.id === criterion.id)!;
          return total + criterion.weight * scored.score;
        }, 0) / (totalWeight * 10)) * 1000,
      ) / 10;
      const failedRequired = rubric.criteria.some((criterion) =>
        criterion.required &&
        (suggestion.criteria.find((item) => item.id === criterion.id)?.score ?? 0) < 6,
      );

      res.json({
        rubric,
        suggestion,
        weightedScore,
        recommendation: weightedScore >= 70 && !failedRequired ? "RECOMIENDA" : "NO RECOMIENDA",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al generar sugerencias";
      const status = message.includes("OPENROUTER_API_KEY") ? 503 : 502;
      res.status(status).json({ error: message });
    }
  },
);

/**
 * Ejecuta una acción de evaluación del prototipo.
 * Body: { action: string, payload?: object }
 */
evaluacionesRouter.post(
  "/evaluaciones/propuestas/:id/acciones",
  requireDemoAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    const action = str(req.body?.action);
    const payload = asRecord(req.body?.payload);
    const role = req.demoAuth!.role;
    const userId = req.demoAuth!.userId!;

    if (!Number.isFinite(id) || !action) {
      res.status(400).json({ error: "id y action son obligatorios" });
      return;
    }
    if (!roleOk(role, action)) {
      res.status(403).json({
        error: `El rol ${role ?? "(ninguno)"} no puede ejecutar la acción "${action}"`,
      });
      return;
    }

    const propuesta = await loadPropuesta(id);
    if (!propuesta) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    if (propuesta.estado_actual === "borrador") {
      res.status(400).json({ error: "La propuesta aún está en borrador" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let message = "Acción registrada";
      const prev = propuesta.estado_actual;

      switch (action) {
        case "pi": {
          const oficio =
            str(payload.oficio) ||
            `CV-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const fecha = str(payload.fecha) || new Date().toISOString().slice(0, 10);
          await client.query(
            `
            INSERT INTO dictamen_pi (
              id_propuesta, id_emisor, potencial_proteccion, es_innovador,
              activo_identificable, mecanismo_pi, novedad, titularidad,
              recomendaciones_divulgacion, confidencialidad, analisis_tecnico,
              recomendaciones_vinculacion, numero_oficio, fecha_dictamen, estado
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::date, 'emitido'
            )
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_emisor = EXCLUDED.id_emisor,
              potencial_proteccion = EXCLUDED.potencial_proteccion,
              es_innovador = EXCLUDED.es_innovador,
              activo_identificable = EXCLUDED.activo_identificable,
              mecanismo_pi = EXCLUDED.mecanismo_pi,
              novedad = EXCLUDED.novedad,
              titularidad = EXCLUDED.titularidad,
              recomendaciones_divulgacion = EXCLUDED.recomendaciones_divulgacion,
              confidencialidad = EXCLUDED.confidencialidad,
              analisis_tecnico = EXCLUDED.analisis_tecnico,
              recomendaciones_vinculacion = EXCLUDED.recomendaciones_vinculacion,
              numero_oficio = EXCLUDED.numero_oficio,
              fecha_dictamen = EXCLUDED.fecha_dictamen,
              estado = 'emitido'
            `,
            [
              id,
              userId,
              yes(payload.potencial),
              yes(payload.innovacion),
              str(payload.tipoActivo).slice(0, 200) || null,
              str(payload.tipoPI).slice(0, 200) || null,
              str(payload.novedad) || null,
              str(payload.titularidad) || null,
              str(payload.divulgacion) || null,
              str(payload.confidencialidad) || null,
              str(payload.analisis) || null,
              str(payload.recomendaciones) || null,
              oficio.slice(0, 40),
              fecha,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "en_evaluacion",
            etapa: Math.max(propuesta.etapa_flujo, 2),
            userId,
            observacion: `Dictamen PI emitido (${oficio})`,
          });
          message = "Dictamen de PI emitido y oficio agregado al expediente.";
          break;
        }

        case "committee-ready": {
          await client.query(
            `
            INSERT INTO revision_expediente (
              id_propuesta, etapa, ciclo, id_revisor, resultado, fecha_inicio, fecha_fin
            ) VALUES ($1, 'comite', 1, $2, 'completo', NOW(), NOW())
            ON CONFLICT (id_propuesta, etapa, ciclo) DO UPDATE SET
              id_revisor = EXCLUDED.id_revisor,
              resultado = 'completo',
              fecha_fin = NOW()
            `,
            [id, userId],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "en_evaluacion",
            etapa: Math.max(propuesta.etapa_flujo, 2),
            userId,
            observacion: "Expediente marcado completo para el cuerpo evaluador",
          });
          message = "Propuesta enviada al cuerpo evaluador.";
          break;
        }

        case "return": {
          const texto = str(payload.texto);
          if (!texto) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La observación es obligatoria" });
            return;
          }
          const rev = await client.query<{ id_revision: number }>(
            `
            INSERT INTO revision_expediente (
              id_propuesta, etapa, ciclo, id_revisor, resultado, fecha_inicio, fecha_fin
            ) VALUES ($1, 'comite', 1, $2, 'devuelto', NOW(), NOW())
            ON CONFLICT (id_propuesta, etapa, ciclo) DO UPDATE SET
              id_revisor = EXCLUDED.id_revisor,
              resultado = 'devuelto',
              fecha_fin = NOW()
            RETURNING id_revision
            `,
            [id, userId],
          );
          const idRevision = rev.rows[0]?.id_revision;
          await client.query(
            `
            INSERT INTO observacion (
              id_propuesta, id_revision, etapa, id_creada_por, mensaje,
              requiere_respuesta, fecha_creacion
            ) VALUES ($1, $2, 'comite', $3, $4, true, NOW())
            `,
            [id, idRevision ?? null, userId, texto],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "enviada",
            etapa: 1,
            userId,
            observacion: `Devuelta con observaciones: ${texto.slice(0, 200)}`,
          });
          message = "Propuesta devuelta con observaciones.";
          break;
        }

        case "save-rubric": {
          if (role === "comite_evaluador" || role === "admin") {
            const rubric = await getOfficialRubric(propuesta.modalidad);
            await persistCommitteeEvaluation(client, {
              proposalId: id,
              evaluatorId: userId,
              modality: propuesta.modalidad,
              rubric,
              payload,
              state: "borrador",
            });
          }
          message = "Los cambios de la evaluación se guardaron correctamente.";
          break;
        }

        case "committee-score": {
          const rubric = await getOfficialRubric(propuesta.modalidad);
          const savedEvaluation = await persistCommitteeEvaluation(client, {
            proposalId: id,
            evaluatorId: userId,
            modality: propuesta.modalidad,
            rubric,
            payload,
            state: "enviada",
          });
          const promedio = savedEvaluation.weightedScore;
          const oficio =
            str(payload.oficio) ||
            `CT-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const fundamento =
            str(payload.fundamento) ||
            str(payload.texto) ||
            "Evaluación del Comité Técnico registrada desde el prototipo.";
          await client.query(
            `
            INSERT INTO resultado_comite (
              id_propuesta, recomendacion, calificacion_promedio, numero_oficio,
              fundamento, fecha_dictamen, id_coordinador_comite
            ) VALUES ($1, $6, $2, $3, $4, CURRENT_DATE, $5)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              recomendacion = EXCLUDED.recomendacion,
              calificacion_promedio = EXCLUDED.calificacion_promedio,
              numero_oficio = EXCLUDED.numero_oficio,
              fundamento = EXCLUDED.fundamento,
              fecha_dictamen = CURRENT_DATE,
              id_coordinador_comite = EXCLUDED.id_coordinador_comite
            `,
            [
              id,
              Number.isFinite(promedio) ? promedio : 80,
              oficio.slice(0, 40),
              fundamento,
              userId,
              savedEvaluation.recommendation,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "dictaminada",
            etapa: Math.max(propuesta.etapa_flujo, 3),
            userId,
            observacion: `Dictamen del Comité (${oficio})`,
          });
          message = savedEvaluation.recommendation === "recomienda"
            ? "Evaluación completada y preparada para consolidación."
            : "Evaluación completada con recomendación desfavorable.";
          break;
        }

        case "send-council": {
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: prev === "dictaminada" ? "dictaminada" : "en_evaluacion",
            etapa: Math.max(propuesta.etapa_flujo, 3),
            userId,
            observacion: "Expediente enviado al Consejo de Profesores",
          });
          message = "Expediente enviado al Consejo de Profesores.";
          break;
        }

        case "council-approve":
        case "council-reject": {
          const texto = str(payload.texto);
          if (!texto) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La justificación es obligatoria" });
            return;
          }
          const aprueba = action === "council-approve";
          const oficio =
            str(payload.oficio) ||
            `ESC-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          await client.query(
            `
            INSERT INTO aval_consejo (
              id_propuesta, id_aprobador, resultado, articulo,
              numero_oficio, observaciones, fecha_aval
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_aprobador = EXCLUDED.id_aprobador,
              resultado = EXCLUDED.resultado,
              articulo = EXCLUDED.articulo,
              numero_oficio = EXCLUDED.numero_oficio,
              observaciones = EXCLUDED.observaciones,
              fecha_aval = CURRENT_DATE
            `,
            [
              id,
              userId,
              aprueba ? "aprueba" : "rechaza",
              "Art. 12 del Reglamento",
              oficio.slice(0, 40),
              texto,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: aprueba ? "avalada" : "rechazada",
            etapa: aprueba ? Math.max(propuesta.etapa_flujo, 4) : 6,
            userId,
            observacion: aprueba
              ? `Aval aprobado (${oficio})`
              : `Aval rechazado (${oficio}): ${texto.slice(0, 200)}`,
          });
          message = aprueba
            ? "Aval aprobado y oficio generado."
            : "Aval rechazado correctamente. Justificación registrada.";
          break;
        }

        case "communicate-aval": {
          await client.query(
            `
            INSERT INTO comunicacion_institucional (
              id_propuesta, tipo, id_emisor, destinatario_texto,
              confirmada, fecha_envio, mensaje
            ) VALUES ($1, 'aval_consejo', $2, 'VIE / Dirección de Investigación', false, NOW(), $3)
            `,
            [
              id,
              userId,
              `Comunicación de aval de la propuesta ${propuesta.codigo}`,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: prev === "rechazada" ? "rechazada" : "avalada",
            etapa: Math.max(propuesta.etapa_flujo, 4),
            userId,
            observacion: "Aval comunicado a VIE",
          });
          message =
            "Memorando generado · Envío simulado a Dirección de Investigación / VIE.";
          break;
        }

        case "vie-observation": {
          const texto = str(payload.texto);
          if (!texto) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La observación es obligatoria" });
            return;
          }
          await client.query(
            `
            INSERT INTO observacion (
              id_propuesta, etapa, id_creada_por, mensaje,
              requiere_respuesta, fecha_creacion
            ) VALUES ($1, 'vie', $2, $3, true, NOW())
            `,
            [id, userId, texto],
          );
          message = "Observación enviada correctamente al equipo investigador.";
          break;
        }

        case "send-cie": {
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "avalada",
            etapa: Math.max(propuesta.etapa_flujo, 5),
            userId,
            observacion: "Expediente remitido al CIE",
          });
          message = "Expediente enviado al CIE.";
          break;
        }

        case "cie-approve":
        case "cie-reject": {
          const fundamento =
            str(payload.texto) ||
            str(payload.fundamento) ||
            (action === "cie-approve"
              ? "Resolución aprobatoria del CIE."
              : "Resolución de rechazo del CIE.");
          if (action === "cie-reject" && !str(payload.texto) && !str(payload.fundamento)) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La justificación es obligatoria" });
            return;
          }
          const numero =
            str(payload.numero) ||
            `CIE-RES-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const resultado = action === "cie-approve" ? "aprobada" : "rechazada";
          await client.query(
            `
            INSERT INTO resolucion_cie (
              id_propuesta, id_responsable, resultado, numero_resolucion,
              fundamento, fecha_resolucion
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_responsable = EXCLUDED.id_responsable,
              resultado = EXCLUDED.resultado,
              numero_resolucion = EXCLUDED.numero_resolucion,
              fundamento = EXCLUDED.fundamento,
              fecha_resolucion = CURRENT_DATE
            `,
            [id, userId, resultado, numero.slice(0, 40), fundamento],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: resultado,
            etapa: 6,
            userId,
            observacion: `Resolución CIE ${numero}: ${resultado}`,
          });
          message =
            action === "cie-approve"
              ? "Resolución aprobatoria emitida."
              : "Resolución de rechazo emitida. Justificación registrada.";
          break;
        }

        case "notify-resolution": {
          await client.query(
            `
            INSERT INTO notificacion (
              id_usuario_destino, id_propuesta, titulo, mensaje, leida, fecha_hora
            ) VALUES ($1, $2, $3, $4, false, NOW())
            `,
            [
              propuesta.id_coordinador,
              id,
              `Resolución de ${propuesta.codigo}`,
              `Se notificó formalmente el resultado de la propuesta «${propuesta.titulo}».`,
            ],
          );
          await client.query(
            `
            INSERT INTO comunicacion_institucional (
              id_propuesta, tipo, id_emisor, id_destinatario,
              confirmada, fecha_envio, mensaje
            ) VALUES ($1, 'resolucion_cie', $2, $3, true, NOW(), $4)
            `,
            [
              id,
              userId,
              propuesta.id_coordinador,
              `Notificación de resolución de ${propuesta.codigo}`,
            ],
          );
          message =
            "CIE-453 generado · notificación simulada · expediente en Histórico.";
          break;
        }

        default:
          await client.query("ROLLBACK");
          res.status(400).json({ error: `Acción desconocida: ${action}` });
          return;
      }

      await client.query("COMMIT");

      const refreshed = await query<BandejaRow>(
        `${BANDEJA_SQL} AND p.id_propuesta = $1`,
        [id],
      );
      res.json({
        message,
        action,
        propuesta: refreshed.rows[0] ? mapBandeja(refreshed.rows[0]) : null,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[evaluaciones]", action, detail);
      res.status(500).json({ error: "No se pudo persistir la acción", detail });
    } finally {
      client.release();
    }
  },
);
