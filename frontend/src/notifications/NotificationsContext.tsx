import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthContext";
import { apiJson } from "../api/client";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
};

type NotificationsContextValue = {
  items: NotificationItem[];
  error: string | null;
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

const EMPTY_ITEMS: NotificationItem[] = [];

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.userId ?? 0;
  const [data, setData] = useState<{ userId: number; items: NotificationItem[]; error: string | null }>({ userId: 0, items: [], error: null });
  const items = data.userId === userId ? data.items : EMPTY_ITEMS;
  const error = data.userId === userId ? data.error : null;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const rows = await apiJson<NotificationItem[]>("/api/notificaciones");
        if (active) setData({ userId, items: rows.map(n => ({ ...n, when: new Date(n.when).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" }) })), error: null });
      } catch (err) {
        if (active) setData(prev => ({ userId, items: prev.userId === userId ? prev.items : [], error: err instanceof Error ? err.message : "No se pudieron consultar avisos" }));
      } finally { pending = false; }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [userId]);

  const mark = useCallback(async (id?: string) => {
    if (!userId) return;
    try {
      await apiJson(id ? `/api/notificaciones/${encodeURIComponent(id)}/leida` : "/api/notificaciones/leidas", { method: "PATCH" });
      setData(prev => prev.userId !== userId ? prev : ({ ...prev, error: null, items: prev.items.map(n => !id || n.id === id ? { ...n, unread: false } : n) }));
    } catch (err) {
      setData(prev => prev.userId !== userId ? prev : ({ ...prev, error: err instanceof Error ? err.message : "No se pudo guardar la lectura" }));
    }
  }, [userId]);
  const markAsRead = useCallback((id: string) => { void mark(id); }, [mark]);
  const markAllAsRead = useCallback(() => { void mark(); }, [mark]);
  const value = useMemo(() => ({ items, error, unreadCount: items.filter(n => n.unread).length, markAsRead, markAllAsRead }), [items, error, markAsRead, markAllAsRead]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications debe usarse dentro de NotificationsProvider",
    );
  }
  return ctx;
}
