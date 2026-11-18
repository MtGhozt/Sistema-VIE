import { NOTIFICACION_FILTROS } from "./notificacionEstado.js";
import { CIE_PENDIENTE_SQL } from "./cieEstado.js";
import { DIRECCION_FILTROS, AVAL_COMUNICADO_SQL } from "./direccionEstado.js";
import {
  CONSEJO_DECISION_FILTROS,
  CONSEJO_PENDIENTE_SQL,
} from "./consejoEstado.js";
import { COMITE_ENVIADO_SQL } from "./comiteEstado.js";

export const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  en_subsanacion: "En subsanación",
  enviada: "Enviada",
  en_evaluacion: "En evaluación",
  dictaminada: "Dictaminada",
  avalada: "Avalada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  rechazo_aval: "Aval rechazado",
};

export const MODALIDAD_LABEL: Record<string, string> = {
  basica: "Investigación básica",
  aplicada: "Investigación aplicada",
  basica_aplicada: "Investigación básica y aplicada",
  desarrollo_tecnologico: "Desarrollo tecnológico",
  fortalecimiento: "Fortalecimiento",
};

export type BandejaRow = {
  id_propuesta: number;
  codigo: string;
  titulo: string;
  modalidad: string;
  modalidad_nombre: string | null;
  estado_actual: string;
  etapa_flujo: number;
  fecha_envio: string | null;
  resumen: string | null;
  abstract_en: string | null;
  requiere_dictamen_pi: boolean;
  pi_estado: string | null;
  escuela_nombre: string;
  coordinador_nombre: string;
  convocatoria_nombre: string;
  oficio_pi: string | null;
  oficio_comite: string | null;
  oficio_aval: string | null;
  resolucion: string | null;
  calificacion_comite: string | null;
  notificada: boolean;
  justificacion_aval: string | null;
  coordinador_correo: string;
  fecha_resolucion: string | null;
  vie_checks: Record<string, boolean>;
  comite_enviado: boolean;
  fecha_comite: string | null;
  fecha_aval: string | null;
};

export const BANDEJA_SQL = `
  SELECT
    p.id_propuesta,
    (${COMITE_ENVIADO_SQL}) AS comite_enviado,
    p.codigo,
    p.titulo,
    p.modalidad,mc.nombre AS modalidad_nombre,
    p.estado_actual,
    p.etapa_flujo,
    p.fecha_envio,
    p.resumen,
    p.abstract_en,
    p.requiere_dictamen_pi,
    CASE WHEN NOT p.requiere_dictamen_pi AND pcn.id_propuesta IS NOT NULL THEN 'no_requerido' ELSE dpi.estado END AS pi_estado,
    e.nombre AS escuela_nombre,
    u.nombre_completo AS coordinador_nombre,
    u.correo_institucional AS coordinador_correo,
    r.fecha_resolucion,
    c.nombre AS convocatoria_nombre,
    dpi.numero_oficio AS oficio_pi,
    rc.numero_oficio AS oficio_comite,
    av.numero_oficio AS oficio_aval,
    r.numero_resolucion AS resolucion,
    COALESCE((SELECT json_object_agg(ch.codigo_item,ch.verificado) FROM revision_checklist ch
      WHERE ch.id_revision=(SELECT rv.id_revision FROM revision_expediente rv WHERE rv.id_propuesta=p.id_propuesta AND rv.etapa='vie' AND rv.resultado<>'devuelto' AND NOT EXISTS(SELECT 1 FROM revision_expediente newer WHERE newer.id_propuesta=rv.id_propuesta AND newer.etapa='vie' AND newer.ciclo>rv.ciclo) ORDER BY rv.ciclo DESC LIMIT 1)), '{}'::json) AS vie_checks,
    av.observaciones AS justificacion_aval,
    EXISTS (SELECT 1 FROM comunicacion_institucional ci WHERE ci.id_propuesta=p.id_propuesta AND ci.tipo='resolucion_cie' AND ci.confirmada=true) AS notificada,
    av.fecha_aval,
    rc.fecha_dictamen AS fecha_comite,
    rc.calificacion_promedio::text AS calificacion_comite
  FROM propuesta p
  LEFT JOIN modalidad_catalogo mc ON mc.codigo=p.modalidad
  JOIN escuela e ON e.id_escuela = p.id_escuela
  JOIN usuario u ON u.id_usuario = p.id_coordinador
  JOIN convocatoria c ON c.id_convocatoria = p.id_convocatoria
  LEFT JOIN dictamen_pi dpi ON dpi.id_propuesta = p.id_propuesta
  LEFT JOIN pi_certificacion_no_requerido pcn ON pcn.id_propuesta = p.id_propuesta
  LEFT JOIN resultado_comite rc ON rc.id_propuesta = p.id_propuesta
  LEFT JOIN aval_consejo av ON av.id_propuesta = p.id_propuesta
  LEFT JOIN resolucion_cie r ON r.id_propuesta = p.id_propuesta
  WHERE p.estado_actual <> 'borrador'
`;

export function mapBandeja(row: BandejaRow) {
  return {
    fechaAval: row.fecha_aval,
    fechaDictamenComite: row.fecha_comite,
    comiteEnviado: row.comite_enviado,
    id: row.id_propuesta,
    codigo: row.codigo,
    titulo: row.titulo,
    modalidad: row.modalidad,
    modalidadLabel:
      row.modalidad_nombre ?? MODALIDAD_LABEL[row.modalidad] ?? row.modalidad,
    estadoActual: row.estado_actual,
    estadoLabel: ESTADO_LABEL[row.estado_actual] ?? row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
    resumen: row.resumen,
    abstractEn: row.abstract_en,
    piRequired: row.requiere_dictamen_pi,
    piEstado: row.pi_estado,
    escuela: row.escuela_nombre,
    investigadora: row.coordinador_nombre,
    coordinadorCorreo: row.coordinador_correo,
    fechaResolucion: row.fecha_resolucion,
    convocatoria: row.convocatoria_nombre,
    oficioPI: row.oficio_pi,
    oficioComite: row.oficio_comite,
    oficioAval: row.oficio_aval,
    resolucion: row.resolucion,
    notificada: row.notificada,
    vieChecks: row.vie_checks,
    justificacionAval: row.justificacion_aval,
    evaluacionComite: row.calificacion_comite
      ? { average: Number(row.calificacion_comite) }
      : null,
  };
}

/** Roles que pueden operar cada acción del prototipo. */
export const ACTION_ROLES: Record<string, Set<string>> = {
  pi: new Set(["vinculacion", "admin"]),
  "committee-confirm": new Set(["comite_asistente", "admin"]),
  "request-reconsideration": new Set(["investigador"]),
  "council-reconsider": new Set(["consejo", "admin"]),
  "pi-start": new Set(["vinculacion", "admin"]),
  "committee-ready": new Set(["comite_asistente", "admin"]),
  return: new Set(["comite_asistente", "gestora_vie", "admin"]),
  "pi-not-required": new Set(["vinculacion", "admin"]),
  "save-rubric": new Set(["comite_evaluador", "cie", "admin"]),
  "committee-score": new Set(["comite_evaluador", "admin"]),
  "send-council": new Set(["consejo_asistente", "admin"]),
  "council-approve": new Set(["consejo", "admin"]),
  "council-reject": new Set(["consejo", "admin"]),
  "communicate-aval": new Set(["direccion_escuela", "admin"]),
  "vie-checklist": new Set(["gestora_vie", "admin"]),
  "vie-observation": new Set(["gestora_vie", "admin"]),
  "send-cie": new Set(["gestora_vie", "admin"]),
  "cie-approve": new Set(["cie", "admin"]),
  "cie-reject": new Set(["cie", "admin"]),
  "notify-resolution": new Set(["direccion_investigacion", "admin"]),
};

export function roleOk(role: string | null | undefined, action: string) {
  const allowed = ACTION_ROLES[action];
  if (!allowed) return false;
  return !!role && allowed.has(role);
}

export const EVALUATION_VIEWS = new Set([
  "vinculacion",
  "comite_asistente",
  "comite_evaluador",
  "consejo_asistente",
  "consejo",
  "direccion_escuela",
  "gestora_vie",
  "cie",
  "direccion_investigacion",
  "admin",
]);

/** Filtro de bandeja por rol (etapa / estado). */
export function bandejaClause(role: string | null | undefined): {
  sql: string;
  params: unknown[];
} {
  switch (role) {
    case "vinculacion":
      return {
        sql: ` AND p.estado_actual IN ('enviada','en_evaluacion','dictaminada','avalada') AND
          (p.etapa_flujo<=1 OR (p.requiere_dictamen_pi AND NOT EXISTS(SELECT 1 FROM dictamen_pi d WHERE d.id_propuesta=p.id_propuesta AND d.estado='emitido'))
          OR (NOT p.requiere_dictamen_pi AND NOT EXISTS(SELECT 1 FROM pi_certificacion_no_requerido pc WHERE pc.id_propuesta=p.id_propuesta)))`,
        params: [],
      };
    case "comite_asistente":
      return {
        sql: ` AND p.etapa_flujo BETWEEN 1 AND 2 AND p.estado_actual IN ('enviada', 'en_evaluacion', 'dictaminada')`,
        params: [],
      };
    case "comite_evaluador":
      return {
        sql: ` AND p.etapa_flujo=2 AND p.estado_actual='en_evaluacion' AND ${COMITE_ENVIADO_SQL}`,
        params: [],
      };
    case "consejo_asistente":
      return { sql: ` AND ${CONSEJO_PENDIENTE_SQL}`, params: [] };
    case "consejo":
      return {
        sql: ` AND ((${CONSEJO_DECISION_FILTROS.aval_pendiente}) OR (${CONSEJO_DECISION_FILTROS.reconsideracion}))`,
        params: [],
      };
    case "direccion_escuela":
      return { sql: ` AND ${DIRECCION_FILTROS.por_comunicar}`, params: [] };
    case "gestora_vie":
      return {
        sql: ` AND p.etapa_flujo = 4 AND p.estado_actual='avalada' AND ${AVAL_COMUNICADO_SQL}`,
        params: [],
      };
    case "cie":
      return {
        sql: ` AND (${CIE_PENDIENTE_SQL})`,
        params: [],
      };
    case "direccion_investigacion":
      return {
        sql: ` AND (${NOTIFICACION_FILTROS.pendientes})`,
        params: [],
      };
    case "admin":
    default:
      return { sql: "", params: [] };
  }
}
