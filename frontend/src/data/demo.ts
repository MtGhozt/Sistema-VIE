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

export const SESSION_KEY = "vie-session";
