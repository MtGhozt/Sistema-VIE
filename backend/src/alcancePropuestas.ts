import { query } from "./db.js";
import type { DemoAuth } from "./middleware/demoAuth.js";
import { HttpError } from "./middleware/HttpError.js";

const institucionales = new Set(["comite_asistente", "comite_evaluador", "consejo_asistente", "consejo", "direccion_escuela", "vinculacion", "gestora_vie", "vie_publicacion", "cie", "direccion_investigacion"]);

/** Predicado reutilizado en listados, filtros, detalles y acciones. Parámetros con desplazamiento explícito. */
export function alcancePropuestas(auth: DemoAuth, inicio = 1) {
  if (auth.role === "admin") return { sql: `(p.estado_actual<>'borrador' OR p.id_coordinador=$${inicio})`, params: [auth.userId] as unknown[] };
  const usuario = `$${inicio}`;
  if (auth.role === "investigador") return {
    sql: `(p.id_coordinador=${usuario} OR (p.estado_actual<>'borrador' AND EXISTS (SELECT 1 FROM propuesta_participante pp WHERE pp.id_propuesta=p.id_propuesta AND pp.id_usuario=${usuario})))`,
    params: [auth.userId] as unknown[],
  };
  if (!institucionales.has(auth.role ?? "")) return { sql: "FALSE", params: [] as unknown[] };
  return {
    sql: `(p.estado_actual<>'borrador' AND (p.id_escuela=(SELECT id_escuela FROM usuario WHERE id_usuario=${usuario} AND activo=true) OR EXISTS (SELECT 1 FROM propuesta_asignacion pa WHERE pa.id_propuesta=p.id_propuesta AND pa.id_usuario=${usuario} AND pa.rol=$${inicio + 1})))`,
    params: [auth.userId, auth.role] as unknown[],
  };
}

export async function exigirAlcance(id: number, auth: DemoAuth, execute: typeof query = query) {
  const scope = alcancePropuestas(auth, 2);
  const allowed = await execute(`SELECT 1 FROM propuesta p WHERE p.id_propuesta=$1 AND ${scope.sql}`, [id, ...scope.params]);
  if (!allowed.rowCount) throw new HttpError(403, "El expediente está fuera de su ámbito o es un borrador ajeno");
}

export function etapaRol(role: string | null) {
  return ({ vinculacion: 1, comite_asistente: 2, comite_evaluador: 2, consejo_asistente: 3, consejo: 3, direccion_escuela: 3, gestora_vie: 4, cie: 5, direccion_investigacion: 6, vie_publicacion: 0 } as Record<string, number>)[role ?? ""] ?? 0;
}
