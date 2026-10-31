import { HttpError } from "./middleware/HttpError.js";
import type { query } from "./db.js";

// Campos ya definidos en el modelo y en el formulario oficial (sin nuevas secciones).
export const CAMPOS_TEXTO = {
  estadoArte: "estado_arte", hojaRuta: "hoja_ruta", referencias: "referencias", divulgacion: "divulgacion",
} as const;
export async function savePropuestaCampos(id: number, body: Record<string, unknown>, execute: typeof query) {
  const fields: string[] = [], values: unknown[] = [];
  for (const [api, column] of Object.entries(CAMPOS_TEXTO)) {
    if (body[api] !== undefined) { values.push(body[api] == null ? null : String(body[api]).trim()); fields.push(`${column}=$${values.length}`); }
  }
  for (const [api, column] of [["fechaInicio", "fecha_inicio"], ["fechaFin", "fecha_finalizacion"]]) {
    if (body[api] !== undefined) { values.push(body[api] || null); fields.push(`${column}=$${values.length}`); }
  }
  if (body.requiereDictamenPi !== undefined) {
    if (typeof body.requiereDictamenPi !== "boolean") throw new HttpError(400, "requiereDictamenPi debe ser booleano");
    values.push(body.requiereDictamenPi); fields.push(`requiere_dictamen_pi=$${values.length}`);
  }
  if (fields.length) { values.push(id); await execute(`UPDATE propuesta SET ${fields.join(',')} WHERE id_propuesta=$${values.length}`, values); }
  if (body.preguntasGenerales !== undefined) {
    const answers = body.preguntasGenerales;
    if (!Array.isArray(answers)) throw new HttpError(400, "Formato inválido de preguntas generales");
    for (const raw of answers) {
      const n = Number(raw?.numero);
      if (!Number.isInteger(n) || n < 1 || n > 8 || typeof raw?.respuesta !== "string") throw new HttpError(400, "Pregunta general inválida");
      await execute(`INSERT INTO propuesta_pregunta_general(id_propuesta,numero_pregunta,codigo_pregunta,respuesta,detalle)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT(id_propuesta,codigo_pregunta) DO UPDATE SET respuesta=EXCLUDED.respuesta, detalle=EXCLUDED.detalle`,
        [id,n,`q${n}`,raw.respuesta, raw.detalle == null ? null : String(raw.detalle)]);
    }
  }
}
