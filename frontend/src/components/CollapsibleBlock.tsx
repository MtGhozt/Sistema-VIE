import { useId, useState, type ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  /** En solo lectura conviene iniciar colapsado si el texto es largo. */
  defaultOpen?: boolean;
  preview?: string;
};

/** Bloque de texto largo contraíble (resumen, estado del arte, etc.). */
export function CollapsibleBlock({
  title,
  children,
  defaultOpen = true,
  preview,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={`collapsible-block${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="collapsible-block-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {!open && preview && (
        <p className="collapsible-block-preview muted">{preview}</p>
      )}
      {open && (
        <div id={panelId} className="collapsible-block-body">
          {children}
        </div>
      )}
    </div>
  );
}
