import { useTheme } from "../../a11y/ThemeContext";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className={`btn btn-secondary${compact ? " theme-toggle-compact" : ""}`}
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
      {!compact && (
        <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
      )}
      {compact && <span className="sr-only">{isDark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
