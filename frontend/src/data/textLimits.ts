/**
 * Límites de extensión del formulario oficial VIE
 * (`docs/oficiales-vie/.../4- Formulario Proyecto Investigacion`).
 * Una sola fuente: UI, validación y mensajes leen de aquí.
 */
export const WORDS_PER_PAGE = 500;

export const FIELD_WORD_LIMITS = {
  /** Resumen ES — «Máximo 500 palabras». */
  resumen: 500,
  /** Abstract EN — misma extensión orientativa que el resumen. */
  abstract: 500,
  /** Problema — «Máximo una página». */
  problema: WORDS_PER_PAGE,
  /** Estado del arte — «Máximo dos páginas». */
  estadoArte: WORDS_PER_PAGE * 2,
  /** Metodología — sin tope oficial; tope de sección narrativa (1 pág.). */
  metodologia: WORDS_PER_PAGE,
  /** Objetivo general — párrafo corto. */
  objetivoGeneral: 200,
  /** Cada objetivo específico. */
  objetivoEspecifico: 120,
  /** Referencias — listado largo permitido. */
  referencias: WORDS_PER_PAGE * 2,
} as const;

export type FieldWordLimitKey = keyof typeof FIELD_WORD_LIMITS;

/** @deprecated Prefer FIELD_WORD_LIMITS.estadoArte */
export const ESTADO_ARTE_MAX_WORDS = FIELD_WORD_LIMITS.estadoArte;

export function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}
