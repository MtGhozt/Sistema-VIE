import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SESSION_KEY } from "../data/demo";
import { getRole, type RoleId } from "../data/roles";

export type Session = {
  email: string;
  /** Rol con el que se autenticó (admin permanece admin aunque cambie la vista). */
  role: RoleId;
  /** Vista operativa actual (admin puede cambiarla). */
  viewRole: RoleId;
};

type AuthContextValue = {
  session: Session | null;
  login: (email: string, role: RoleId) => void;
  logout: () => void;
  setViewRole: (role: RoleId) => void;
  isAdminSession: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; role?: string };
    if (!parsed.email || !parsed.role) return null;
    const role = getRole(parsed.role).id;
    return { email: parsed.email, role, viewRole: role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const login = useCallback((email: string, role: RoleId) => {
    const next: Session = { email, role, viewRole: role };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, role }));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const setViewRole = useCallback((role: RoleId) => {
    setSession((prev) => (prev ? { ...prev, viewRole: role } : prev));
  }, []);

  const value = useMemo(
    () => ({
      session,
      login,
      logout,
      setViewRole,
      isAdminSession: session?.role === "admin",
    }),
    [session, login, logout, setViewRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
