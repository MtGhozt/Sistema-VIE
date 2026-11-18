import { useId, useState, type ReactNode } from "react";

export type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

type Props = {
  title?: string;
  children: ReactNode;
  onClear?: () => void;
  clearDisabled?: boolean;
  /** Si true, inicia cerrado. */
  defaultOpen?: boolean;
  /** Chips de filtros activos (quitar uno a uno). */
  chips?: FilterChip[];
};

/** Área de filtros desplegable (activar/desactivar) para páginas con tablas. */
export function FilterPanel({
  title = "Filtros de búsqueda",
  children,
  onClear,
  clearDisabled = true,
  defaultOpen = true,
  chips = [],
}: Props) {
  const [open, setOpen] = useState(defaultOpen || chips.length > 0);
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
      {chips.length > 0 && (
        <div className="filter-chips" role="list" aria-label="Filtros activos">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="filter-chip"
              role="listitem"
              onClick={chip.onRemove}
              aria-label={`Quitar filtro ${chip.label}`}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      {open && (
        <div id={panelId} className="filter-card-body">
          {children}
        </div>
      )}
    </section>
  );
}
