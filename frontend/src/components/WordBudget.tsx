import { countWords } from "../data/textLimits";

type Props = {
  value: string;
  maxWords: number;
  /** id del hint para aria-describedby del textarea */
  id?: string;
};

/**
 * Contador de palabras con barra que se rellena al escribir.
 * Al superar el máximo, marca error (no bloquea el teclado aquí).
 */
export function WordBudget({ value, maxWords, id }: Props) {
  const words = countWords(value);
  const ratio = maxWords > 0 ? Math.min(1, words / maxWords) : 0;
  const over = words > maxWords;
  const pct = Math.round(ratio * 100);

  return (
    <div
      id={id}
      className={`word-budget${over ? " word-budget-over" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`${words} de ${maxWords} palabras${over ? ", límite superado" : ""}`}
    >
      <div
        className="word-budget-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={maxWords}
        aria-valuenow={Math.min(words, maxWords)}
        aria-valuetext={`${words} de ${maxWords} palabras`}
      >
        <div
          className="word-budget-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="word-budget-label">
        {words} / {maxWords} palabras
        {over ? " — reduzca el texto" : ""}
      </span>
    </div>
  );
}
