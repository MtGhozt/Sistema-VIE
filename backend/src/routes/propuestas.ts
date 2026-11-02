import { Router } from "express";
import { pool, query } from "../db.js";
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

const ESTADO_ARTE_MAX_WORDS = 1000;

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
  estado_arte: string | null;
  metodologia: string | null;
  estado_actual: string;
  etapa_flujo: number;
  fecha_envio: string | null;
  convocatoria_nombre: string;
  coordinador_nombre: string;
  escuela_nombre: string;
};

type PreguntaGeneralInput = {
  numero: number;
  codigo: string;
  respuesta: string;
  detalle: string | null;
};

type ObjetivoEspecificoInput = {
  id?: number;
  descripcion: string;
};

type PlanAccionInput = {
  objetivoNumero: number;
  actividad: string;
  resultadoEsperado: string;
  participantes: { iniciales: string; responsabilidad: string }[];
  riesgos: { riesgo: string; mitigacion: string; responsable: string }[];
  mesInicio: number;
  duracionMeses: number;
};

type ParticipanteInput =
  | {
      id?: number;
      tipo: "funcionario_tec";
      nombre: string;
      iniciales: string;
      orcid: string;
      instancia: string;
      rol: string;
      periodo: string;
      horas: { tipo: string; cantidad: number }[];
    }
  | {
      id?: number;
      tipo: "colaborador_externo";
      nombre: string;
      iniciales: string;
      orcid: string;
      institucion: string;
    };

const TEAM_HOUR_TYPES = new Set([
  "REC",
  "CONS",
  "DOC VIE",
  "VIESA",
  "VIE-Centro",
]);

const TEAM_MEMBER_ROLES = new Set([
  "Coordinador",
  "Investigador",
  "Investigador a contratar",
  "Funcionario administrativo",
  "Estudiante de posgrado",
]);

const PLAN_RESPONSIBILITIES = new Set([
  "Ejecuta",
  "Supervisa",
  "Participa",
]);

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
    estadoArte: row.estado_arte,
    metodologia: row.metodologia,
    estadoActual: row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
  };
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
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

async function loadKeywords(idPropuesta: number) {
  const result = await query<{ idioma: string; palabra: string }>(
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
) {
  if (keywordsEs === undefined && keywordsEn === undefined) return;
  await query(`DELETE FROM propuesta_palabra_clave WHERE id_propuesta = $1`, [
    idPropuesta,
  ]);
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
    await query(
      `
      INSERT INTO propuesta_palabra_clave (id_propuesta, idioma, palabra)
      VALUES ($1, $2, $3)
      `,
      [idPropuesta, idioma, palabra.slice(0, 100)],
    );
  }
}

async function loadPreguntasGenerales(idPropuesta: number) {
  const result = await query<{
    numero_pregunta: number;
    codigo_pregunta: string;
    respuesta: string;
    detalle: string | null;
  }>(
    `
    SELECT numero_pregunta, codigo_pregunta, respuesta, detalle
    FROM propuesta_pregunta_general
    WHERE id_propuesta = $1
    ORDER BY numero_pregunta
    `,
    [idPropuesta],
  );
  return result.rows.map((row) => ({
    numero: row.numero_pregunta,
    codigo: row.codigo_pregunta,
    respuesta: row.respuesta,
    detalle: row.detalle,
  }));
}

function parsePreguntasGenerales(value: unknown):
  | PreguntaGeneralInput[]
  | undefined
  | null {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return null;

  const preguntas: PreguntaGeneralInput[] = [];
  const codigos = new Set<string>();
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.numero !== "number" ||
      !Number.isInteger(row.numero) ||
      row.numero < 1 ||
      row.numero > 10 ||
      typeof row.codigo !== "string" ||
      !/^[a-z0-9_]{1,40}$/.test(row.codigo) ||
      typeof row.respuesta !== "string" ||
      row.respuesta.length < 1 ||
      row.respuesta.length > 20 ||
      (row.detalle !== null && typeof row.detalle !== "string") ||
      codigos.has(row.codigo)
    ) {
      return null;
    }
    codigos.add(row.codigo);
    preguntas.push({
      numero: row.numero,
      codigo: row.codigo,
      respuesta: row.respuesta,
      detalle: row.detalle,
    });
  }
  return preguntas;
}

async function replacePreguntasGenerales(
  idPropuesta: number,
  preguntas: PreguntaGeneralInput[] | undefined,
) {
  if (preguntas === undefined) return;
  for (const pregunta of preguntas) {
    await query(
      `
      INSERT INTO propuesta_pregunta_general (
        id_propuesta, numero_pregunta, codigo_pregunta, respuesta, detalle
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id_propuesta, codigo_pregunta)
      DO UPDATE SET
        numero_pregunta = EXCLUDED.numero_pregunta,
        respuesta = EXCLUDED.respuesta,
        detalle = EXCLUDED.detalle
      `,
      [
        idPropuesta,
        pregunta.numero,
        pregunta.codigo,
        pregunta.respuesta,
        pregunta.detalle,
      ],
    );
  }
}

function parseObjetivosEspecificos(
  value: unknown,
): ObjetivoEspecificoInput[] | undefined | null {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length !== 3) return null;

  const objetivos: ObjetivoEspecificoInput[] = [];
  const ids = new Set<number>();
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const row = item as Record<string, unknown>;
    if (
      (row.id !== undefined &&
        (typeof row.id !== "number" ||
          !Number.isInteger(row.id) ||
          row.id < 1 ||
          ids.has(row.id))) ||
      typeof row.descripcion !== "string" ||
      row.descripcion.length > 5000
    ) {
      return null;
    }
    if (typeof row.id === "number") ids.add(row.id);
    objetivos.push({
      ...(typeof row.id === "number" ? { id: row.id } : {}),
      descripcion: row.descripcion.trim(),
    });
  }
  return objetivos;
}

function parsePlanAccion(value: unknown): PlanAccionInput[] | undefined | null {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 200) return null;

  const activities: PlanAccionInput[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.objetivoNumero !== "number" ||
      !Number.isInteger(row.objetivoNumero) ||
      row.objetivoNumero < 1 ||
      row.objetivoNumero > 3 ||
      typeof row.actividad !== "string" ||
      !row.actividad.trim() ||
      row.actividad.length > 5000 ||
      typeof row.resultadoEsperado !== "string" ||
      !row.resultadoEsperado.trim() ||
      row.resultadoEsperado.length > 5000 ||
      !Array.isArray(row.participantes) ||
      row.participantes.length === 0 ||
      row.participantes.length > 50 ||
      !Array.isArray(row.riesgos) ||
      row.riesgos.length === 0 ||
      row.riesgos.length > 50 ||
      typeof row.mesInicio !== "number" ||
      !Number.isInteger(row.mesInicio) ||
      row.mesInicio < 1 ||
      typeof row.duracionMeses !== "number" ||
      !Number.isInteger(row.duracionMeses) ||
      row.duracionMeses < 1 ||
      row.mesInicio + row.duracionMeses - 1 > 36
    ) {
      return null;
    }

    const participantes: PlanAccionInput["participantes"] = [];
    const initials = new Set<string>();
    for (const participant of row.participantes) {
      if (
        typeof participant !== "object" ||
        participant === null ||
        Array.isArray(participant)
      ) {
        return null;
      }
      const person = participant as Record<string, unknown>;
      if (
        typeof person.iniciales !== "string" ||
        !person.iniciales.trim() ||
        person.iniciales.length > 10 ||
        typeof person.responsabilidad !== "string" ||
        !PLAN_RESPONSIBILITIES.has(person.responsabilidad) ||
        initials.has(person.iniciales.trim().toUpperCase())
      ) {
        return null;
      }
      const normalizedInitials = person.iniciales.trim().toUpperCase();
      initials.add(normalizedInitials);
      participantes.push({
        iniciales: normalizedInitials,
        responsabilidad: person.responsabilidad,
      });
    }

    const riesgos: PlanAccionInput["riesgos"] = [];
    for (const risk of row.riesgos) {
      if (typeof risk !== "object" || risk === null || Array.isArray(risk)) {
        return null;
      }
      const riskRow = risk as Record<string, unknown>;
      if (
        typeof riskRow.riesgo !== "string" ||
        !riskRow.riesgo.trim() ||
        riskRow.riesgo.length > 5000 ||
        typeof riskRow.mitigacion !== "string" ||
        !riskRow.mitigacion.trim() ||
        riskRow.mitigacion.length > 5000 ||
        typeof riskRow.responsable !== "string" ||
        !riskRow.responsable.trim() ||
        riskRow.responsable.length > 150
      ) {
        return null;
      }
      riesgos.push({
        riesgo: riskRow.riesgo.trim(),
        mitigacion: riskRow.mitigacion.trim(),
        responsable: riskRow.responsable.trim(),
      });
    }

    activities.push({
      objetivoNumero: row.objetivoNumero,
      actividad: row.actividad.trim(),
      resultadoEsperado: row.resultadoEsperado.trim(),
      participantes,
      riesgos,
      mesInicio: row.mesInicio,
      duracionMeses: row.duracionMeses,
    });
  }
  return activities;
}

async function loadObjetivosEspecificos(idPropuesta: number) {
  const result = await query<{
    id_objetivo: number;
    numero: number;
    descripcion: string;
  }>(
    `
    SELECT id_objetivo, numero, descripcion
    FROM propuesta_objetivo_especifico
    WHERE id_propuesta = $1
    ORDER BY numero
    `,
    [idPropuesta],
  );
  return result.rows.map((row) => ({
    id: row.id_objetivo,
    numero: row.numero,
    descripcion: row.descripcion,
  }));
}

async function loadPlanAccion(idPropuesta: number) {
  const activities = await query<{
    id_actividad: number;
    id_objetivo: number;
    numero_objetivo: number;
    descripcion: string;
    resultado_esperado: string | null;
    mes_inicio: number | null;
    duracion_meses: string | number | null;
  }>(
    `
    SELECT ap.id_actividad, ap.id_objetivo, oe.numero AS numero_objetivo,
      ap.descripcion, ap.resultado_esperado, ap.mes_inicio, ap.duracion_meses
    FROM actividad_plan ap
    JOIN propuesta_objetivo_especifico oe
      ON oe.id_objetivo = ap.id_objetivo
    WHERE ap.id_propuesta = $1
    ORDER BY oe.numero, ap.numero
    `,
    [idPropuesta],
  );
  const activityIds = activities.rows.map((activity) => activity.id_actividad);
  const participantsByActivity = new Map<number, PlanAccionParticipante[]>();
  const risksByActivity = new Map<number, PlanAccionRiesgo[]>();

  if (activityIds.length > 0) {
    const assignments = await query<{
      id_actividad: number;
      id_participante: number | null;
      nombre_completo: string | null;
      iniciales: string | null;
      responsabilidad: string | null;
    }>(
      `
      SELECT ap.id_actividad, ap.id_participante,
        pp.nombre_completo,
        COALESCE(ap.iniciales, pp.iniciales, '') AS iniciales,
        ap.responsabilidad
      FROM actividad_participante ap
      LEFT JOIN propuesta_participante pp
        ON pp.id_participante = ap.id_participante
      WHERE ap.id_actividad = ANY($1::int[])
      ORDER BY ap.id_actividad_participante
      `,
      [activityIds],
    );
    for (const assignment of assignments.rows) {
      const current = participantsByActivity.get(assignment.id_actividad) ?? [];
      current.push({
        idParticipante: assignment.id_participante,
        nombre: assignment.nombre_completo ?? "",
        iniciales: assignment.iniciales ?? "",
        responsabilidad: assignment.responsabilidad ?? "",
      });
      participantsByActivity.set(assignment.id_actividad, current);
    }

    const risks = await query<{
      id_actividad: number;
      riesgo_identificado: string;
      medida_mitigacion: string;
      responsable_gestion: string | null;
    }>(
      `
      SELECT id_actividad, riesgo_identificado, medida_mitigacion,
        responsable_gestion
      FROM actividad_riesgo
      WHERE id_actividad = ANY($1::int[])
      ORDER BY id_riesgo
      `,
      [activityIds],
    );
    for (const risk of risks.rows) {
      const current = risksByActivity.get(risk.id_actividad) ?? [];
      current.push({
        riesgo: risk.riesgo_identificado,
        mitigacion: risk.medida_mitigacion,
        responsable: risk.responsable_gestion ?? "",
      });
      risksByActivity.set(risk.id_actividad, current);
    }
  }

  return activities.rows.map((activity) => ({
    id: activity.id_actividad,
    objetivoId: activity.id_objetivo,
    objetivoNumero: activity.numero_objetivo,
    actividad: activity.descripcion,
    resultadoEsperado: activity.resultado_esperado ?? "",
    participantes: participantsByActivity.get(activity.id_actividad) ?? [],
    riesgos: risksByActivity.get(activity.id_actividad) ?? [],
    mesInicio: activity.mes_inicio ?? 1,
    duracionMeses: Number(activity.duracion_meses ?? 1),
  }));
}

type PlanAccionParticipante = {
  idParticipante: number | null;
  nombre: string;
  iniciales: string;
  responsabilidad: string;
};

type PlanAccionRiesgo = {
  riesgo: string;
  mitigacion: string;
  responsable: string;
};

async function replacePlanAccion(
  idPropuesta: number,
  activities: PlanAccionInput[] | undefined,
): Promise<"saved" | "invalid_objective" | "invalid_participant"> {
  if (activities === undefined) return "saved";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const objectives = await client.query<{
      id_objetivo: number;
      numero: number;
    }>(
      `
      SELECT id_objetivo, numero
      FROM propuesta_objetivo_especifico
      WHERE id_propuesta = $1
      FOR UPDATE
      `,
      [idPropuesta],
    );
    const objectiveIds = new Map(
      objectives.rows.map((objective) => [objective.numero, objective.id_objetivo]),
    );
    if (activities.some((activity) => !objectiveIds.has(activity.objetivoNumero))) {
      await client.query("ROLLBACK");
      return "invalid_objective";
    }

    const participants = await client.query<{
      id_participante: number;
      nombre_completo: string;
      iniciales: string | null;
    }>(
      `
      SELECT id_participante, nombre_completo, iniciales
      FROM propuesta_participante
      WHERE id_propuesta = $1
      `,
      [idPropuesta],
    );
    const participantsByInitials = new Map<
      string,
      { id: number; nombre: string }
    >();
    const duplicateInitials = new Set<string>();
    for (const participant of participants.rows) {
      const initials = participant.iniciales?.trim().toUpperCase();
      if (!initials) continue;
      if (participantsByInitials.has(initials)) {
        duplicateInitials.add(initials);
      } else {
        participantsByInitials.set(initials, {
          id: participant.id_participante,
          nombre: participant.nombre_completo,
        });
      }
    }
    if (
      activities.some((activity) =>
        activity.participantes.some((assignment) => {
          const initials = assignment.iniciales.toUpperCase();
          return (
            !participantsByInitials.has(initials) ||
            duplicateInitials.has(initials)
          );
        }),
      )
    ) {
      await client.query("ROLLBACK");
      return "invalid_participant";
    }

    const existing = await client.query<{ id_actividad: number }>(
      `SELECT id_actividad FROM actividad_plan WHERE id_propuesta = $1 FOR UPDATE`,
      [idPropuesta],
    );
    const existingIds = existing.rows.map((activity) => activity.id_actividad);
    if (existingIds.length > 0) {
      await client.query(
        `DELETE FROM actividad_participante WHERE id_actividad = ANY($1::int[])`,
        [existingIds],
      );
      await client.query(
        `DELETE FROM actividad_riesgo WHERE id_actividad = ANY($1::int[])`,
        [existingIds],
      );
      await client.query(
        `DELETE FROM actividad_plan WHERE id_actividad = ANY($1::int[])`,
        [existingIds],
      );
    }

    const activityNumbers = new Map<number, number>();
    for (const activity of activities) {
      const objectiveId = objectiveIds.get(activity.objetivoNumero)!;
      const activityNumber =
        (activityNumbers.get(activity.objetivoNumero) ?? 0) + 1;
      activityNumbers.set(activity.objetivoNumero, activityNumber);
      const inserted = await client.query<{ id_actividad: number }>(
        `
        INSERT INTO actividad_plan (
          id_propuesta, id_objetivo, numero, descripcion,
          resultado_esperado, mes_inicio, duracion_meses
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_actividad
        `,
        [
          idPropuesta,
          objectiveId,
          activityNumber,
          activity.actividad,
          activity.resultadoEsperado,
          activity.mesInicio,
          activity.duracionMeses,
        ],
      );
      const activityId = inserted.rows[0].id_actividad;
      for (const assignment of activity.participantes) {
        const participant = participantsByInitials.get(
          assignment.iniciales.toUpperCase(),
        )!;
        await client.query(
          `
          INSERT INTO actividad_participante (
            id_actividad, id_participante, iniciales, responsabilidad
          ) VALUES ($1, $2, $3, $4)
          `,
          [
            activityId,
            participant.id,
            assignment.iniciales,
            assignment.responsabilidad,
          ],
        );
      }
      for (const risk of activity.riesgos) {
        await client.query(
          `
          INSERT INTO actividad_riesgo (
            id_actividad, riesgo_identificado, medida_mitigacion,
            responsable_gestion
          ) VALUES ($1, $2, $3, $4)
          `,
          [activityId, risk.riesgo, risk.mitigacion, risk.responsable],
        );
      }
    }
    await client.query("COMMIT");
    return "saved";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function replaceObjetivosEspecificos(
  idPropuesta: number,
  objetivos: ObjetivoEspecificoInput[] | undefined,
): Promise<"saved" | "invalid_id" | "in_use"> {
  if (objetivos === undefined) return "saved";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ id_objetivo: number }>(
      `
      SELECT id_objetivo
      FROM propuesta_objetivo_especifico
      WHERE id_propuesta = $1
      FOR UPDATE
      `,
      [idPropuesta],
    );
    const existingIds = new Set(
      existing.rows.map((row) => row.id_objetivo),
    );
    if (
      objetivos.some(
        (objective) =>
          objective.id !== undefined && !existingIds.has(objective.id),
      )
    ) {
      await client.query("ROLLBACK");
      return "invalid_id";
    }

    const retainedIds = new Set(
      objetivos.flatMap((objective) =>
        objective.id === undefined ? [] : [objective.id],
      ),
    );
    const removedIds = [...existingIds].filter((id) => !retainedIds.has(id));
    if (removedIds.length > 0) {
      const references = await client.query<{ id_objetivo: number }>(
        `
        SELECT id_objetivo FROM actividad_plan
        WHERE id_objetivo = ANY($1::int[])
        UNION
        SELECT id_objetivo FROM propuesta_producto
        WHERE id_objetivo = ANY($1::int[])
        `,
        [removedIds],
      );
      if (references.rows.length > 0) {
        await client.query("ROLLBACK");
        return "in_use";
      }
      await client.query(
        `DELETE FROM propuesta_objetivo_especifico WHERE id_objetivo = ANY($1::int[])`,
        [removedIds],
      );
    }

    await client.query(
      `
      UPDATE propuesta_objetivo_especifico
      SET numero = -numero
      WHERE id_propuesta = $1
      `,
      [idPropuesta],
    );
    for (const [index, objective] of objetivos.entries()) {
      if (objective.id !== undefined) {
        await client.query(
          `
          UPDATE propuesta_objetivo_especifico
          SET numero = $1, descripcion = $2
          WHERE id_objetivo = $3 AND id_propuesta = $4
          `,
          [index + 1, objective.descripcion, objective.id, idPropuesta],
        );
      } else {
        await client.query(
          `
          INSERT INTO propuesta_objetivo_especifico (
            id_propuesta, numero, descripcion
          ) VALUES ($1, $2, $3)
          `,
          [idPropuesta, index + 1, objective.descripcion],
        );
      }
    }
    await client.query("COMMIT");
    return "saved";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function parseParticipantes(value: unknown):
  | ParticipanteInput[]
  | undefined
  | null {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 100) return null;

  const participantes: ParticipanteInput[] = [];
  const ids = new Set<number>();
  const initials = new Set<string>();
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const row = item as Record<string, unknown>;
    if (
      (row.id !== undefined &&
        (typeof row.id !== "number" ||
          !Number.isInteger(row.id) ||
          row.id < 1 ||
          ids.has(row.id))) ||
      typeof row.nombre !== "string" ||
      row.nombre.length > 150 ||
      (row.iniciales !== undefined &&
        (typeof row.iniciales !== "string" || row.iniciales.length > 10)) ||
      typeof row.orcid !== "string" ||
      row.orcid.length > 19
    ) {
      return null;
    }
    if (typeof row.id === "number") ids.add(row.id);
    const normalizedInitials =
      typeof row.iniciales === "string"
        ? row.iniciales.trim().toUpperCase()
        : "";
    if (normalizedInitials && initials.has(normalizedInitials)) return null;
    if (normalizedInitials) initials.add(normalizedInitials);

    if (row.tipo === "funcionario_tec") {
      if (
        typeof row.instancia !== "string" ||
        row.instancia.length > 200 ||
        typeof row.rol !== "string" ||
        (row.rol !== "" && !TEAM_MEMBER_ROLES.has(row.rol)) ||
        typeof row.periodo !== "string" ||
        row.periodo.length > 60 ||
        !Array.isArray(row.horas) ||
        row.horas.length > 20
      ) {
        return null;
      }

      const horas: { tipo: string; cantidad: number }[] = [];
      const tiposHora = new Set<string>();
      for (const hour of row.horas) {
        if (typeof hour !== "object" || hour === null || Array.isArray(hour)) {
          return null;
        }
        const hourRow = hour as Record<string, unknown>;
        if (
          typeof hourRow.tipo !== "string" ||
          !TEAM_HOUR_TYPES.has(hourRow.tipo) ||
          typeof hourRow.cantidad !== "number" ||
          !Number.isFinite(hourRow.cantidad) ||
          hourRow.cantidad <= 0 ||
          hourRow.cantidad > 999.99 ||
          tiposHora.has(hourRow.tipo)
        ) {
          return null;
        }
        tiposHora.add(hourRow.tipo);
        horas.push({ tipo: hourRow.tipo, cantidad: hourRow.cantidad });
      }

      participantes.push({
        ...(typeof row.id === "number" ? { id: row.id } : {}),
        tipo: row.tipo,
        nombre: row.nombre.trim(),
        iniciales: normalizedInitials,
        orcid: row.orcid.trim(),
        instancia: row.instancia.trim(),
        rol: row.rol,
        periodo: row.periodo.trim(),
        horas,
      });
      continue;
    }

    if (
      row.tipo !== "colaborador_externo" ||
      typeof row.institucion !== "string" ||
      row.institucion.length > 200
    ) {
      return null;
    }
    participantes.push({
      ...(typeof row.id === "number" ? { id: row.id } : {}),
      tipo: row.tipo,
      nombre: row.nombre.trim(),
      iniciales: normalizedInitials,
      orcid: row.orcid.trim(),
      institucion: row.institucion.trim(),
    });
  }
  return participantes;
}

async function loadParticipantes(idPropuesta: number) {
  const participants = await query<{
    id_participante: number;
    tipo: string;
    nombre_completo: string;
    iniciales: string | null;
    orcid: string | null;
    instancia_o_institucion: string | null;
    rol_en_proyecto: string | null;
    periodo_nombramiento: string | null;
  }>(
    `
    SELECT id_participante, tipo, nombre_completo, iniciales, orcid,
      instancia_o_institucion, rol_en_proyecto, periodo_nombramiento
    FROM propuesta_participante
    WHERE id_propuesta = $1
    ORDER BY id_participante
    `,
    [idPropuesta],
  );
  const ids = participants.rows.map((row) => row.id_participante);
  const hoursByParticipant = new Map<
    number,
    { tipo: string; cantidad: number }[]
  >();

  if (ids.length > 0) {
    const hours = await query<{
      id_participante: number;
      tipo_hora: string;
      cantidad_horas: string | number;
    }>(
      `
      SELECT id_participante, tipo_hora, cantidad_horas
      FROM propuesta_participante_hora
      WHERE id_participante = ANY($1::int[])
      ORDER BY id_participante, id_participante_hora
      `,
      [ids],
    );
    for (const hour of hours.rows) {
      const participantHours =
        hoursByParticipant.get(hour.id_participante) ?? [];
      participantHours.push({
        tipo: hour.tipo_hora,
        cantidad: Number(hour.cantidad_horas),
      });
      hoursByParticipant.set(hour.id_participante, participantHours);
    }
  }

  return participants.rows.map((row) => {
    const common = {
      id: row.id_participante,
      nombre: row.nombre_completo,
      iniciales: row.iniciales?.trim() ?? "",
      orcid: row.orcid?.trimEnd() ?? "",
    };
    if (row.tipo === "funcionario_tec") {
      return {
        tipo: "funcionario_tec" as const,
        ...common,
        instancia: row.instancia_o_institucion ?? "",
        rol: row.rol_en_proyecto ?? "",
        periodo: row.periodo_nombramiento ?? "",
        horas: hoursByParticipant.get(row.id_participante) ?? [],
      };
    }
    if (row.tipo === "externo") {
      return {
        tipo: "colaborador_externo" as const,
        ...common,
        institucion: row.instancia_o_institucion ?? "",
      };
    }
    throw new Error(`Tipo de participante inválido en propuesta ${idPropuesta}`);
  });
}

async function replaceParticipantes(
  idPropuesta: number,
  participantes: ParticipanteInput[] | undefined,
) {
  if (participantes === undefined) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ id_participante: number }>(
      `
      SELECT id_participante
      FROM propuesta_participante
      WHERE id_propuesta = $1
      FOR UPDATE
      `,
      [idPropuesta],
    );
    const existingIds = new Set(
      existing.rows.map((row) => row.id_participante),
    );
    const retainedIds = new Set<number>();

    for (const participant of participantes) {
      const isTec = participant.tipo === "funcionario_tec";
      const participantValues = [
        isTec ? "funcionario_tec" : "externo",
        participant.nombre,
        participant.iniciales || null,
        participant.orcid || null,
        isTec ? participant.instancia || null : participant.institucion || null,
        isTec ? participant.rol || null : null,
        isTec ? participant.periodo || null : null,
      ];
      let idParticipante: number;
      if (participant.id && existingIds.has(participant.id)) {
        idParticipante = participant.id;
        await client.query(
          `
          UPDATE propuesta_participante
          SET tipo = $1, nombre_completo = $2, iniciales = $3, orcid = $4,
            instancia_o_institucion = $5, rol_en_proyecto = $6,
            periodo_nombramiento = $7
          WHERE id_participante = $8 AND id_propuesta = $9
          `,
          [...participantValues, idParticipante, idPropuesta],
        );
      } else {
        const inserted = await client.query<{ id_participante: number }>(
          `
          INSERT INTO propuesta_participante (
            id_propuesta, tipo, nombre_completo, iniciales, orcid,
            instancia_o_institucion, rol_en_proyecto, periodo_nombramiento
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id_participante
          `,
          [idPropuesta, ...participantValues],
        );
        idParticipante = inserted.rows[0].id_participante;
      }
      retainedIds.add(idParticipante);
      await client.query(
        `DELETE FROM propuesta_participante_hora WHERE id_participante = $1`,
        [idParticipante],
      );

      if (isTec) {
        for (const hour of participant.horas) {
          await client.query(
            `
            INSERT INTO propuesta_participante_hora (
              id_participante, tipo_hora, cantidad_horas
            ) VALUES ($1, $2, $3)
            `,
            [idParticipante, hour.tipo, hour.cantidad],
          );
        }
      }
    }

    const removedIds = [...existingIds].filter((id) => !retainedIds.has(id));
    if (removedIds.length > 0) {
      await client.query(
        `DELETE FROM actividad_participante WHERE id_participante = ANY($1::int[])`,
        [removedIds],
      );
      await client.query(
        `DELETE FROM propuesta_participante_hora WHERE id_participante = ANY($1::int[])`,
        [removedIds],
      );
      await client.query(
        `DELETE FROM propuesta_participante WHERE id_participante = ANY($1::int[])`,
        [removedIds],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
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
propuestasRouter.get("/propuestas", requireDemoAuth, async (req, res) => {
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
});

propuestasRouter.get("/propuestas/:id", requireDemoAuth, async (req, res) => {
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
  const preguntasGenerales = await loadPreguntasGenerales(id);
  const participantes = await loadParticipantes(id);
  const objetivosEspecificos = await loadObjetivosEspecificos(id);
  const planAccion = await loadPlanAccion(id);
  res.json({
    ...mapPropuesta(row),
    ...keywords,
    preguntasGenerales,
    participantes,
    objetivosEspecificos,
    planAccion,
  });
});

/** Crear borrador. */
propuestasRouter.post("/propuestas", requireDemoAuth, async (req, res) => {
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
  if (
    req.body?.estadoArte !== undefined &&
    typeof req.body.estadoArte !== "string"
  ) {
    res.status(400).json({ error: "estadoArte debe ser texto" });
    return;
  }
  const estadoArte = String(req.body?.estadoArte ?? "").trim();
  if (countWords(estadoArte) > ESTADO_ARTE_MAX_WORDS) {
    res.status(400).json({
      error: `El estado del arte no puede superar ${ESTADO_ARTE_MAX_WORDS} palabras (aproximadamente dos páginas)`,
    });
    return;
  }
  const objetivosEspecificos = parseObjetivosEspecificos(
    req.body?.objetivosEspecificos,
  );
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
  const preguntasGenerales = parsePreguntasGenerales(
    req.body?.preguntasGenerales,
  );
  if (preguntasGenerales === null) {
    res.status(400).json({ error: "preguntasGenerales inválidas" });
    return;
  }
  if (objetivosEspecificos === null) {
    res.status(400).json({
      error: "Se requieren exactamente tres objetivos específicos válidos",
    });
    return;
  }
  if (
    objetivosEspecificos?.some((objective) => objective.id !== undefined)
  ) {
    res.status(400).json({
      error: "No se admiten identificadores de objetivos al crear una propuesta",
    });
    return;
  }
  const participantes = parseParticipantes(req.body?.participantes);
  if (participantes === null) {
    res.status(400).json({ error: "participantes inválidos" });
    return;
  }
  const planAccion = parsePlanAccion(req.body?.planAccion);
  if (planAccion === null) {
    res.status(400).json({ error: "Plan de acción y riesgos inválido" });
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

  const year = new Date().getFullYear();
  const codigoTmp = `TMP-${userId}-${Date.now()}`;

  const insert = await query<{ id_propuesta: number }>(
    `
    INSERT INTO propuesta (
      codigo, id_convocatoria, id_coordinador, id_escuela,
      titulo, modalidad, resumen, abstract_en,
      problema, objetivo_general, estado_arte, metodologia,
      estado_actual, etapa_flujo
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'borrador', 0)
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
      estadoArte,
      metodologia,
    ],
  );

  const id = insert.rows[0].id_propuesta;
  const codigo = `PROP-${year}-${String(id).padStart(3, "0")}`;
  await query(`UPDATE propuesta SET codigo = $1 WHERE id_propuesta = $2`, [
    codigo,
    id,
  ]);
  const objectivesSaved = await replaceObjetivosEspecificos(
    id,
    objetivosEspecificos,
  );
  if (objectivesSaved !== "saved") {
    res.status(400).json({
      error: "No se pudieron guardar los tres objetivos específicos",
    });
    return;
  }
  await replaceKeywords(id, keywordsEs, keywordsEn);
  await replacePreguntasGenerales(id, preguntasGenerales);
  await replaceParticipantes(id, participantes);
  const planSaved = await replacePlanAccion(id, planAccion);
  if (planSaved !== "saved") {
    res.status(400).json({
      error:
        planSaved === "invalid_objective"
          ? "El plan contiene un objetivo que no pertenece a la propuesta"
          : "Verificá que cada participante del plan tenga iniciales únicas registradas en el equipo",
    });
    return;
  }

  const detail = await query<PropuestaRow>(
    `${BASE_SELECT} WHERE p.id_propuesta = $1`,
    [id],
  );
  const keywords = await loadKeywords(id);
  const preguntas = await loadPreguntasGenerales(id);
  const team = await loadParticipantes(id);
  const objectives = await loadObjetivosEspecificos(id);
  const plan = await loadPlanAccion(id);
  res.status(201).json({
    ...mapPropuesta(detail.rows[0]),
    ...keywords,
    preguntasGenerales: preguntas,
    participantes: team,
    objetivosEspecificos: objectives,
    planAccion: plan,
  });
});

/** Actualizar borrador. */
propuestasRouter.patch("/propuestas/:id", requireDemoAuth, async (req, res) => {
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
  const preguntasGenerales = parsePreguntasGenerales(
    req.body?.preguntasGenerales,
  );
  if (preguntasGenerales === null) {
    res.status(400).json({ error: "preguntasGenerales inválidas" });
    return;
  }
  const participantes = parseParticipantes(req.body?.participantes);
  if (participantes === null) {
    res.status(400).json({ error: "participantes inválidos" });
    return;
  }
  const planAccion = parsePlanAccion(req.body?.planAccion);
  if (planAccion === null) {
    res.status(400).json({ error: "Plan de acción y riesgos inválido" });
    return;
  }
  const objetivosEspecificos = parseObjetivosEspecificos(
    req.body?.objetivosEspecificos,
  );
  if (objetivosEspecificos === null) {
    res.status(400).json({
      error: "Se requieren exactamente tres objetivos específicos válidos",
    });
    return;
  }
  const objectivesSaved = await replaceObjetivosEspecificos(
    id,
    objetivosEspecificos,
  );
  if (objectivesSaved === "invalid_id") {
    res.status(400).json({ error: "Objetivo específico inválido para esta propuesta" });
    return;
  }
  if (objectivesSaved === "in_use") {
    res.status(400).json({
      error: "No se puede quitar un objetivo específico asociado al plan o a un producto",
    });
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
  if (req.body?.estadoArte !== undefined) {
    if (
      req.body.estadoArte !== null &&
      typeof req.body.estadoArte !== "string"
    ) {
      res.status(400).json({ error: "estadoArte debe ser texto" });
      return;
    }
    const estadoArte =
      req.body.estadoArte === null ? "" : req.body.estadoArte.trim();
    if (countWords(estadoArte) > ESTADO_ARTE_MAX_WORDS) {
      res.status(400).json({
        error: `El estado del arte no puede superar ${ESTADO_ARTE_MAX_WORDS} palabras (aproximadamente dos páginas)`,
      });
      return;
    }
    set("estado_arte", estadoArte || null);
  }
  if (req.body?.metodologia !== undefined) {
    set(
      "metodologia",
      req.body.metodologia === null
        ? null
        : String(req.body.metodologia).trim(),
    );
  }

  if (fields.length > 0) {
    values.push(id);
    await query(
      `UPDATE propuesta SET ${fields.join(", ")} WHERE id_propuesta = $${i}`,
      values,
    );
  }

  await replaceKeywords(
    id,
    parseKeywordInput(req.body?.keywordsEs),
    parseKeywordInput(req.body?.keywordsEn),
  );
  await replacePreguntasGenerales(id, preguntasGenerales);
  await replaceParticipantes(id, participantes);
  const planSaved = await replacePlanAccion(id, planAccion);
  if (planSaved === "invalid_objective") {
    res.status(400).json({
      error: "El plan contiene un objetivo que no pertenece a la propuesta",
    });
    return;
  }
  if (planSaved === "invalid_participant") {
    res.status(400).json({
      error:
        "Verificá que cada participante del plan tenga iniciales únicas registradas en el equipo",
    });
    return;
  }

  const detail = await query<PropuestaRow>(
    `${BASE_SELECT} WHERE p.id_propuesta = $1`,
    [id],
  );
  const keywords = await loadKeywords(id);
  const preguntas = await loadPreguntasGenerales(id);
  const team = await loadParticipantes(id);
  const objectives = await loadObjetivosEspecificos(id);
  const plan = await loadPlanAccion(id);
  res.json({
    ...mapPropuesta(detail.rows[0]),
    ...keywords,
    preguntasGenerales: preguntas,
    participantes: team,
    objetivosEspecificos: objectives,
    planAccion: plan,
  });
});

/** Enviar a revisión (sale de borrador). */
propuestasRouter.post(
  "/propuestas/:id/enviar",
  requireDemoAuth,
  async (req, res) => {
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
    const preguntasGenerales = await loadPreguntasGenerales(id);
    const participantes = await loadParticipantes(id);
    const objetivosEspecificos = await loadObjetivosEspecificos(id);
    const planAccion = await loadPlanAccion(id);
    res.json({
      ...mapPropuesta(detail.rows[0]),
      ...keywords,
      preguntasGenerales,
      participantes,
      objetivosEspecificos,
      planAccion,
    });
  },
);
