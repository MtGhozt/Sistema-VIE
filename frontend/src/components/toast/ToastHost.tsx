import { useToast } from "./ToastContext";

export function ToastHost() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-relevant="additions">
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
