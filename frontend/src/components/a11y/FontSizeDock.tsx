import { useFontSize } from "../../a11y/FontSizeContext";

/** A⁺ / a⁻ en esquina inferior derecha, sin caja. */
export function FontSizeDock() {
  const { increase, decrease, canIncrease, canDecrease } = useFontSize();

  return (
    <div className="font-size-dock" role="group" aria-label="Tamaño del texto">
      <button
        type="button"
        className="font-size-dock-btn font-size-dock-up"
        onClick={increase}
        disabled={!canIncrease}
        aria-label="Ampliar letra"
        title="Ampliar letra"
      >
        <span aria-hidden>
          A<sup>+</sup>
        </span>
      </button>
      <button
        type="button"
        className="font-size-dock-btn font-size-dock-down"
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="Reducir letra"
        title="Reducir letra"
      >
        <span aria-hidden>
          a<sup>−</sup>
        </span>
      </button>
    </div>
  );
}
