import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SimpleModal } from "./evaluation/SimpleModal";
import { IconTrash } from "./icons";

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmFn = (request: ConfirmRequest) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((next) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setRequest(next);
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <SimpleModal
        open={Boolean(request)}
        title={request?.title ?? ""}
        onClose={() => close(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => close(false)}
            >
              {request?.cancelLabel ?? "Cancelar"}
            </button>
            <button
              type="button"
              className={`btn ${request?.danger ? "btn-danger" : "btn-primary"}`}
              onClick={() => close(true)}
            >
              {request?.confirmLabel ?? "Confirmar"}
            </button>
          </>
        }
      >
        <p>{request?.message}</p>
      </SimpleModal>
    </ConfirmContext.Provider>
  );
}

export function useAppConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useAppConfirm requiere ConfirmProvider");
  }
  return confirm;
}

/** Botón basurero: pide confirmación en modal de la app antes de quitar. */
export function RemoveIconButton({
  ariaLabel,
  confirmWhat,
  onConfirm,
  className = "",
}: {
  ariaLabel: string;
  confirmWhat: string;
  onConfirm: () => void;
  className?: string;
}) {
  const confirm = useAppConfirm();
  return (
    <button
      type="button"
      className={`btn btn-secondary btn-icon-trash ${className}`.trim()}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={() => {
        void (async () => {
          const ok = await confirm({
            title: "Quitar elemento",
            message: `¿Seguro que querés quitar ${confirmWhat}? Esta acción no se puede deshacer desde aquí.`,
            confirmLabel: "Sí, quitar",
            cancelLabel: "No, conservar",
            danger: true,
          });
          if (ok) onConfirm();
        })();
      }}
    >
      <IconTrash size={20} className="trash-icon" />
    </button>
  );
}
