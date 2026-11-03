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
      ["Pendientes", "3"],
      ["En progreso", "2"],
      ["Completadas", "12"],
      ["Consolidación pendiente", "1"],
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

export const PENDING_TASKS: Record<RoleId, [string, string, string][]> = {
  vie_publicacion: [
    ["Convocatoria VIE 2027", "Publicada", "Cierre 30 de septiembre"],
    [
      "Proyectos Interdisciplinarios 2027",
      "Borrador",
      "Pendiente de publicación",
    ],
  ],
  investigador: [
    [
      "PROP-2027-014 · Monitoreo IoT de calidad del agua",
      "Pendiente de dictamen PI",
      "Convocatoria Fondos VIE 2027",
    ],
    [
      "PROP-2026-008 · Plataforma de datos abiertos",
      "Borrador",
      "Última edición hace 2 días",
    ],
  ],
  vinculacion: [
    ["PROP-2027-014", "Pendiente de dictamen", "María Rodríguez"],
    ["PROP-2027-012", "En revisión", "Luis Vargas"],
  ],
  comite_asistente: [
    ["PROP-2027-009", "Pendiente de completitud", "Expediente recibido hoy"],
    ["PROP-2027-011", "Con faltantes", "Falta acuerdo de participación"],
  ],
  comite_evaluador: [
    ["PROP-2027-007", "Pendiente", "Rúbrica modalidad aplicada"],
    ["PROP-2027-005", "En progreso", "3 de 5 criterios"],
  ],
  consejo_asistente: [
    ["PROP-2027-003", "Recibido del Comité", "Preparar para sesión"],
    ["PROP-2027-001", "Listo", "Oficio consolidado"],
  ],
  consejo: [
    ["PROP-2027-003", "Pendiente de aval", "Calificación Comité: 8.4"],
    ["PROP-2026-019", "Pendiente de aval", "Sesión 12/10"],
  ],
  direccion_escuela: [
    ["PROP-2027-002", "Aval aprobado", "Comunicar a VIE"],
    ["PROP-2026-021", "Enviado", "Esperando confirmación"],
  ],
  gestora_vie: [
    ["PROP-2027-004", "Pendiente verificación", "Ruta de escuela completa"],
    ["PROP-2027-006", "Con observaciones", "Presupuesto por año"],
  ],
  cie: [
    ["PROP-2027-004", "Pendiente resolución", "Rúbrica CIE"],
    ["PROP-2026-015", "En evaluación", "Observaciones abiertas"],
  ],
  direccion_investigacion: [
    ["PROP-2026-015", "Aprobada CIE", "Notificar a investigadora"],
    ["PROP-2026-011", "Rechazada CIE", "Notificar con fundamento"],
  ],
  admin: [
    ["Flujo institucional", "12 acciones pendientes", "Todas las instancias"],
    ["Usuarios demo", "47 cuentas", "Sin integración Orión"],
  ],
};

export type ConvocatoriaDemo = {
  id: string;
  nombre: string;
  apertura: string;
  cierre: string;
  estado: string;
  propuestas: number;
};

export const CONVOCATORIAS: ConvocatoriaDemo[] = [
  {
    id: "VIE-2027-01",
    nombre: "Convocatoria Interna para Investigación – Fondos VIE 2027",
    apertura: "05/08/2026",
    cierre: "30/09/2026",
    estado: "Publicada",
    propuestas: 17,
  },
  {
    id: "VIE-2026-02",
    nombre: "Convocatoria de Fortalecimiento de Grupos de Investigación 2026",
    apertura: "12/02/2026",
    cierre: "30/04/2026",
    estado: "Finalizada",
    propuestas: 22,
  },
  {
    id: "VIE-2027-02",
    nombre: "Convocatoria de Proyectos Interdisciplinarios 2027",
    apertura: "15/10/2026",
    cierre: "15/12/2026",
    estado: "Borrador",
    propuestas: 0,
  },
];

export const MODALIDADES = [
  "Investigación básica",
  "Investigación aplicada",
  "Investigación básica y aplicada",
  "Desarrollo tecnológico",
] as const;

export const NOTIFICACIONES = [
  {
    id: "n1",
    title: "Dictamen PI pendiente",
    body: "PROP-2027-014 requiere dictamen del Centro de Vinculación.",
    when: "Hoy · 09:12",
    unread: true,
  },
  {
    id: "n2",
    title: "Convocatoria publicada",
    body: "Fondos VIE 2027 está abierta hasta el 30/09/2026.",
    when: "Ayer · 16:40",
    unread: true,
  },
  {
    id: "n3",
    title: "Observación registrada",
    body: "El Comité Técnico solicitó completar el acuerdo de participación.",
    when: "28/09/2026",
    unread: false,
  },
];

/** Etapas del flujo institucional (prototipo HTML `_a`). */
export const FLOW_STAGES = [
  "Formulación",
  "Vinculación",
  "Comité Técnico",
  "Consejo de Escuela",
  "VIE",
  "CIE",
  "Resolución",
] as const;

/** Tarjetas “Acceso a instancias” del panel admin (prototipo `tp`). */
export const ADMIN_INSTANCE_CARDS: [string, string, string, string][] = [
  ["VIE — publicación", "1", "convocatorias activas", "/convocatorias"],
  ["Investigadores", "5", "propuestas en formulación", "/propuestas"],
  ["Vinculación", "4", "dictámenes PI pendientes", "/evaluaciones"],
  ["Comité Técnico", "6", "expedientes por revisar", "/evaluaciones"],
  ["Consejo de Escuela", "2", "avales pendientes", "/evaluaciones"],
  ["Gestora VIE", "5", "expedientes pendientes", "/evaluaciones"],
  ["CIE", "3", "resoluciones pendientes", "/evaluaciones"],
  [
    "Dirección de Investigación",
    "2",
    "notificaciones pendientes",
    "/evaluaciones",
  ],
];

/** Roles en la rejilla “Vista transversal” del detalle admin. */
export const ADMIN_STAGE_ROLES = [
  "Vinculación",
  "Asistente Comité",
  "Evaluador Comité",
  "Asistente Consejo",
  "Consejo",
  "Dirección Escuela",
  "Gestora VIE",
  "CIE",
  "Dirección Investigación",
] as const;

export type DemoProposal = {
  id: string;
  databaseId?: number;
  titulo: string;
  convocatoria: string;
  investigadora: string;
  escuela: string;
  modalidad: string;
  estado: string;
  /** Índice activo 0–6 (como `etapa` del HTML). */
  etapa: number;
  piRequired: boolean;
  presupuesto: string;
  resumen: string;
  abstract: string;
  palabras: string[];
  keywords: string[];
  teamTec: {
    id?: number;
    nombre: string;
    orcid?: string;
    instancia: string;
    rol: string;
    horas: string;
    periodo?: string;
  }[];
  teamExternal?: {
    id?: number;
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
  timeline?: { titulo: string; detalle: string; fecha: string }[];
  documentos: { nombre: string; estado: string }[];
  evaluacionComite?: { average: number };
  oficioComite?: string;
  oficioPI?: string;
  oficioAval?: string;
  resolucion?: string;
  justificacionResolucion?: string;
  notificada?: boolean;
  justificacionAval?: string;
  confidencialidad?: string;
};

/** Expedientes usados en Evaluaciones (selector del prototipo HTML). */
export function getEvaluationProposals(): DemoProposal[] {
  return DEMO_PROPOSALS.filter((p) => p.id !== "PROP-2026-031");
}

export const DEMO_PROPOSALS: DemoProposal[] = [
  {
    id: "PROP-2027-014",
    titulo:
      "Sistema inteligente para monitoreo de calidad del agua mediante sensores IoT",
    convocatoria:
      "Convocatoria Interna para Investigación – Fondos VIE 2027",
    investigadora: "María Rodríguez",
    escuela: "Escuela de Ingeniería en Computación",
    modalidad: "Desarrollo tecnológico",
    estado: "Pendiente de dictamen PI",
    etapa: 1,
    piRequired: true,
    presupuesto: "₡18 450 000",
    resumen:
      "Diseño y validación de una plataforma de monitoreo de calidad del agua basada en sensores IoT, analítica de datos y visualización web para apoyar la toma de decisiones en comunidades rurales.",
    abstract:
      "Design and validation of an IoT-based water-quality monitoring platform combining low-cost sensors, data analytics and web visualization to support decision-making in rural communities.",
    palabras: ["IoT", "calidad del agua", "sensores", "analítica"],
    keywords: ["IoT", "water quality", "sensors", "analytics"],
    teamTec: [
      {
        nombre: "María Rodríguez",
        orcid: "0000-0002-3141-7782",
        instancia: "Escuela de Ingeniería en Computación",
        rol: "Coordinadora",
        horas: "10 VIE",
        periodo: "Ene 2027 – Jun 2028",
      },
      {
        nombre: "José Méndez",
        orcid: "0000-0001-1147-6209",
        instancia: "Escuela de Ingeniería Electrónica",
        rol: "Investigador",
        horas: "6 VIE",
        periodo: "Ene 2027 – Jun 2028",
      },
    ],
    teamExternal: [
      {
        nombre: "Andrea Quesada",
        orcid: "0000-0003-1022-5421",
        institucion: "ASADA San Rafael",
      },
    ],
    plan: [
      {
        objetivo: "OE1",
        actividad: "Diseñar arquitectura IoT",
        resultado: "Arquitectura validada",
        participantes: "MR, JM",
        responsabilidad: "Ejecuta",
        riesgo: "Retraso de componentes",
        mitigacion: "Proveedor alterno y compra temprana",
        responsable: "MR",
        inicio: 1,
        duracion: 3,
      },
      {
        objetivo: "OE2",
        actividad: "Implementar prototipo",
        resultado: "MVP funcional",
        participantes: "JM, MR",
        responsabilidad: "Ejecuta",
        riesgo: "Fallas de integración",
        mitigacion: "Pruebas incrementales",
        responsable: "JM",
        inicio: 4,
        duracion: 6,
      },
    ],
    presupuestoAnual: [
      { anio: 2027, operativo: 2_800_000, duraderos: 9_500_000 },
      { anio: 2028, operativo: 6_150_000, duraderos: 0 },
    ],
    financiamiento: [
      {
        tipo: "Financiamiento externo",
        anio1: 1_500_000,
        anio2: 500_000,
        anio3: 0,
        oficio: "Oficio-DE-001-2026 · Fundación Agua Clara",
      },
      {
        tipo: "Contrapartida",
        anio1: 750_000,
        anio2: 250_000,
        anio3: 0,
        oficio: "ESC-COMP-088-2026 · Escuela de Computación",
      },
    ],
    productos: [
      "Desarrollo de Software",
      "Artículo científico WoS/Scopus",
    ],
    activoPI: "Desarrollo de Software",
    confidencialidad: "No",
    evaluacionComite: { average: 87 },
    oficioComite: "CT-041-2026",
    oficioPI: "CV-023-2026",
    etica:
      "No requiere autorización de ente ético o regulatorio; no involucra seres humanos, biodiversidad ni animales vertebrados.",
    observaciones: [],
    timeline: [
      {
        titulo: "Propuesta creada",
        detalle: "Se inició la formulación de la propuesta.",
        fecha: "12 Ago",
      },
      {
        titulo: "Propuesta enviada",
        detalle:
          "La propuesta fue enviada para continuar el flujo institucional.",
        fecha: "18 Ago",
      },
    ],
    documentos: [
      { nombre: "Formulario de propuesta", estado: "Completo" },
      { nombre: "Plan de acción y riesgos", estado: "Completo" },
      { nombre: "Presupuesto", estado: "Completo" },
      { nombre: "Acuerdo de instancia coordinadora", estado: "Completo" },
      { nombre: "Acuerdo de instancia participante", estado: "Completo" },
      { nombre: "Cartas de compromiso", estado: "Completo" },
      { nombre: "Dictamen de PI", estado: "Pendiente" },
    ],
  },
  {
    id: "PROP-2027-009",
    titulo: "Plataforma de análisis de movilidad urbana con datos abiertos",
    convocatoria:
      "Convocatoria Interna para Investigación – Fondos VIE 2027",
    investigadora: "Carlos Jiménez",
    escuela: "Escuela de Ingeniería en Computación",
    modalidad: "Investigación aplicada",
    estado: "En evaluación por Comité Técnico",
    etapa: 2,
    piRequired: false,
    presupuesto: "₡12 780 000",
    resumen:
      "Análisis de patrones de movilidad urbana a partir de datos abiertos institucionales y sensores municipales.",
    abstract:
      "Urban mobility pattern analysis from institutional open data and municipal sensors.",
    palabras: ["movilidad", "datos abiertos", "urbanismo"],
    keywords: ["mobility", "open data", "urban"],
    teamTec: [
      {
        nombre: "Carlos Jiménez",
        instancia: "Escuela de Ingeniería en Computación",
        rol: "Coordinador",
        horas: "8 VIE",
      },
    ],
    documentos: [
      { nombre: "Formulario de propuesta", estado: "Completo" },
      { nombre: "Plan de acción y riesgos", estado: "Completo" },
      { nombre: "Presupuesto", estado: "Completo" },
      { nombre: "Dictamen de PI", estado: "No requerido" },
    ],
  },
  {
    id: "PROP-2026-031",
    titulo: "Optimización energética en microredes universitarias",
    convocatoria:
      "Convocatoria de Fortalecimiento de Grupos de Investigación 2026",
    investigadora: "Ana Solano",
    escuela: "Escuela de Electromecánica",
    modalidad: "Investigación básica y aplicada",
    estado: "Aprobada",
    etapa: 7,
    piRequired: false,
    presupuesto: "₡21 300 000",
    resumen:
      "Modelo de optimización energética para microredes en campus universitarios con generación distribuida.",
    abstract:
      "Energy optimization model for campus microgrids with distributed generation.",
    palabras: ["energía", "microredes", "optimización"],
    keywords: ["energy", "microgrids", "optimization"],
    teamTec: [
      {
        nombre: "Ana Solano",
        instancia: "Escuela de Electromecánica",
        rol: "Coordinadora",
        horas: "10 VIE",
      },
    ],
    documentos: [
      { nombre: "Formulario de propuesta", estado: "Completo" },
      { nombre: "Resolución CIE", estado: "Completo" },
    ],
  },
];

export function getDemoProposal(id: string): DemoProposal | undefined {
  return DEMO_PROPOSALS.find((p) => p.id === id);
}

export const SESSION_KEY = "vie-session";
