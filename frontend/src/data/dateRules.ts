/** Reglas de fechas del formulario / convocatorias (una sola fuente). */
export const DATE_YEAR_MIN = 2000;
export const DATE_YEAR_MAX = 2100;
/** Tope institucional del plan de acción (meses correlativos). */
export const PLAN_MAX_MONTHS = 36;

export function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function yearOfIso(iso: string): number | null {
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

export function isYearInRange(iso: string): boolean {
  const y = yearOfIso(iso);
  return y != null && y >= DATE_YEAR_MIN && y <= DATE_YEAR_MAX;
}

/** Fin ≥ inicio y años dentro del rango institucional. */
export function isValidProjectDateRange(inicio: string, fin: string): boolean {
  if (!inicio || !fin) return false;
  if (!isYearInRange(inicio) || !isYearInRange(fin)) return false;
  const a = parseIsoDate(inicio);
  const b = parseIsoDate(fin);
  if (!a || !b) return false;
  return b >= a;
}

/**
 * Meses correlativos del proyecto (mes 1 = mes de inicio).
 * Acotado a PLAN_MAX_MONTHS.
 */
export function projectDurationMonths(inicio: string, fin: string): number {
  const a = parseIsoDate(inicio);
  const b = parseIsoDate(fin);
  if (!a || !b || b < a) return 0;
  const months =
    (b.getFullYear() - a.getFullYear()) * 12 +
    (b.getMonth() - a.getMonth()) +
    1;
  return Math.min(PLAN_MAX_MONTHS, Math.max(0, months));
}

/** Una actividad (mes inicio + duración) cabe en el horizonte del proyecto. */
export function activityFitsProject(
  mesInicio: number,
  duracionMeses: number,
  inicio: string,
  fin: string,
): boolean {
  if (!Number.isFinite(mesInicio) || !Number.isFinite(duracionMeses)) {
    return false;
  }
  if (mesInicio < 1 || duracionMeses < 0.01) return false;
  const horizon = projectDurationMonths(inicio, fin);
  if (horizon < 1) return false;
  const endMonth = mesInicio + duracionMeses - 1;
  return endMonth <= horizon + 1e-9;
}

/** Presentación día/mes/año en español de Costa Rica. */
export function formatDateEsCR(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return "";
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
