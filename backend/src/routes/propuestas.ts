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
  hoja_ruta: string | null;
  divulgacion: string | null;
  aspectos_eticos: AspectosEticosInput | null;
  declaracion_jurada: DeclaracionJuradaInput | null;
  resguardo_productos: ResguardoProductosInput | null;
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

type PresupuestoAnualInput = {
  anio: number;
  operativo: number;
  duraderos: number;
};

type FinanciamientoInput = {
  tipo: "externo" | "contrapartida" | "cofinanciamiento";
  anio1: number;
  anio2: number;
  anio3: number;
  oficio: string;
};

type DivulgacionInput = {
  divulgacionCientifica: string;
  canalesInstitucionales: string;
  eventosSocializacion: string;
  mediosMasivos: string;
};

type AspectosEticosInput = {
  seresHumanos: "Sí" | "No" | "";
  biodiversidad: "Sí" | "No" | "";
  animales: "Sí" | "No" | "";
  territoriosIndigenas: "Sí" | "No" | "";
  consultaConsentimiento: string;
  exencionJustificacion: string;
  entesRegulatorios: string[];
  otroEnte: string;
  detalleAval: string;
};

type HojaRutaInput = {
  lineaInvestigacion: string;
  objetivoEstrategico: string;
  duracionTotal: string;
  fases: string;
  productosIntermedios: string;
};

type DeclaracionJuradaInput = {
  acepta: boolean;
  nombreCompleto: string;
  cedula: string;
  firma: string;
};

type ResguardoProductosInput = {
  depositoRepositorio: "Sí" | "No" | "";
  desarrollaSoftwareBaseDatos: "Sí" | "No" | "";
  entregaRespaldoSoftware: "Sí" | "No" | "";
};

type ProductCommitmentInput =
  | {
      tipo: "academico";
      codigoOpcion: string;
      cantidad: number;
      objetivoNumero: number;
    }
  | {
      tipo: "activo_pi";
      codigoOpcion: string;
      cantidad: number;
      dictamenConsecutivo: string;
    }
  | {
      tipo: "adicional";
      codigoOpcion: string;
      cantidad: 1;
      descripcion: string;
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

const BUDGET_YEARS = [2027, 2028, 2029] as const;
const FINANCING_TYPES = [
  "externo",
  "contrapartida",
  "cofinanciamiento",
] as const;

const BASIC_ACADEMIC_PRODUCT_OPTIONS = {
  opcion_1:
    "Un artículo científico sometido en revista o conferencia indexada en Web of Science (WoS) o Scopus",
  opcion_2:
    "Dos artículos científicos sometidos en revistas SciELO, Redalyc, ESCI o DOAJ, o memorias con Consejo Editorial",
  opcion_3:
    "Un libro o capítulo de libro técnico especializado sometido ante el Comité Editorial permanente",
};

const TECHNOLOGY_ACADEMIC_PRODUCT_OPTIONS = {
  ...BASIC_ACADEMIC_PRODUCT_OPTIONS,
  opcion_4:
    "Norma técnica sometida ante entes competentes, o manual técnico de alta especialidad",
};

const TECHNOLOGY_IP_ASSET_OPTIONS = {
  activo_1: "Patente de invención o modelo de utilidad",
  activo_2: "Diseño industrial (dibujo o modelo industrial)",
  activo_3:
    "Desarrollo de software (código fuente, manuales y ciclo de vida)",
  activo_4: "Secreto depositado en el Centro de Vinculación",
  activo_5: "Obtención vegetal",
  activo_6: "Denominación de origen o indicación geográfica",
  activo_7: "Sistema de trazado de circuitos integrados",
  activo_8: "Otros, a criterio del Centro de Vinculación",
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
    estadoArte: row.estado_arte,
    metodologia: row.metodologia,
    divulgacion: parseStoredJson<DivulgacionInput>(row.divulgacion),
    aspectosEticos: row.aspectos_eticos,
    hojaRuta: parseStoredJson<HojaRutaInput>(row.hoja_ruta),
    declaracionJurada: row.declaracion_jurada,
    resguardoProductos: row.resguardo_productos,
    estadoActual: row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
  };
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function parseStoredJson<T>(value: unknown): T | null {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return typeof value === "object" && value !== null
    ? (value as T)
    : null;
}

function parseTextFields<T extends Record<string, string>>(
  value: unknown,
  keys: readonly (keyof T)[],
  maxLength: number,
): T | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (
    keys.some(
      (key) =>
        typeof row[key as string] !== "string" ||
        (row[key as string] as string).length > maxLength,
    )
  ) {
    return null;
  }
  return Object.fromEntries(
    keys.map((key) => [key, row[key as string]]),
  ) as T;
}

function parseDivulgacion(value: unknown): DivulgacionInput | undefined | null {
  return parseTextFields<DivulgacionInput>(
    value,
    [
      "divulgacionCientifica",
      "canalesInstitucionales",
      "eventosSocializacion",
      "mediosMasivos",
    ],
    5000,
  );
}

function parseHojaRuta(value: unknown): HojaRutaInput | undefined | null {
  return parseTextFields<HojaRutaInput>(
    value,
    [
      "lineaInvestigacion",
      "objetivoEstrategico",
      "duracionTotal",
      "fases",
      "productosIntermedios",
    ],
    5000,
  );
}

function parseAspectosEticos(
  value: unknown,
): AspectosEticosInput | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const responseKeys = [
    "seresHumanos",
    "biodiversidad",
    "animales",
    "territoriosIndigenas",
  ] as const;
  const textKeys = [
    "consultaConsentimiento",
    "exencionJustificacion",
    "otroEnte",
    "detalleAval",
  ] as const;
  const allowedEntities = ["cec", "conagebio", "cicua_cobab", "adi", "otro"];
  if (
    responseKeys.some(
      (key) => row[key] !== "" && row[key] !== "Sí" && row[key] !== "No",
    ) ||
    textKeys.some(
      (key) =>
        typeof row[key] !== "string" ||
        (row[key] as string).length > 5000,
    ) ||
    !Array.isArray(row.entesRegulatorios) ||
    row.entesRegulatorios.some(
      (entity) =>
        typeof entity !== "string" || !allowedEntities.includes(entity),
    )
  ) {
    return null;
  }
  return {
    seresHumanos: row.seresHumanos as AspectosEticosInput["seresHumanos"],
    biodiversidad: row.biodiversidad as AspectosEticosInput["biodiversidad"],
    animales: row.animales as AspectosEticosInput["animales"],
    territoriosIndigenas:
      row.territoriosIndigenas as AspectosEticosInput["territoriosIndigenas"],
    consultaConsentimiento: row.consultaConsentimiento as string,
    exencionJustificacion: row.exencionJustificacion as string,
    entesRegulatorios: row.entesRegulatorios as string[],
    otroEnte: row.otroEnte as string,
    detalleAval: row.detalleAval as string,
  };
}

function parseDeclaracionJurada(
  value: unknown,
): DeclaracionJuradaInput | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (
    typeof row.acepta !== "boolean" ||
    typeof row.nombreCompleto !== "string" ||
    row.nombreCompleto.length > 150 ||
    typeof row.cedula !== "string" ||
    row.cedula.length > 20 ||
    typeof row.firma !== "string" ||
    row.firma.length > 150 ||
    (row.acepta &&
      (!row.nombreCompleto.trim() ||
        !row.cedula.trim() ||
        row.firma.trim() !== row.nombreCompleto.trim()))
  ) {
    return null;
  }
  return {
    acepta: row.acepta,
    nombreCompleto: row.nombreCompleto.trim(),
    cedula: row.cedula.trim(),
    firma: row.firma.trim(),
  };
}

function parseResguardoProductos(
  value: unknown,
): ResguardoProductosInput | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const responseIsValid = (response: unknown) =>
    response === "" || response === "Sí" || response === "No";
  if (
    !responseIsValid(row.depositoRepositorio) ||
    !responseIsValid(row.desarrollaSoftwareBaseDatos) ||
    !responseIsValid(row.entregaRespaldoSoftware)
  ) {
    return null;
  }
  return {
    depositoRepositorio:
      row.depositoRepositorio as ResguardoProductosInput["depositoRepositorio"],
    desarrollaSoftwareBaseDatos:
      row.desarrollaSoftwareBaseDatos as ResguardoProductosInput["desarrollaSoftwareBaseDatos"],
    entregaRespaldoSoftware:
      row.entregaRespaldoSoftware as ResguardoProductosInput["entregaRespaldoSoftware"],
  };
}

function isResguardoProductosComplete(
  safeguard: ResguardoProductosInput | null,
) {
  return Boolean(
    safeguard?.depositoRepositorio === "Sí" &&
      (safeguard.desarrollaSoftwareBaseDatos === "No" ||
        (safeguard.desarrollaSoftwareBaseDatos === "Sí" &&
          safeguard.entregaRespaldoSoftware === "Sí")),
  );
}

function isEthicalReviewComplete(ethics: AspectosEticosInput | null) {
  if (!ethics) return false;
  const responses = [
    ethics.seresHumanos,
    ethics.biodiversidad,
    ethics.animales,
    ethics.territoriosIndigenas,
  ];
  if (!responses.every((response) => response === "Sí" || response === "No")) {
    return false;
  }
  if (responses.every((response) => response === "No")) {
    return Boolean(ethics.exencionJustificacion.trim());
  }
  const requiredEntities = [
    ...(ethics.seresHumanos === "Sí" ? ["cec"] : []),
    ...(ethics.biodiversidad === "Sí" ? ["conagebio"] : []),
    ...(ethics.animales === "Sí" ? ["cicua_cobab"] : []),
    ...(ethics.territoriosIndigenas === "Sí" ? ["adi"] : []),
  ];
  return (
    ethics.entesRegulatorios.length > 0 &&
    requiredEntities.every((entity) =>
      ethics.entesRegulatorios.includes(entity),
    ) &&
    Boolean(ethics.detalleAval.trim()) &&
    (!ethics.entesRegulatorios.includes("otro") ||
      Boolean(ethics.otroEnte.trim())) &&
    (ethics.territoriosIndigenas !== "Sí" ||
      Boolean(ethics.consultaConsentimiento.trim()))
  );
}

function isDeclarationComplete(declaration: DeclaracionJuradaInput | null) {
  return Boolean(
    declaration?.acepta &&
      declaration.nombreCompleto.trim() &&
      declaration.cedula.trim() &&
      declaration.firma.trim() === declaration.nombreCompleto.trim(),
  );
}

function hasRequiredTextFields(value: unknown, fields: string[]) {
  return (
    typeof value === "object" &&
    value !== null &&
    fields.every((field) => {
      const fieldValue = (value as Record<string, unknown>)[field];
      return typeof fieldValue === "string" && Boolean(fieldValue.trim());
    })
  );
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

function parsePresupuestoAnual(
  value: unknown,
): PresupuestoAnualInput[] | undefined | null {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length !== BUDGET_YEARS.length) return null;

  const budgets: PresupuestoAnualInput[] = [];
  for (const [index, item] of value.entries()) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const row = item as Record<string, unknown>;
    const anio = row.anio;
    const operativo = row.operativo;
    const duraderos = row.duraderos;
    if (
      typeof anio !== "number" ||
      anio !== BUDGET_YEARS[index] ||
      !isValidBudgetAmount(operativo) ||
      !isValidBudgetAmount(duraderos) ||
      (index > 0 && duraderos !== 0)
    ) {
      return null;
    }
    budgets.push({
      anio,
      operativo,
      duraderos,
    });
  }
  return budgets;
}

function parseFinanciamiento(
  value: unknown,
): FinanciamientoInput[] | undefined | null {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length !== FINANCING_TYPES.length) {
    return null;
  }

  const funding: FinanciamientoInput[] = [];
  for (const [index, item] of value.entries()) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const row = item as Record<string, unknown>;
    const tipo = row.tipo;
    const anio1 = row.anio1;
    const anio2 = row.anio2;
    const anio3 = row.anio3;
    if (
      !isFinancingType(tipo) ||
      tipo !== FINANCING_TYPES[index] ||
      !isValidBudgetAmount(anio1) ||
      !isValidBudgetAmount(anio2) ||
      !isValidBudgetAmount(anio3) ||
      typeof row.oficio !== "string" ||
      row.oficio.length > 60
    ) {
      return null;
    }
    funding.push({
      tipo,
      anio1,
      anio2,
      anio3,
      oficio: row.oficio.trim(),
    });
  }
  return funding;
}

function isValidBudgetAmount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 999999999999.99
  );
}

function isFinancingType(
  value: unknown,
): value is FinanciamientoInput["tipo"] {
  return (
    typeof value === "string" &&
    FINANCING_TYPES.some((financingType) => financingType === value)
  );
}

function parseProductCommitments(
  value: unknown,
  modality: string,
): ProductCommitmentInput[] | undefined | null {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 50) return null;

  const technologyProject = modality === "desarrollo_tecnologico";
  const academicOptions = technologyProject
    ? TECHNOLOGY_ACADEMIC_PRODUCT_OPTIONS
    : BASIC_ACADEMIC_PRODUCT_OPTIONS;
  const products: ProductCommitmentInput[] = [];
  const additionalCodes = new Set<string>();

  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.cantidad !== "number" ||
      !Number.isInteger(row.cantidad) ||
      row.cantidad < 1 ||
      row.cantidad > 99
    ) {
      return null;
    }

    if (row.tipo === "academico") {
      const code = row.codigoOpcion;
      if (
        typeof code !== "string" ||
        !Object.prototype.hasOwnProperty.call(academicOptions, code) ||
        typeof row.objetivoNumero !== "number" ||
        !Number.isInteger(row.objetivoNumero) ||
        row.objetivoNumero < 1 ||
        row.objetivoNumero > 3
      ) {
        return null;
      }
      const description =
        academicOptions[code as keyof typeof academicOptions];
      if (!description) return null;
      products.push({
        tipo: "academico",
        codigoOpcion: code,
        cantidad: row.cantidad,
        objetivoNumero: row.objetivoNumero,
      });
      continue;
    }

    if (row.tipo === "activo_pi") {
      if (
        !technologyProject ||
        typeof row.codigoOpcion !== "string" ||
        !Object.prototype.hasOwnProperty.call(
          TECHNOLOGY_IP_ASSET_OPTIONS,
          row.codigoOpcion,
        ) ||
        typeof row.dictamenConsecutivo !== "string" ||
        !row.dictamenConsecutivo.trim() ||
        row.dictamenConsecutivo.length > 40
      ) {
        return null;
      }
      products.push({
        tipo: "activo_pi",
        codigoOpcion: row.codigoOpcion,
        cantidad: row.cantidad,
        dictamenConsecutivo: row.dictamenConsecutivo.trim(),
      });
      continue;
    }

    if (
      row.tipo !== "adicional" ||
      technologyProject ||
      typeof row.codigoOpcion !== "string" ||
      !["adicional_1", "adicional_2"].includes(row.codigoOpcion) ||
      additionalCodes.has(row.codigoOpcion) ||
      row.cantidad !== 1 ||
      typeof row.descripcion !== "string" ||
      !row.descripcion.trim() ||
      row.descripcion.length > 500
    ) {
      return null;
    }
    additionalCodes.add(row.codigoOpcion);
    products.push({
      tipo: "adicional",
      codigoOpcion: row.codigoOpcion,
      cantidad: 1,
      descripcion: row.descripcion.trim(),
    });
  }

  return products;
}

async function loadProductCommitments(idPropuesta: number) {
  const result = await query<{
    id_producto: number;
    id_objetivo: number | null;
    numero_objetivo: number | null;
    ambito: string;
    codigo_opcion: string;
    descripcion: string;
    cantidad: number;
    dictamen_consecutivo: string | null;
  }>(
    `
    SELECT pp.id_producto, pp.id_objetivo, oe.numero AS numero_objetivo,
      pp.ambito, pp.codigo_opcion, pp.descripcion, pp.cantidad,
      pp.dictamen_consecutivo
    FROM propuesta_producto pp
    LEFT JOIN propuesta_objetivo_especifico oe
      ON oe.id_objetivo = pp.id_objetivo
    WHERE pp.id_propuesta = $1
    ORDER BY pp.id_producto
    `,
    [idPropuesta],
  );
  return result.rows.map((row) => ({
    id: row.id_producto,
    tipo:
      row.ambito === "activo_pi"
        ? "activo_pi"
        : row.ambito === "adicional"
          ? "adicional"
          : "academico",
    codigoOpcion: row.codigo_opcion,
    descripcion: row.descripcion,
    cantidad: row.cantidad,
    objetivoId: row.id_objetivo,
    objetivoNumero: row.numero_objetivo,
    dictamenConsecutivo: row.dictamen_consecutivo?.trim() ?? "",
  }));
}

async function replaceProductCommitments(
  idPropuesta: number,
  products: ProductCommitmentInput[] | undefined,
  modality: string,
): Promise<"saved" | "invalid_objective"> {
  if (products === undefined) return "saved";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const objectives = await client.query<{
      id_objetivo: number;
      numero: number;
    }>(
      `SELECT id_objetivo, numero FROM propuesta_objetivo_especifico WHERE id_propuesta = $1`,
      [idPropuesta],
    );
    const objectiveIds = new Map(
      objectives.rows.map((objective) => [objective.numero, objective.id_objetivo]),
    );
    if (
      products.some(
        (product) =>
          product.tipo === "academico" &&
          !objectiveIds.has(product.objetivoNumero),
      )
    ) {
      await client.query("ROLLBACK");
      return "invalid_objective";
    }

    await client.query(
      `DELETE FROM propuesta_producto WHERE id_propuesta = $1`,
      [idPropuesta],
    );
    for (const product of products) {
      const ambito =
        product.tipo === "activo_pi"
          ? "activo_pi"
          : product.tipo === "adicional"
            ? "adicional"
            : modality === "desarrollo_tecnologico"
              ? "desarrollo_tecnologico"
              : "basica_aplicada";
      const description =
        product.tipo === "academico"
          ? TECHNOLOGY_ACADEMIC_PRODUCT_OPTIONS[
              product.codigoOpcion as keyof typeof TECHNOLOGY_ACADEMIC_PRODUCT_OPTIONS
            ]
          : product.tipo === "activo_pi"
            ? TECHNOLOGY_IP_ASSET_OPTIONS[
                product.codigoOpcion as keyof typeof TECHNOLOGY_IP_ASSET_OPTIONS
              ]
            : product.descripcion;
      const objectiveId =
        product.tipo === "academico"
          ? objectiveIds.get(product.objetivoNumero)!
          : null;
      const dictamen =
        product.tipo === "activo_pi" ? product.dictamenConsecutivo : null;
      await client.query(
        `
        INSERT INTO propuesta_producto (
          id_propuesta, id_objetivo, ambito, codigo_opcion, descripcion,
          cantidad, dictamen_consecutivo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          idPropuesta,
          objectiveId,
          ambito,
          product.codigoOpcion,
          description,
          product.cantidad,
          dictamen,
        ],
      );
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

async function loadPresupuestoFinanciamiento(idPropuesta: number) {
  const budgetRows = await query<{
    anio: number;
    monto_operativo: string | number;
    monto_bienes_duraderos: string | number;
  }>(
    `
    SELECT anio, monto_operativo, monto_bienes_duraderos
    FROM propuesta_presupuesto_anual
    WHERE id_propuesta = $1
    ORDER BY anio
    `,
    [idPropuesta],
  );
  const presupuestoAnual = BUDGET_YEARS.map((anio) => {
    const row = budgetRows.rows.find((budget) => budget.anio === anio);
    const operativo = Number(row?.monto_operativo ?? 0);
    const duraderos = Number(row?.monto_bienes_duraderos ?? 0);
    return { anio, operativo, duraderos, total: operativo + duraderos };
  });

  const fundingRows = await query<{
    tipo: string;
    anio: number;
    monto: string | number;
    numero_oficio: string | null;
  }>(
    `
    SELECT tipo, anio, monto, numero_oficio
    FROM propuesta_financiamiento
    WHERE id_propuesta = $1
    ORDER BY tipo, anio
    `,
    [idPropuesta],
  );
  const financingByType = new Map<
    FinanciamientoInput["tipo"],
    FinanciamientoInput
  >(
    FINANCING_TYPES.map((tipo) => [
      tipo,
      { tipo, anio1: 0, anio2: 0, anio3: 0, oficio: "" },
    ]),
  );
  for (const row of fundingRows.rows) {
    if (!isFinancingType(row.tipo)) continue;
    const funding = financingByType.get(row.tipo);
    if (!funding) continue;
    const amount = Number(row.monto);
    if (row.anio === BUDGET_YEARS[0]) funding.anio1 = amount;
    if (row.anio === BUDGET_YEARS[1]) funding.anio2 = amount;
    if (row.anio === BUDGET_YEARS[2]) funding.anio3 = amount;
    funding.oficio ||= row.numero_oficio?.trim() ?? "";
  }
  return {
    presupuestoAnual,
    financiamiento: FINANCING_TYPES.map(
      (tipo) => financingByType.get(tipo)!,
    ),
  };
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

async function replacePresupuestoFinanciamiento(
  idPropuesta: number,
  presupuestoAnual: PresupuestoAnualInput[] | undefined,
  financiamiento: FinanciamientoInput[] | undefined,
) {
  if (presupuestoAnual === undefined && financiamiento === undefined) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (presupuestoAnual !== undefined) {
      await client.query(
        `DELETE FROM propuesta_presupuesto_anual WHERE id_propuesta = $1`,
        [idPropuesta],
      );
      for (const row of presupuestoAnual) {
        await client.query(
          `
          INSERT INTO propuesta_presupuesto_anual (
            id_propuesta, anio, monto_operativo, monto_bienes_duraderos,
            monto_total
          ) VALUES ($1, $2, $3, $4, $5)
          `,
          [
            idPropuesta,
            row.anio,
            row.operativo,
            row.duraderos,
            row.operativo + row.duraderos,
          ],
        );
      }
    }
    if (financiamiento !== undefined) {
      await client.query(
        `DELETE FROM propuesta_financiamiento WHERE id_propuesta = $1`,
        [idPropuesta],
      );
      for (const row of financiamiento) {
        for (const [index, anio] of BUDGET_YEARS.entries()) {
          await client.query(
            `
            INSERT INTO propuesta_financiamiento (
              id_propuesta, tipo, anio, monto, numero_oficio
            ) VALUES ($1, $2, $3, $4, $5)
            `,
            [
              idPropuesta,
              row.tipo,
              anio,
              [row.anio1, row.anio2, row.anio3][index],
              row.oficio || null,
            ],
          );
        }
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function validateProductCommitmentsForSubmission(
  idPropuesta: number,
  modality: string,
): Promise<
  | "valid"
  | "invalid_hours"
  | "missing_academic"
  | "missing_asset"
  | "missing_combinations"
> {
  const hoursResult = await query<{ total_horas: string | number }>(
    `
    SELECT COALESCE((
      SELECT SUM(pph.cantidad_horas)
      FROM propuesta_participante_hora pph
      JOIN propuesta_participante pp
        ON pp.id_participante = pph.id_participante
      WHERE pp.id_propuesta = $1 AND pp.tipo = 'funcionario_tec'
    ), 0) AS total_horas
    `,
    [idPropuesta],
  );
  const totalHours = Number(hoursResult.rows[0]?.total_horas ?? 0);
  if (!Number.isFinite(totalHours) || totalHours < 1 || totalHours > 30) {
    return "invalid_hours";
  }

  const products = await query<{
    ambito: string;
    cantidad: number;
    id_objetivo: number | null;
    dictamen_consecutivo: string | null;
  }>(
    `
    SELECT ambito, cantidad, id_objetivo, dictamen_consecutivo
    FROM propuesta_producto
    WHERE id_propuesta = $1
    `,
    [idPropuesta],
  );
  const academic = products.rows.filter(
    (product) =>
      product.ambito === "basica_aplicada" ||
      product.ambito === "desarrollo_tecnologico",
  );
  if (
    academic.reduce((total, product) => total + product.cantidad, 0) <
      Math.ceil(totalHours / 10) ||
    academic.some((product) => product.id_objetivo === null)
  ) {
    return "missing_academic";
  }
  if (
    modality === "desarrollo_tecnologico" &&
    !products.rows.some(
      (product) =>
        product.ambito === "activo_pi" &&
        product.dictamen_consecutivo?.trim(),
    )
  ) {
    return "missing_asset";
  }
  if (
    modality === "desarrollo_tecnologico" &&
    products.rows
      .filter(
        (product) =>
          product.ambito === "activo_pi" ||
          product.ambito === "desarrollo_tecnologico",
      )
      .reduce((total, product) => total + product.cantidad, 0) <
      Math.ceil(totalHours / 10) + 1
  ) {
    return "missing_combinations";
  }
  return "valid";
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
  const budget = await loadPresupuestoFinanciamiento(id);
  const compromisosProductos = await loadProductCommitments(id);
  res.json({
    ...mapPropuesta(row),
    ...keywords,
    preguntasGenerales,
    participantes,
    objetivosEspecificos,
    planAccion,
    compromisosProductos,
    ...budget,
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
  const compromisosProductos = parseProductCommitments(
    req.body?.compromisosProductos,
    modalidad,
  );
  if (compromisosProductos === null) {
    res.status(400).json({ error: "Compromisos de productos inválidos" });
    return;
  }
  const presupuestoAnual = parsePresupuestoAnual(req.body?.presupuestoAnual);
  if (presupuestoAnual === null) {
    res.status(400).json({ error: "Presupuesto anual inválido" });
    return;
  }
  const financiamiento = parseFinanciamiento(req.body?.financiamiento);
  if (financiamiento === null) {
    res.status(400).json({ error: "Financiamiento inválido" });
    return;
  }
  const divulgacion = parseDivulgacion(req.body?.divulgacion);
  const aspectosEticos = parseAspectosEticos(req.body?.aspectosEticos);
  const hojaRuta = parseHojaRuta(req.body?.hojaRuta);
  const declaracionJurada = parseDeclaracionJurada(
    req.body?.declaracionJurada,
  );
  const resguardoProductos = parseResguardoProductos(
    req.body?.resguardoProductos,
  );
  if (
    divulgacion === null ||
    aspectosEticos === null ||
    hojaRuta === null ||
    declaracionJurada === null ||
    resguardoProductos === null
  ) {
    res.status(400).json({
      error: "Divulgación, aspectos éticos, hoja de ruta o declaración jurada inválidos",
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

  const year = new Date().getFullYear();
  const codigoTmp = `TMP-${userId}-${Date.now()}`;

  const insert = await query<{ id_propuesta: number }>(
    `
    INSERT INTO propuesta (
      codigo, id_convocatoria, id_coordinador, id_escuela,
      titulo, modalidad, resumen, abstract_en,
      problema, objetivo_general, estado_arte, metodologia,
      hoja_ruta, divulgacion, aspectos_eticos, declaracion_jurada,
      resguardo_productos,
      estado_actual, etapa_flujo
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15::jsonb, $16::jsonb, $17::jsonb, 'borrador', 0)
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
      hojaRuta === undefined ? null : JSON.stringify(hojaRuta),
      divulgacion === undefined ? null : JSON.stringify(divulgacion),
      aspectosEticos === undefined ? null : JSON.stringify(aspectosEticos),
      declaracionJurada === undefined
        ? null
        : JSON.stringify(declaracionJurada),
      resguardoProductos === undefined
        ? null
        : JSON.stringify(resguardoProductos),
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
  await replacePresupuestoFinanciamiento(id, presupuestoAnual, financiamiento);
  const productsSaved = await replaceProductCommitments(
    id,
    compromisosProductos,
    modalidad,
  );
  if (productsSaved === "invalid_objective") {
    res.status(400).json({
      error: "Cada producto debe asociarse a un objetivo específico de la propuesta",
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
  const budget = await loadPresupuestoFinanciamiento(id);
  const products = await loadProductCommitments(id);
  res.status(201).json({
    ...mapPropuesta(detail.rows[0]),
    ...keywords,
    preguntasGenerales: preguntas,
    participantes: team,
    objetivosEspecificos: objectives,
    planAccion: plan,
    compromisosProductos: products,
    ...budget,
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
    modalidad: string;
  }>(`SELECT id_coordinador, estado_actual, modalidad FROM propuesta WHERE id_propuesta = $1`, [
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
  const presupuestoAnual = parsePresupuestoAnual(req.body?.presupuestoAnual);
  if (presupuestoAnual === null) {
    res.status(400).json({ error: "Presupuesto anual inválido" });
    return;
  }
  const financiamiento = parseFinanciamiento(req.body?.financiamiento);
  if (financiamiento === null) {
    res.status(400).json({ error: "Financiamiento inválido" });
    return;
  }
  const divulgacion = parseDivulgacion(req.body?.divulgacion);
  const aspectosEticos = parseAspectosEticos(req.body?.aspectosEticos);
  const hojaRuta = parseHojaRuta(req.body?.hojaRuta);
  const declaracionJurada = parseDeclaracionJurada(
    req.body?.declaracionJurada,
  );
  const resguardoProductos = parseResguardoProductos(
    req.body?.resguardoProductos,
  );
  if (
    divulgacion === null ||
    aspectosEticos === null ||
    hojaRuta === null ||
    declaracionJurada === null ||
    resguardoProductos === null
  ) {
    res.status(400).json({
      error: "Divulgación, aspectos éticos, hoja de ruta o declaración jurada inválidos",
    });
    return;
  }
  const modalityForProducts =
    req.body?.modalidad === undefined
      ? row.modalidad
      : MODALIDAD_MAP[String(req.body.modalidad).trim()];
  if (!modalityForProducts) {
    res.status(400).json({ error: "modalidad inválida" });
    return;
  }
  const compromisosProductos = parseProductCommitments(
    req.body?.compromisosProductos,
    modalityForProducts,
  );
  if (compromisosProductos === null) {
    res.status(400).json({ error: "Compromisos de productos inválidos" });
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
  if (divulgacion !== undefined) {
    set("divulgacion", JSON.stringify(divulgacion));
  }
  if (hojaRuta !== undefined) {
    set("hoja_ruta", JSON.stringify(hojaRuta));
  }
  if (aspectosEticos !== undefined) {
    set("aspectos_eticos", JSON.stringify(aspectosEticos));
  }
  if (declaracionJurada !== undefined) {
    set("declaracion_jurada", JSON.stringify(declaracionJurada));
  }
  if (resguardoProductos !== undefined) {
    set("resguardo_productos", JSON.stringify(resguardoProductos));
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
  await replacePresupuestoFinanciamiento(id, presupuestoAnual, financiamiento);
  const productsSaved = await replaceProductCommitments(
    id,
    compromisosProductos,
    modalityForProducts,
  );
  if (productsSaved === "invalid_objective") {
    res.status(400).json({
      error: "Cada producto debe asociarse a un objetivo específico de la propuesta",
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
  const budget = await loadPresupuestoFinanciamiento(id);
  const products = await loadProductCommitments(id);
  res.json({
    ...mapPropuesta(detail.rows[0]),
    ...keywords,
    preguntasGenerales: preguntas,
    participantes: team,
    objetivosEspecificos: objectives,
    planAccion: plan,
    compromisosProductos: products,
    ...budget,
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
      modalidad: string;
      divulgacion: string | null;
      hoja_ruta: string | null;
      aspectos_eticos: AspectosEticosInput | null;
      declaracion_jurada: DeclaracionJuradaInput | null;
      resguardo_productos: ResguardoProductosInput | null;
    }>(
      `SELECT id_coordinador, estado_actual, titulo, modalidad,
        divulgacion, hoja_ruta, aspectos_eticos, declaracion_jurada,
        resguardo_productos
      FROM propuesta WHERE id_propuesta = $1`,
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
    const divulgacion = parseStoredJson<DivulgacionInput>(row.divulgacion);
    const hojaRuta = parseStoredJson<HojaRutaInput>(row.hoja_ruta);
    if (
      !hasRequiredTextFields(divulgacion, [
        "divulgacionCientifica",
        "canalesInstitucionales",
        "eventosSocializacion",
        "mediosMasivos",
      ]) ||
      !hasRequiredTextFields(hojaRuta, [
        "lineaInvestigacion",
        "objetivoEstrategico",
        "duracionTotal",
        "fases",
        "productosIntermedios",
      ])
    ) {
      res.status(400).json({
        error:
          "Completá las secciones de divulgación y socialización y hoja de ruta antes de enviar.",
      });
      return;
    }
    if (!isEthicalReviewComplete(row.aspectos_eticos)) {
      res.status(400).json({
        error: "Completá las respuestas y la justificación o datos del aval en aspectos éticos antes de enviar.",
      });
      return;
    }
    if (!isDeclarationComplete(row.declaracion_jurada)) {
      res.status(400).json({
        error:
          "Completá la declaración jurada, el nombre, la cédula y la firma de la persona coordinadora antes de enviar.",
      });
      return;
    }
    if (!isResguardoProductosComplete(row.resguardo_productos)) {
      res.status(400).json({
        error:
          "Completá y aceptá los compromisos de resguardo y depósito de productos antes de enviar.",
      });
      return;
    }
    const productValidation = await validateProductCommitmentsForSubmission(
      id,
      row.modalidad,
    );
    if (productValidation !== "valid") {
      res.status(400).json({
        error:
          productValidation === "invalid_hours"
            ? "Las horas semanales del equipo TEC deben estar entre 1 y 30 para determinar los productos mínimos."
            : productValidation === "missing_academic"
              ? "Completá la cantidad mínima de productos académicos según las horas semanales y asociá cada uno a un objetivo específico."
              : productValidation === "missing_asset"
                ? "Los proyectos de desarrollo tecnológico deben incluir al menos un activo de propiedad industrial con el consecutivo del dictamen."
                : "Completá la cantidad mínima de combinaciones de productos académicos y activos de propiedad industrial según las horas semanales.",
      });
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
    const budget = await loadPresupuestoFinanciamiento(id);
    const compromisosProductos = await loadProductCommitments(id);
    res.json({
      ...mapPropuesta(detail.rows[0]),
      ...keywords,
      preguntasGenerales,
      participantes,
      objetivosEspecificos,
      planAccion,
      compromisosProductos,
      ...budget,
    });
  },
);
