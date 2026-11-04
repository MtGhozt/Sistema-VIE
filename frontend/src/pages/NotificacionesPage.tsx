import { IconBell } from "../components/icons";
import { useNotifications } from "../notifications/NotificationsContext";

export function NotificacionesPage() {
  const { items, error, unreadCount, markAsRead, markAllAsRead } = useNotifications();

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
        <p className="sr-only" role="status" aria-live="polite">
          {unreadCount > 0
            ? `${unreadCount} ${unreadCount === 1 ? "notificación sin leer" : "notificaciones sin leer"}`
            : "No hay notificaciones sin leer"}
        </p>
        {error && <p role="alert">{error}</p>}
        {!error && items.length === 0 && <p className="empty-state">No hay notificaciones para esta cuenta.</p>}
        {items.map((n) => (
          <article
            key={n.id}
            className={`notification-row${n.unread ? " unread" : ""}`}
          >
            <div className="notification-symbol" aria-hidden>
              <IconBell size={18} />
            </div>
            <div className="notification-copy">
              {n.unread && <span className="sr-only">Sin leer. </span>}
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
