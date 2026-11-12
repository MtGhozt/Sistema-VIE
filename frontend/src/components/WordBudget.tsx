import { countWords } from "../data/textLimits";

type Props = {
  value: string;
  unit?: "palabras" | "caracteres";
  maxWords: number;
  /** id del hint para aria-describedby del textarea */
  id?: string;
};

/**
 * Contador de palabras con barra que se rellena al escribir.
 * Al superar el máximo, marca error (no bloquea el teclado aquí).
 */
export function WordBudget({ value, maxWords, id, unit="palabras" }: Props) {
  const words = unit==="caracteres"?value.length:countWords(value);
  const ratio = maxWords > 0 ? Math.min(1, words / maxWords) : 0;
  const over = words > maxWords;
  const pct = Math.round(ratio * 100);

  return (
    <div
      id={id}
      className={`word-budget${over ? " word-budget-over" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`${words} de ${maxWords} ${unit}${over ? ", límite superado" : ""}`}
    >
      <div
        className="word-budget-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={maxWords}
        aria-valuenow={Math.min(words, maxWords)}
        aria-valuetext={`${words} de ${maxWords} ${unit}`}
      >
        <div
          className="word-budget-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="word-budget-label">
        {words} / {maxWords} {unit}
        {over ? " — reduzca el texto" : ` · ${maxWords-words} restantes`}
      </span>
    </div>
  );
}
