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
  | "/estadisticas"
  | "/notificaciones"
  | "/administracion"
  | "/perfil";

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

export const NAV_ITEMS: { to: NavKey; label: string; icon: string }[] = [
  { to: "/inicio", label: "Inicio", icon: "home" },
  { to: "/convocatorias", label: "Convocatorias Fondos", icon: "megaphone" },
  { to: "/propuestas", label: "Propuestas", icon: "file" },
  { to: "/evaluaciones", label: "Evaluaciones", icon: "clipboard" },
  { to: "/historico", label: "Histórico", icon: "archive" },
  { to: "/estadisticas", label: "Estadísticas", icon: "chart" },
  { to: "/notificaciones", label: "Notificaciones", icon: "bell" },
];

/** Rutas visibles por rol (admin = todas + administración) */
function withStats(routes: NavKey[]): NavKey[] {
  const out = [...routes];
  const hist = out.indexOf("/historico");
  if (hist >= 0) out.splice(hist + 1, 0, "/estadisticas");
  else out.push("/estadisticas");
  return out;
}

export const ROUTES_BY_ROLE: Record<RoleId, NavKey[]> = {
  vie_publicacion: withStats([
    "/inicio",
    "/convocatorias",
    "/historico",
    "/notificaciones",
  ]),
  investigador: withStats([
    "/inicio",
    "/convocatorias",
    "/propuestas",
    "/historico",
    "/notificaciones",
  ]),
  vinculacion: withStats(["/inicio", "/evaluaciones", "/historico", "/notificaciones"]),
  comite_asistente: withStats([
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ]),
  comite_evaluador: withStats([
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ]),
  consejo_asistente: withStats([
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ]),
  consejo: withStats(["/inicio", "/evaluaciones", "/historico", "/notificaciones"]),
  direccion_escuela: withStats([
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ]),
  gestora_vie: withStats(["/inicio", "/evaluaciones", "/historico", "/notificaciones"]),
  cie: withStats(["/inicio", "/evaluaciones", "/historico", "/notificaciones"]),
  direccion_investigacion: withStats([
    "/inicio",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
  ]),
  admin: withStats([
    "/inicio",
    "/convocatorias",
    "/propuestas",
    "/evaluaciones",
    "/historico",
    "/notificaciones",
    "/administracion",
  ]),
};

export function getRole(id: string): RoleDef {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

export function isRoleId(id: string): id is RoleId {
  return ROLES.some((r) => r.id === id);
}
