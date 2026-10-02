import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { postDemoLogin } from "../api/demoAuth";
import { setDemoAuth } from "../api/client";
import { SESSION_KEY } from "../data/demo";
import { getRole, isRoleId, type RoleId } from "../data/roles";

export type Session = {
  userId: number;
  email: string;
  name: string;
  roleName: string;
  /** Rol autenticado en la API demo. */
  role: RoleId;
  /** Vista operativa (admin puede cambiarla). */
  viewRole: RoleId;
};

type StoredSession = {
  userId: number;
  email: string;
  name: string;
  roleName: string;
  role: string;
  viewRole?: string;
};

type AuthContextValue = {
  session: Session | null;
  loginWithRole: (roleCode: RoleId) => Promise<void>;
  logout: () => void;
  setViewRole: (role: RoleId) => void;
  isAdminSession: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (
      !parsed.email ||
      !parsed.role ||
      typeof parsed.userId !== "number" ||
      !parsed.name
    ) {
      return null;
    }
    if (!isRoleId(parsed.role)) return null;
    const viewRole =
      parsed.viewRole && isRoleId(parsed.viewRole)
        ? parsed.viewRole
        : parsed.role;
    return {
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name,
      roleName: parsed.roleName ?? getRole(parsed.role).label,
      role: parsed.role,
      viewRole,
    };
  } catch {
    return null;
  }
}

function persistSession(session: Session) {
  const payload: StoredSession = {
    userId: session.userId,
    email: session.email,
    name: session.name,
    roleName: session.roleName,
    role: session.role,
    viewRole: session.viewRole,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

function syncDemoAuth(session: Session | null) {
  if (!session) {
    setDemoAuth(null);
    return;
  }
  setDemoAuth({ userId: session.userId, role: session.role });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const initial = readSession();
    syncDemoAuth(initial);
    return initial;
  });

  const loginWithRole = useCallback(async (roleCode: RoleId) => {
    const data = await postDemoLogin(roleCode);
    if (!isRoleId(data.user.roleCode)) {
      throw new Error("Rol devuelto por la API no es válido en el frontend");
    }
    const role = data.user.roleCode;
    const next: Session = {
      userId: data.user.id,
      email: data.user.email,
      name: data.user.name,
      roleName: data.user.roleName,
      role,
      viewRole: role,
    };
    persistSession(next);
    syncDemoAuth(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    syncDemoAuth(null);
    setSession(null);
  }, []);

  const setViewRole = useCallback((role: RoleId) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, viewRole: role };
      persistSession(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      session,
      loginWithRole,
      logout,
      setViewRole,
      isAdminSession: session?.role === "admin",
    }),
    [session, loginWithRole, logout, setViewRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
