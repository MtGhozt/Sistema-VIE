import seccionesSubsanacion from "../../../../shared/subsanacion-secciones.json";
import type { EvalActionHandler } from "./evalTypes";

export type ActionHandler = EvalActionHandler;

export function SeccionesDevueltas({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset className="subsanacion-secciones">
      <legend>Secciones que debe corregir</legend>
      {seccionesSubsanacion.map((s) => (
        <label className="subsanacion-seccion" key={s.codigo}>
          <input
            type="checkbox"
            checked={value.includes(s.codigo)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, s.codigo]
                  : value.filter((v) => v !== s.codigo),
              )
            }
          />
          {s.etiqueta}
        </label>
      ))}
    </fieldset>
  );
}

export function PanelIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="section-title" style={{ marginBottom: 16 }}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function CheckIcon() {
  // Decorativo: el estado ya lo anuncia el texto "Verificado" / "Falta verificar".
  return (
    <span className="custom-check" aria-hidden="true">
      ✓
    </span>
  );
}
