import { useAuth } from "../auth/AuthContext";
import { HOME_BY_ROLE, PENDING_TASKS } from "../data/demo";
import { IconChevron } from "../components/icons";

export function EvaluacionesPage() {
  const { session } = useAuth();
  if (!session) return null;
  const role = session.viewRole;
  const home = HOME_BY_ROLE[role];
  const tasks = PENDING_TASKS[role] ?? [];

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p>{home.description}</p>
        </div>
      </header>

      <section className="card">
        <div className="section-title">
          <div>
            <h2>Bandeja del rol</h2>
            <p>
              Pantalla por rol (CU4). El detalle de rúbricas y oficios se porta
              del prototipo HTML de referencia en docs.
            </p>
          </div>
        </div>
        <div className="task-list">
          {tasks.map(([title, status, meta]) => (
            <button key={title + status} type="button" className="task-row">
              <div>
                <strong>{title}</strong>
                <span>{meta}</span>
              </div>
              <div className="task-row-end">
                <span className="badge badge-primary">{status}</span>
                <IconChevron size={16} />
              </div>
            </button>
          ))}
          {tasks.length === 0 && (
            <div className="empty-state small">
              <strong>Sin pendientes en esta vista</strong>
              <span>Cambiá el rol o la vista de administrador.</span>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
