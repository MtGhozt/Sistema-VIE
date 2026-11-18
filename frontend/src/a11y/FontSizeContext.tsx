import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "vie.fontSize";
export const FONT_MIN = 14;
export const FONT_MAX = 24;
export const FONT_STEP = 2;
export const FONT_DEFAULT = 16;

type FontSizeContextValue = {
  fontSize: number;
  increase: () => void;
  decrease: () => void;
  setFontSize: (value: number) => void;
  canIncrease: boolean;
  canDecrease: boolean;
};

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

function clamp(value: number) {
  return Math.min(FONT_MAX, Math.max(FONT_MIN, value));
}

function readStored() {
  try {
    const raw = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(raw) ? clamp(raw) : FONT_DEFAULT;
  } catch {
    return FONT_DEFAULT;
  }
}

function applyDom(size: number) {
  const root = document.documentElement;
  root.style.setProperty("--app-font-size", `${size}px`);
  root.style.setProperty("--proposal-reading-size", `${size}px`);
  root.style.fontSize = `${size}px`;
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState(() => {
    const initial = readStored();
    applyDom(initial);
    return initial;
  });

  useEffect(() => {
    applyDom(fontSize);
    try {
      localStorage.setItem(STORAGE_KEY, String(fontSize));
    } catch {
      /* ignore */
    }
  }, [fontSize]);

  const setFontSize = useCallback((value: number) => {
    setFontSizeState(clamp(value));
  }, []);

  const increase = useCallback(() => {
    setFontSizeState((v) => clamp(v + FONT_STEP));
  }, []);

  const decrease = useCallback(() => {
    setFontSizeState((v) => clamp(v - FONT_STEP));
  }, []);

  const value = useMemo(
    () => ({
      fontSize,
      increase,
      decrease,
      setFontSize,
      canIncrease: fontSize < FONT_MAX,
      canDecrease: fontSize > FONT_MIN,
    }),
    [fontSize, increase, decrease, setFontSize],
  );

  return (
    <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize debe usarse dentro de FontSizeProvider");
  return ctx;
}
