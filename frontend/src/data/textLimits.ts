/**
 * Límites de extensión del formulario oficial VIE
 * (`docs/oficiales-vie/.../4- Formulario Proyecto Investigacion`).
 * Fuente compartida: `shared/ian-field-word-limits.json` (FE + BE).
 */
import ianLimits from "../../../shared/ian-field-word-limits.json";

export const WORDS_PER_PAGE = ianLimits.wordsPerPage;

export const FIELD_WORD_LIMITS = {
  /** Resumen ES — «Máximo 500 palabras». */
  resumen: ianLimits.resumen,
  /** Abstract EN — misma extensión orientativa que el resumen. */
  abstract: ianLimits.abstract,
  /** Problema — «Máximo una página». */
  problema: ianLimits.problema,
  /** Estado del arte — «Máximo dos páginas». */
  estadoArte: ianLimits.estadoArte,
  /** Metodología — sin tope oficial; tope de sección narrativa (1 pág.). */
  metodologia: ianLimits.metodologia,
  /** Objetivo general — párrafo corto. */
  objetivoGeneral: ianLimits.objetivoGeneral,
  /** Cada objetivo específico. */
  objetivoEspecifico: ianLimits.objetivoEspecifico,
  /** Referencias — listado largo permitido. */
  referencias: ianLimits.referencias,
} as const;

export type FieldWordLimitKey = keyof typeof FIELD_WORD_LIMITS;

/** @deprecated Prefer FIELD_WORD_LIMITS.estadoArte */
export const ESTADO_ARTE_MAX_WORDS = FIELD_WORD_LIMITS.estadoArte;

export function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}
