import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NOTIFICACIONES } from "../data/demo";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
};

const STORAGE_KEY = "vie-notifications-read";

type NotificationsContextValue = {
  items: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

function readMarkedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistMarkedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [readIds, setReadIds] = useState<Set<string>>(() => readMarkedIds());

  const items = useMemo<NotificationItem[]>(
    () =>
      NOTIFICACIONES.map((n) => ({
        ...n,
        unread: n.unread && !readIds.has(n.id),
      })),
    [readIds],
  );

  const unreadCount = useMemo(
    () => items.filter((n) => n.unread).length,
    [items],
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistMarkedIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of NOTIFICACIONES) next.add(n.id);
      persistMarkedIds(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ items, unreadCount, markAsRead, markAllAsRead }),
    [items, unreadCount, markAsRead, markAllAsRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  }
  return ctx;
}
