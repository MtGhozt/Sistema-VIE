import {
  getFormStepStatus,
  type FormWizardState,
} from "./formWizardIan";

/**
 * ¿Se puede ir al paso `target`?
 * - Hacia atrás o al actual: siempre.
 * - Hacia adelante: todos los pasos previos (0..target-1) deben estar Completa
 *   (15 y 16 no bloquean avance desde el botón Siguiente; igual no se salta
 *   a ellos sin completar 0–14).
 */
export function canNavigateToStep(
  target: number,
  current: number,
  form: FormWizardState,
  hasConvocatoria: boolean,
  opts?: { freeNavigate?: boolean },
): boolean {
  if (opts?.freeNavigate) return true;
  if (target <= current) return true;
  if (target < 0) return false;
  for (let s = 0; s < target; s++) {
    if (s >= 15) continue;
    if (getFormStepStatus(s, form, hasConvocatoria) !== "Completa") {
      return false;
    }
  }
  return true;
}
