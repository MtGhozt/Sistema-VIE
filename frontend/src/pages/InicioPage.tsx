import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  HOME_BY_ROLE,
  PENDING_TASKS,
  PRIMARY_CTA,
} from "../data/demo";
import { IconChevron } from "../components/icons";

export function InicioPage() {
  const { session, isAdminSession } = useAuth();
  if (!session) return null;

  const role = isAdminSession ? session.viewRole : session.viewRole;
  const home = HOME_BY_ROLE[role];
  const cta = PRIMARY_CTA[role];
  const tasks = PENDING_TASKS[role] ?? [];
  const five = home.stats.length >= 5;

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p>{home.description}</p>
        </div>
        <div className="page-actions">
          <Link to={cta.path} className="btn btn-primary">
            {cta.label}
          </Link>
        </div>
      </header>

      <section
        className={`stats-grid${five ? " stats-grid-five" : ""}`}
        aria-label="Indicadores"
      >
        {home.stats.map(([label, value]) => (
          <article key={label} className="card stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-section">
        <article className="card">
          <div className="section-title">
            <div>
              <h2>Pendientes prioritarios</h2>
              <p>Tareas que requieren atención según la responsabilidad actual.</p>
            </div>
          </div>
          <div className="task-list">
            {tasks.map(([title, status, meta]) => (
              <button key={title} type="button" className="task-row">
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
          </div>
        </article>

        <article className="card quick-panel">
          <div className="section-title">
            <div>
              <h2>Accesos rápidos</h2>
              <p>Atajos del rol activo.</p>
            </div>
          </div>
          <Link to={cta.path}>
            {cta.label} <IconChevron size={16} />
          </Link>
          <Link to="/historico">
            Consultar histórico <IconChevron size={16} />
          </Link>
          <Link to="/notificaciones">
            Ver notificaciones <IconChevron size={16} />
          </Link>
        </article>
      </section>
    </>
  );
}
