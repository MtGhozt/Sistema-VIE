export type RoleId =
  | "vie_publicacion"
  | "investigador"
  | "vinculacion"
  | "comite_asistente"
  | "comite_evaluador"
  | "consejo_asistente"
  | "consejo"
  | "direccion_escuela"
  | "gestora_vie"
  | "cie"
  | "direccion_investigacion"
  | "admin";

export type RoleDef = {
  id: RoleId;
  label: string;
  short: string;
};

export type NavKey =
  | "/inicio"
  | "/convocatorias"
  | "/propuestas"
  | "/evaluaciones"
  | "/historico"
  | "/notificaciones"
  | "/administracion";

export const ROLES: RoleDef[] = [
  { id: "vie_publicacion", label: "VIE — Publicación", short: "VIE" },
  {
    id: "investigador",
    label: "Persona Investigadora Coordinadora",
    short: "Investigador",
  },
  { id: "vinculacion", label: "Centro de Vinculación", short: "Vinculación" },
  {
    id: "comite_asistente",
    label: "Asistente del Comité Técnico",
    short: "Asistente Comité",
  },
  {
    id: "comite_evaluador",
    label: "Cuerpo Evaluador del Comité Técnico",
    short: "Evaluador Comité",
  },
  {
    id: "consejo_asistente",
    label: "Asistente del Consejo de Escuela",
    short: "Asistente Consejo",
  },
  { id: "consejo", label: "Consejo de Profesores", short: "Consejo" },
  {
    id: "direccion_escuela",
    label: "Dirección de Escuela",
    short: "Dirección Escuela",
  },
  { id: "gestora_vie", label: "Persona Gestora VIE", short: "Gestora VIE" },
  {
    id: "cie",
    label: "Consejo de Investigación y Extensión (CIE)",
    short: "CIE",
  },
  {
    id: "direccion_investigacion",
    label: "Dirección de Investigación",
    short: "Dirección Investigación",
  },
  { id: "admin", label: "Super Administrador", short: "Super Admin" },
];

/** Persona demo por rol: [nombre, cargo corto] */
export const PERSONAS: Record<RoleId, [string, string]> = {
  investigador: ["María Rodríguez", "Investigadora"],
  vie_publicacion: ["Laura Solano", "VIE — Publicación"],
  vinculacion: ["Sofía Vargas", "Centro de Vinculación"],
  comite_asistente: ["Andrés Salazar", "Asistente Comité"],
  comite_evaluador: ["Carlos Jiménez", "Evaluador Comité"],
  consejo_asistente: ["Paola Mora", "Asistente Consejo"],
  consejo: ["Consejo de Profesores", "Consejo de Escuela"],
  direccion_escuela: ["Dirección de Escuela", "Dirección"],
  gestora_vie: ["Ana Quesada", "Gestora VIE"],
  cie: ["Consejo de Investigación", "CIE"],
  direccion_investigacion: ["Dirección de Investigación", "VIE"],
  admin: ["Steadman Murillo", "Super Administrador"],
};

export const NAV_ITEMS: { to: NavKey; label: string; icon: string }[] = [
  { to: "/inicio", label: "Inicio", icon: "home" },
  { to: "/convocatorias", label: "Convocatorias", icon: "megaphone" },
  { to: "/propuestas", label: "Propuestas", icon: "file" },
  { to: "/evaluaciones", label: "Evaluaciones", icon: "clipboard" },
  { to: "/historico", label: "Histórico", icon: "archive" },
  { to: "/notificaciones", label: "Notificaciones", icon: "bell" },
];

/** Rutas visibles por rol (admin = todas + administración) */
export const ROUTES_BY_ROLE: Record<RoleId, NavKey[]> = {
  vie_publicacion: [
    "/inicio",
    "/convocatorias",
    "/historico",
    "/notificaciones",
  ],
  investigador: [
    "/inicio",
    "/convocatorias",
    "/propuestas",
    "/historico",
    "/notificaciones",
  ],
  vinculacion: ["/inicio", "/evaluaciones", "/historico", "/notificaciones"],
  comite_asistente: [
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ],
  comite_evaluador: [
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ],
  consejo_asistente: [
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ],
  consejo: ["/inicio", "/evaluaciones", "/historico", "/notificaciones"],
  direccion_escuela: [
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ],
  gestora_vie: ["/inicio", "/evaluaciones", "/historico", "/notificaciones"],
  cie: ["/inicio", "/evaluaciones", "/historico", "/notificaciones"],
  direccion_investigacion: [
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ],
  admin: [
    "/inicio",
    "/convocatorias",
    "/propuestas",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
    "/administracion",
  ],
};

export function getRole(id: string): RoleDef {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

export function isRoleId(id: string): id is RoleId {
  return ROLES.some((r) => r.id === id);
}
