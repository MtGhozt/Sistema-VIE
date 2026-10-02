import { IconBell } from "../components/icons";
import { useNotifications } from "../notifications/NotificationsContext";

export function NotificacionesPage() {
  const { items, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Bandeja</p>
          <h1>Notificaciones</h1>
          <p>
            Revise cambios de estado, observaciones y tareas asociadas a los
            expedientes.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={unreadCount === 0}
            onClick={() => markAllAsRead()}
          >
            Marcar todas como vistas
          </button>
        </div>
      </header>

      <section className="card notifications-card">
        {items.map((n) => (
          <article
            key={n.id}
            className={`notification-row${n.unread ? " unread" : ""}`}
          >
            <div className="notification-symbol">
              <IconBell size={18} />
            </div>
            <div className="notification-copy">
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              <span>{n.when}</span>
            </div>
            <div className="notification-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!n.unread}
                onClick={() => markAsRead(n.id)}
              >
                {n.unread ? "Marcar como vista" : "Vista"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
