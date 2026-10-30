import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "vie.a11y.highContrast";

type ContrastContextValue = {
  highContrast: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (value: boolean) => void;
};

const ContrastContext = createContext<ContrastContextValue | null>(null);

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function applyDom(high: boolean) {
  const root = document.documentElement;
  if (high) root.setAttribute("data-contrast", "high");
  else root.removeAttribute("data-contrast");
}

export function ContrastProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrastState] = useState(() => {
    const initial = readStored();
    applyDom(initial);
    return initial;
  });

  useEffect(() => {
    applyDom(highContrast);
    try {
      localStorage.setItem(STORAGE_KEY, highContrast ? "1" : "0");
    } catch {
      /* ignore quota / private mode */
    }
  }, [highContrast]);

  const setHighContrast = useCallback((value: boolean) => {
    setHighContrastState(value);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState((v) => !v);
  }, []);

  const value = useMemo(
    () => ({ highContrast, toggleHighContrast, setHighContrast }),
    [highContrast, toggleHighContrast, setHighContrast],
  );

  return (
    <ContrastContext.Provider value={value}>{children}</ContrastContext.Provider>
  );
}

export function useContrast() {
  const ctx = useContext(ContrastContext);
  if (!ctx) {
    throw new Error("useContrast debe usarse dentro de ContrastProvider");
  }
  return ctx;
}
