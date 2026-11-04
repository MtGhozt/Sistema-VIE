import { createPortal } from "react-dom";
import { useEffect, useId, useRef, type ReactNode } from "react";

type SimpleModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Puede haber más de un diálogo montado a la vez (por ejemplo, al abrir un
// expediente desde otro). El bloqueo del fondo se cuenta para no reactivar la
// aplicación mientras quede un diálogo abierto.
let openDialogs = 0;
let lockedBackground:
  | { node: HTMLElement; ariaHidden: string | null; inert: boolean }
  | null = null;

function lockBackground() {
  openDialogs += 1;
  if (openDialogs > 1) return;
  const node = document.querySelector<HTMLElement>(".app-shell, .login-page");
  if (!node) return;
  lockedBackground = {
    node,
    ariaHidden: node.getAttribute("aria-hidden"),
    inert: node.hasAttribute("inert"),
  };
  // El portal del modal vive en <body>, fuera de `.app-shell`, así que no
  // queda afectado por `inert`.
  node.setAttribute("inert", "");
  node.setAttribute("aria-hidden", "true");
}

function unlockBackground() {
  openDialogs = Math.max(0, openDialogs - 1);
  if (openDialogs > 0 || !lockedBackground) return;
  const { node, ariaHidden, inert } = lockedBackground;
  if (!inert) node.removeAttribute("inert");
  if (ariaHidden == null) node.removeAttribute("aria-hidden");
  else node.setAttribute("aria-hidden", ariaHidden);
  lockedBackground = null;
}

export function SimpleModal({
  open,
  title,
  description,
  onClose,
  footer,
  bodyClassName,
  children,
}: SimpleModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // `onClose` llega como arrow function inline en los call sites: guardarlo en
  // un ref evita que el efecto se re-ejecute en cada render del padre (eso
  // robaría el foco y devolvería el foco al abrir).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    // Guardamos el elemento que tenía el foco para devolvérselo al cerrar.
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const node = dialogRef.current;
    // Foco inicial: el primer control del cuerpo del diálogo; si no hay
    // ninguno, el propio diálogo (así el lector anuncia su nombre).
    const body = node?.querySelector<HTMLElement>(".modal-body");
    const first = body?.querySelector<HTMLElement>(FOCUSABLE) ?? node;
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      // Trampa de foco (WCAG 2.1.2): el teclado no puede salir del diálogo.
      const dialog = dialogRef.current;
      if (!dialog) return;
      const items = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === firstItem || active === dialog)) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Mientras el diálogo está abierto, el resto de la aplicación queda fuera
    // del árbol accesible y no recibe foco.
    lockBackground();

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      unlockBackground();
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={`modal-body${bodyClassName ? ` ${bodyClassName}` : ""}`}>
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
