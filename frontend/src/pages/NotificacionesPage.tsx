import { NOTIFICACIONES } from "../data/demo";
import { IconBell } from "../components/icons";

export function NotificacionesPage() {
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
      </header>

      <section className="card notifications-card">
        {NOTIFICACIONES.map((n) => (
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
              <button type="button" className="btn btn-ghost">
                Marcar
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
