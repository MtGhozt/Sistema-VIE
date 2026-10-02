import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../notifications/NotificationsContext";
import { IconBell } from "../icons";

const RECENT_LIMIT = 4;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { items, unreadCount, markAsRead } = useNotifications();
  const recent = items.slice(0, RECENT_LIMIT);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="notif-bell" ref={rootRef}>
      <button
        type="button"
        className="topbar-icon"
        aria-label={
          unreadCount > 0
            ? `Notificaciones (${unreadCount} sin leer)`
            : "Notificaciones"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell size={18} />
        {unreadCount > 0 && <span className="notification-dot" aria-hidden />}
      </button>

      {open && (
        <div
          className="notif-popover"
          role="menu"
          aria-label="Notificaciones recientes"
        >
          <div className="notif-popover-head">
            <strong>Notificaciones</strong>
            {unreadCount > 0 && (
              <span className="badge badge-primary">{unreadCount} nuevas</span>
            )}
          </div>
          <ul className="notif-popover-list">
            {recent.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notif-popover-item${n.unread ? " unread" : ""}`}
                  role="menuitem"
                  onClick={() => {
                    markAsRead(n.id);
                  }}
                >
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <span>{n.when}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="notif-popover-foot">
            <Link to="/notificaciones" onClick={() => setOpen(false)}>
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
