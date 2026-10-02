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
import { NOTIFICACIONES } from "../data/demo";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
};

type NotificationsContextValue = {
  items: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

const STORAGE_PREFIX = "vie-notifications-read:";

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}${userId}`;
}

function readMarkedIds(userId: number): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistMarkedIds(userId: number, ids: Set<string>) {
  localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.userId ?? 0;
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    userId ? readMarkedIds(userId) : new Set(),
  );

  useEffect(() => {
    setReadIds(userId ? readMarkedIds(userId) : new Set());
  }, [userId]);

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

  const markAsRead = useCallback(
    (id: string) => {
      if (!userId) return;
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        persistMarkedIds(userId, next);
        return next;
      });
    },
    [userId],
  );

  const markAllAsRead = useCallback(() => {
    if (!userId) return;
    setReadIds(() => {
      const next = new Set<string>();
      for (const n of NOTIFICACIONES) next.add(n.id);
      persistMarkedIds(userId, next);
      return next;
    });
  }, [userId]);

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
    throw new Error(
      "useNotifications debe usarse dentro de NotificationsProvider",
    );
  }
  return ctx;
}
