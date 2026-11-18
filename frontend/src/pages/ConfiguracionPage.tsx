import { Link } from "react-router-dom";
import { useContrast } from "../a11y/ContrastContext";
import { useFontSize } from "../a11y/FontSizeContext";
import { useTheme } from "../a11y/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { IconMoon, IconSun } from "../components/icons";

export function ConfiguracionPage() {
  const { session } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { highContrast, setHighContrast } = useContrast();
  const { fontSize, increase, decrease, canIncrease, canDecrease } = useFontSize();

  return (
    <div className="stack-lg configuracion-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Configuración</h1>
          <p>Apariencia y preferencias de la interfaz del prototipo.</p>
        </div>
      </header>

      <section className="card stack-md">
        <h2>Apariencia</h2>

        <div className="config-block">
          <span className="field-label" id="tema-label">
            Tema
          </span>
          <div
            className="theme-segment"
            role="group"
            aria-labelledby="tema-label"
          >
            <button
              type="button"
              className={`theme-segment-btn${!isDark ? " active" : ""}`}
              aria-pressed={!isDark}
              onClick={() => setTheme("light")}
            >
              <IconSun size={18} />
              <span>Claro</span>
            </button>
            <button
              type="button"
              className={`theme-segment-btn${isDark ? " active" : ""}`}
              aria-pressed={isDark}
              onClick={() => setTheme("dark")}
            >
              <IconMoon size={18} />
              <span>Oscuro</span>
            </button>
          </div>
        </div>

        <div className="config-block">
          <span className="field-label" id="contrast-label">
            Alto contraste
          </span>
          <div
            className="theme-segment"
            role="group"
            aria-labelledby="contrast-label"
          >
            <button
              type="button"
              className={`theme-segment-btn${!highContrast ? " active" : ""}`}
              aria-pressed={!highContrast}
              onClick={() => setHighContrast(false)}
            >
              Normal
            </button>
            <button
              type="button"
              className={`theme-segment-btn${highContrast ? " active" : ""}`}
              aria-pressed={highContrast}
              onClick={() => setHighContrast(true)}
            >
              Alto contraste
            </button>
          </div>
        </div>
      </section>

      <section className="card stack-md">
        <h2>Tamaño del texto</h2>
        <p className="field-hint">
          También podés ajustarlo con A⁺ / a⁻ en la esquina inferior derecha.
        </p>
        <div className="settings-font-row config-font-row">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canDecrease}
            onClick={decrease}
            aria-label="Reducir letra"
          >
            a
          </button>
          <span aria-live="polite">{fontSize}px</span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canIncrease}
            onClick={increase}
            aria-label="Ampliar letra"
          >
            A
          </button>
        </div>
      </section>

      {session && (
        <section className="card stack-md">
          <h2>Perfil</h2>
          <p>Datos personales, foto y resumen de actividad.</p>
          <div className="action-row">
            <Link className="btn btn-primary" to="/perfil">
              Ir a mi perfil
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
