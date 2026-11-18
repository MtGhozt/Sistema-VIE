import { countWords } from "../data/textLimits";

type Props = {
  value: string;
  unit?: "palabras" | "caracteres";
  maxWords: number;
  /** id del hint para aria-describedby del textarea */
  id?: string;
};

/**
 * Contador N / máx en la esquina del campo (sin barra).
 * Solo marca error visual si supera el máximo.
 */
export function WordBudget({ value, maxWords, id, unit = "palabras" }: Props) {
  const words = unit === "caracteres" ? value.length : countWords(value);
  const over = words > maxWords;

  return (
    <div
      id={id}
      className={`word-budget${over ? " word-budget-over" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`${words} de ${maxWords} ${unit}${over ? ", límite superado" : ""}`}
    >
      <span className="word-budget-label">
        {words} / {maxWords}
      </span>
    </div>
  );
}
