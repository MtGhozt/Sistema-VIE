import { readFileSync } from "node:fs";
import { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";

export const seccionesSubsanacion = JSON.parse(readFileSync(new URL("../../shared/subsanacion-secciones.json", import.meta.url), "utf8")) as { codigo: string; etiqueta: string; paso: number; campos: string[] }[];

export async function cargarSubsanacion(id: number, execute: typeof query = query) {
  const r = await execute<{id_subsanacion: number; instancia: string; rol_destino: string; estado_retorno: string; etapa_retorno: number; secciones: string[]; campos_atendidos: string[]; motivo: string}>("SELECT * FROM propuesta_subsanacion WHERE id_propuesta=$1 AND fecha_reenvio IS NULL", [id]);
  return r.rows[0] ?? null;
}

export async function validarEdicionSubsanacion(id: number, body: Record<string, unknown>, execute: typeof query) {
  const correction = await cargarSubsanacion(id, execute);
  if (!correction) throw new HttpError(409, "No existe una devolución activa");
  const allowed = seccionesSubsanacion.filter(s => correction.secciones.includes(s.codigo)).flatMap(s => s.campos);
  // La necesidad de PI queda congelada al enviar, incluso si se corrigen preguntas generales.
  const keys = Object.keys(body);
  if (!keys.length || keys.some(k => !allowed.includes(k))) throw new HttpError(400, "Solo puede modificar las secciones indicadas en la devolución");
  if (Array.isArray(body.preguntasGenerales)) {
    const answers = body.preguntasGenerales.filter(q => Number(q?.numero) === 8);
    const stored = await execute<{requiere_dictamen_pi:boolean}>("SELECT requiere_dictamen_pi FROM propuesta WHERE id_propuesta=$1",[id]);
    if (answers.some(q8 => (q8.respuesta === "Sí") !== stored.rows[0].requiere_dictamen_pi)) throw new HttpError(409,"La necesidad de PI no puede cambiar durante la subsanación");
  }
  await execute("UPDATE propuesta_subsanacion SET campos_atendidos=ARRAY(SELECT DISTINCT unnest(campos_atendidos || $2::text[])) WHERE id_subsanacion=$1", [correction.id_subsanacion, keys]);
}
