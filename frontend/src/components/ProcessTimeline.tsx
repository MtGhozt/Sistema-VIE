const FLOW_STEPS = [
  "Formulación",
  "Vinculación",
  "Comité Técnico",
  "Consejo de Escuela",
  "VIE",
  "CIE",
  "Resolución",
] as const;

type ProcessTimelineProps = {
  /** 0-based index of the current stage */
  currentStep: number;
  /** If true, current step is completed (e.g. approved end state) */
  completed?: boolean;
  /** When false, Vinculación shows "No requerida" */
  piRequired?: boolean;
};

/**
 * Horizontal process timeline.
 * Markers + connector lines sit on the top row; titles stay below (never struck).
 */
export function ProcessTimeline({
  currentStep,
  completed = false,
  piRequired = true,
}: ProcessTimelineProps) {
  const active = Math.max(0, Math.min(currentStep, FLOW_STEPS.length - 1));

  return (
    // `role="list"` + `aria-label`: un div genérico ignora el nombre accesible.
    <ol
      className="timeline process-timeline"
      role="list"
      aria-label="Etapas del flujo"
    >
      {FLOW_STEPS.map((label, i) => {
        const done = completed ? i <= active : i < active;
        const isActive = !completed && i === active;
        const skipPi = label === "Vinculación" && !piRequired;
        return (
          <li
            key={label}
            className={`timeline-step${done ? " done" : ""}${isActive ? " active" : ""}`}
          >
            <div className="timeline-marker" aria-hidden>
              {done ? "✓" : i + 1}
            </div>
            {i < FLOW_STEPS.length - 1 && <div className="timeline-line" aria-hidden />}
            <div className="timeline-copy">
              <strong>{label}</strong>
              <span>
                {skipPi
                  ? "No requerida"
                  : done
                    ? "Completada"
                    : isActive
                      ? "Etapa actual"
                      : "Pendiente"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function stepFromPropuestaEstado(
  estadoActual: string,
  etapaFlujo: number,
): number {
  if (estadoActual === "borrador") return 0;
  if (estadoActual === "enviada") return Math.max(1, etapaFlujo);
  if (etapaFlujo > 0) return Math.min(etapaFlujo, FLOW_STEPS.length - 1);
  return 0;
}

export { FLOW_STEPS };
