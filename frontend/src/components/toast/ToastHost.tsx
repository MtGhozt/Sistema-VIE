import { useToast } from "./ToastContext";

export function ToastHost() {
  const { toasts, dismissToast } = useToast();

  // La región live debe existir en el DOM ANTES de que aparezca el contenido:
  // si se monta junto con el toast, la mayoría de lectores de pantalla
  // (NVDA/JAWS) no lo anuncia (WCAG 4.1.3). Por eso el contenedor nunca se
  // desmonta; solo se vacía.
  return (
    <div
      className="toast-stack"
      aria-live="polite"
      aria-relevant="additions"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast${t.tone !== "info" ? ` ${t.tone}` : ""}`}
          role={t.tone === "error" ? "alert" : "status"}
        >
          <span>{t.message}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => dismissToast(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
