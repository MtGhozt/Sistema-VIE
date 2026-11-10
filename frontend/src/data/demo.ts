import type { RoleId } from "./roles";

export type HomeSummary = {
  eyebrow: string;
  title: string;
  description: string;
  stats: [string, string][];
};

export const HOME_BY_ROLE: Record<RoleId, HomeSummary> = {
  vie_publicacion: {
    eyebrow: "VIE — Publicación",
    title: "Gestión de convocatorias",
    description:
      "Publicá la convocatoria Fondos VIE, administrá el cronograma y consultá convocatorias vigentes e históricas.",
    stats: [
      ["Convocatorias activas", "1"],
      ["Borradores", "2"],
      ["Próximas a cerrar", "1"],
      ["Finalizadas", "8"],
    ],
  },
  investigador: {
    eyebrow: "Persona investigadora",
    title: "Inicio",
    description:
      "Panel de control académico y postulación de propuestas de investigación.",
    stats: [
      ["Borradores", "1"],
      ["En revisión", "1"],
      ["Requieren corrección", "0"],
      ["Aprobadas", "2"],
      ["Rechazadas", "1"],
    ],
  },
  vinculacion: {
    eyebrow: "Centro de Vinculación",
    title: "Dictámenes de Propiedad Intelectual",
    description:
      "Revisá propuestas con potencial de protección y registrá el dictamen técnico de propiedad intelectual.",
    stats: [
      ["Pendientes de dictamen", "4"],
      ["En revisión", "1"],
      ["Dictámenes emitidos", "18"],
      ["No requeridos", "7"],
    ],
  },
  comite_asistente: {
    eyebrow: "Asistente del Comité Técnico",
    title: "Revisión de completitud",
    description:
      "Verificá que cada expediente esté completo antes de enviarlo al cuerpo evaluador.",
    stats: [
      ["Pendientes", "6"],
      ["Con faltantes", "2"],
      ["Listas para evaluación", "3"],
      ["Devueltas", "1"],
    ],
  },
  comite_evaluador: {
    eyebrow: "Evaluador del Comité Técnico",
    title: "Evaluaciones asignadas",
    description:
      "Evaluá con la rúbrica oficial, registrá una nota independiente y justificá la revisión humana.",
    stats: [
      ["En bandeja", "3"],
      ["Recién enviadas", "2"],
      ["En evaluación", "12"],
      ["Ya dictaminadas", "1"],
    ],
  },
  consejo_asistente: {
    eyebrow: "Asistente del Consejo",
    title: "Preparación de expedientes",
    description:
      "Recibí la calificación y el oficio del Comité, prepará el expediente y remitilo al Consejo.",
    stats: [
      ["Recibidos", "4"],
      ["Pendientes de preparar", "2"],
      ["Listos para sesión", "2"],
      ["Enviados", "9"],
    ],
  },
  consejo: {
    eyebrow: "Consejo de Profesores",
    title: "Avales pendientes",
    description:
      "Revisá el expediente consolidado, aprobá o rechazá el aval y generá el oficio correspondiente.",
    stats: [
      ["Pendientes de aval", "2"],
      ["Avaladas", "11"],
      ["Rechazadas", "3"],
      ["Sesión próxima", "1"],
    ],
  },
  direccion_escuela: {
    eyebrow: "Dirección de Escuela",
    title: "Comunicación de avales",
    description:
      "Comunicá a la VIE los avales aprobados por el Consejo de Escuela.",
    stats: [
      ["Pendientes de comunicar", "2"],
      ["Enviados", "14"],
      ["Con confirmación", "13"],
      ["Por revisar", "1"],
    ],
  },
  gestora_vie: {
    eyebrow: "Gestora VIE",
    title: "Verificación de expedientes",
    description:
      "Revisá contenido, completitud y observaciones antes de remitir las propuestas al CIE.",
    stats: [
      ["Expedientes pendientes", "5"],
      ["Con observaciones", "2"],
      ["Listos para CIE", "3"],
      ["Devueltos", "1"],
    ],
  },
  cie: {
    eyebrow: "CIE",
    title: "Evaluación y resolución",
    description:
      "Evaluá mediante rúbrica, registrá observaciones y determiná aprobación o rechazo.",
    stats: [
      ["Pendientes de resolución", "3"],
      ["En evaluación", "2"],
      ["Aprobadas", "21"],
      ["Rechazadas", "6"],
    ],
  },
  direccion_investigacion: {
    eyebrow: "Dirección de Investigación",
    title: "Notificación de resoluciones",
    description:
      "Recibí los dictámenes del CIE y notificá formalmente el resultado a las instancias y personas investigadoras.",
    stats: [
      ["Pendientes de notificar", "2"],
      ["Notificadas", "26"],
      ["Aprobaciones", "21"],
      ["Rechazos", "5"],
    ],
  },
  admin: {
    eyebrow: "Super Administrador",
    title: "Panel general del sistema",
    description:
      "Supervisá el flujo completo, ingresá a cualquier bandeja y administrá la configuración transversal del prototipo.",
    stats: [
      ["Propuestas activas", "18"],
      ["Usuarios", "47"],
      ["Acciones pendientes", "12"],
      ["Convocatorias", "11"],
      ["Resoluciones 2026", "27"],
    ],
  },
};

export const PRIMARY_CTA: Record<
  RoleId,
  { label: string; path: string }
> = {
  vie_publicacion: { label: "Nueva convocatoria", path: "/convocatorias" },
  investigador: { label: "Crear propuesta", path: "/propuestas/nueva" },
  vinculacion: { label: "Revisar dictámenes", path: "/evaluaciones" },
  comite_asistente: { label: "Revisar expedientes", path: "/evaluaciones" },
  comite_evaluador: { label: "Ir a evaluaciones", path: "/evaluaciones" },
  consejo_asistente: { label: "Preparar expedientes", path: "/evaluaciones" },
  consejo: { label: "Revisar avales", path: "/evaluaciones" },
  direccion_escuela: { label: "Comunicar avales", path: "/evaluaciones" },
  gestora_vie: { label: "Revisar expedientes", path: "/evaluaciones" },
  cie: { label: "Evaluar propuestas", path: "/evaluaciones" },
  direccion_investigacion: {
    label: "Ver resoluciones",
    path: "/evaluaciones",
  },
  admin: { label: "Administrar sistema", path: "/administracion" },
};

export type DemoProposal = {
  numericId?: number;
  coordinadorCorreo?: string;
  fechaResolucion?: string | null;
  id: string;
  titulo: string;
  convocatoria: string;
  investigadora: string;
  escuela: string;
  modalidad: string;
  estado: string;
  /** Índice activo 0–6 (como `etapa` del HTML). */
  etapa: number;
  piRequired: boolean;
  piAcreditada?: boolean;
  presupuesto: string;
  resumen: string;
  abstract: string;
  palabras: string[];
  keywords: string[];
  teamTec: {
    nombre: string;
    orcid?: string;
    instancia: string;
    rol: string;
    horas: string;
    periodo?: string;
  }[];
  teamExternal?: {
    nombre: string;
    orcid?: string;
    institucion: string;
  }[];
  plan?: {
    objetivo: string;
    actividad: string;
    resultado: string;
    participantes: string;
    responsabilidad: string;
    riesgo: string;
    mitigacion: string;
    responsable: string;
    inicio: number;
    duracion: number;
  }[];
  presupuestoAnual?: { anio: number; operativo: number; duraderos: number }[];
  financiamiento?: {
    tipo: string;
    anio1: number;
    anio2: number;
    anio3: number;
    oficio: string;
  }[];
  productos?: string[];
  activoPI?: string;
  etica?: string;
  observaciones?: string[];
  timeline?: { id?: number; titulo: string; detalle: string; fecha: string }[];
  documentos: { nombre: string; estado: string }[];
  evaluacionComite?: { average: number };
  oficioComite?: string;
  oficioPI?: string;
  oficioAval?: string;
  resolucion?: string;
  notificada?: boolean;
  vieChecks?: Record<string, boolean>;
  justificacionAval?: string;
  confidencialidad?: string;
};

/** Clave de sesión demo en localStorage (headers X-Demo-* hacia la API). */
export const SESSION_KEY = "vie-session";

