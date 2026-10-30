import { useContrast } from "../../a11y/ContrastContext";

/**
 * Control de alto contraste exigido por la rúbrica del curso
 * («Uso de Alto Contraste» — el prototipo debe ofrecer el control).
 */
export function ContrastToggle({ compact = false }: { compact?: boolean }) {
  const { highContrast, toggleHighContrast } = useContrast();

  return (
    <button
      type="button"
      className={
        compact
          ? "btn btn-ghost contrast-toggle contrast-toggle-compact"
          : "btn btn-secondary contrast-toggle"
      }
      onClick={toggleHighContrast}
      aria-pressed={highContrast}
      aria-label={
        highContrast
          ? "Desactivar alto contraste"
          : "Activar alto contraste"
      }
      title={
        highContrast
          ? "Desactivar alto contraste"
          : "Activar alto contraste"
      }
    >
      <span aria-hidden="true">{highContrast ? "◐" : "◑"}</span>
      {!compact && (
        <span>{highContrast ? "Alto contraste: activado" : "Alto contraste"}</span>
      )}
      {compact && (
        <span className="sr-only">
          {highContrast ? "Alto contraste activado" : "Alto contraste desactivado"}
        </span>
      )}
    </button>
  );
}
