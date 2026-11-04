import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Props = {
  steps: readonly string[];
  step: number;
  onSelect: (index: number) => void;
};

/** Radio de influencia del cursor (px). Con 17 pasos se mantiene contenido. */
const PROXIMITY_RADIUS = 52;
/** Desplazamiento horizontal máximo del texto (px). */
const MAX_SHIFT = 7;
/** Longitud base / máxima de la raya (px). */
const TICK_BASE = 10;
const TICK_MAX = 22;

function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Navegación de pasos estilo «line sidebar»: raya lateral + leve desplazamiento
 * por proximidad del cursor. Sin librerías; respeta prefers-reduced-motion.
 */
export function WizardLineSteps({ steps, step, onSelect }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [prox, setProx] = useState<number[]>(() => steps.map(() => 0));
  const [reduceMotion, setReduceMotion] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setProx(steps.map(() => 0));
  }, [steps]);

  const updateProximity = useCallback(
    (clientY: number | null) => {
      if (reduceMotion || clientY == null) {
        setProx(steps.map(() => 0));
        return;
      }
      const next = itemRefs.current.map((el) => {
        if (!el) return 0;
        const box = el.getBoundingClientRect();
        const mid = box.top + box.height / 2;
        const dist = Math.abs(clientY - mid);
        if (dist >= PROXIMITY_RADIUS) return 0;
        return easeOut(1 - dist / PROXIMITY_RADIUS);
      });
      setProx(next);
    },
    [reduceMotion, steps],
  );

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (reduceMotion) return;
    cancelAnimationFrame(rafRef.current);
    const y = e.clientY;
    rafRef.current = requestAnimationFrame(() => updateProximity(y));
  }

  function onPointerLeave() {
    cancelAnimationFrame(rafRef.current);
    updateProximity(null);
  }

  useEffect(
    () => () => cancelAnimationFrame(rafRef.current),
    [],
  );

  return (
    <nav
      ref={navRef}
      className="wizard-steps wizard-line-steps"
      aria-label="Pasos del formulario"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {steps.map((label, i) => {
        const p = prox[i] ?? 0;
        const isActive = i === step;
        const isDone = i < step;
        const tick =
          isActive || isDone
            ? TICK_MAX
            : TICK_BASE + p * (TICK_MAX - TICK_BASE);
        const shift = isActive ? MAX_SHIFT * 0.45 : p * MAX_SHIFT;
        const status =
          isActive
            ? "Paso actual"
            : isDone
              ? "Completado"
              : "Sección del formulario";

        return (
          <button
            key={label}
            type="button"
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            aria-current={isActive ? "step" : undefined}
            className={
              isActive ? "active" : isDone ? "done" : undefined
            }
            onClick={() => onSelect(i)}
            style={
              {
                "--wl-shift": `${shift}px`,
                "--wl-tick": `${tick}px`,
              } as CSSProperties
            }
          >
            <span className="wizard-line-tick" aria-hidden="true" />
            <span className="wizard-line-index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="wizard-line-copy">
              <strong>{label}</strong>
              <small>{status}</small>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
