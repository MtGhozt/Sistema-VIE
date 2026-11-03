import type { query } from "./db.js";

/** El UPSERT bloquea el contador anual hasta el commit. MAX respeta importaciones históricas. */
export async function siguienteCodigo(execute: typeof query, anio: number) {
  const result = await execute<{ultimo: string}>(`
    INSERT INTO propuesta_consecutivo_anual(anio,ultimo)
    SELECT $1::integer, COALESCE(MAX(substring(codigo from 11)::bigint),0)+1
    FROM propuesta WHERE codigo ~ ('^PROP-' || ($1::integer)::text || '-[0-9]+$')
    ON CONFLICT(anio) DO UPDATE SET ultimo=GREATEST(propuesta_consecutivo_anual.ultimo,
      (SELECT COALESCE(MAX(substring(codigo from 11)::bigint),0) FROM propuesta WHERE codigo ~ ('^PROP-' || ($1::integer)::text || '-[0-9]+$')))+1
    RETURNING ultimo`, [anio]);
  return `PROP-${anio}-${result.rows[0].ultimo.padStart(3, "0")}`;
}
