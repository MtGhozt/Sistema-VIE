import ianLimits from "../../shared/ian-field-word-limits.json" with { type: "json" };
import { HttpError } from "./middleware/HttpError.js";

/** Topes de palabras del formulario IAN (misma fuente que el frontend). */
const FIELD_WORDS: Record<string, number> = {
  resumen: ianLimits.resumen,
  abstractEn: ianLimits.abstract,
  problema: ianLimits.problema,
  objetivoGeneral: ianLimits.objetivoGeneral,
  estadoArte: ianLimits.estadoArte,
  metodologia: ianLimits.metodologia,
  referencias: ianLimits.referencias,
};

export const OBJETIVO_ESPECIFICO_MAX_WORDS = ianLimits.objetivoEspecifico;
export const RESUMEN_MAX_WORDS = ianLimits.resumen;

function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

/** Topes técnicos del prototipo; resumen/abstract=500 es el tope literal de palabras oficial. */
export function validarTextosPropuesta(body: Record<string, unknown>) {
  for (const [key, max] of Object.entries(FIELD_WORDS)) {
    if (typeof body[key] === "string" && countWords(String(body[key])) > max) {
      throw new HttpError(
        400,
        `${key}: supera el límite del formulario de ${max} palabras.`,
      );
    }
  }
  for (const key of ["hojaRuta", "divulgacion"]) {
    if (typeof body[key] === "string" && String(body[key]).length > 30000) {
      throw new HttpError(
        400,
        `${key}: supera el límite de 30000 caracteres para el conjunto de la sección.`,
      );
    }
  }
}

export function horizonteProyecto(start: string, end: string) {
  const a = Date.parse(start + "T12:00:00Z");
  const b = Date.parse(end + "T12:00:00Z");
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  const fractional = Math.min(
    36,
    Number((((b - a) / 86400000 + 1) / 30).toFixed(2)),
  );
  // Meses enteros del plan (alineado con el formulario): al menos 1 si hay fechas válidas.
  return fractional > 0 ? Math.max(1, Math.ceil(fractional)) : 0;
}
