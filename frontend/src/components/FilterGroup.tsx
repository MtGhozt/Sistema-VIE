import { useEffect, useState, type ReactNode } from "react";

export function FilterGroup({
  title,
  children,
  active = false,
  onClear,
}: {
  title: string;
  children: ReactNode;
  active?: boolean;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <details
      className={`filter-group${active ? " is-applied" : ""}`}
      open={open}
      onToggle={(e) => {
        setOpen((e.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary>
        {title}
        {active && (
          <span className="badge badge-primary filter-applied">Aplicado</span>
        )}
      </summary>
      <div className="stack-md">
        <div>{children}</div>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={!active}
          onClick={onClear}
        >
          Limpiar {title.toLowerCase()}
        </button>
      </div>
    </details>
  );
}
