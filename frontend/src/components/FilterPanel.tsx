import { useId, useState, type ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  onClear?: () => void;
  clearDisabled?: boolean;
  /** Si true, inicia cerrado. */
  defaultOpen?: boolean;
};

/** Área de filtros desplegable (activar/desactivar) para páginas con tablas. */
export function FilterPanel({
  title = "Filtros de búsqueda",
  children,
  onClear,
  clearDisabled = true,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="card filter-card" style={{ marginBottom: 18 }}>
      <div className="filter-card-title">
        <button
          type="button"
          className="btn btn-ghost filter-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <strong>{title}</strong>
          <span className="filter-toggle-hint">
            {open ? "Ocultar" : "Mostrar"}
          </span>
        </button>
        {onClear && (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={clearDisabled || !open}
            onClick={onClear}
          >
            Limpiar
          </button>
        )}
      </div>
      {open && (
        <div id={panelId} className="filter-card-body">
          {children}
        </div>
      )}
    </section>
  );
}
