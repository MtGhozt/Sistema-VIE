import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  HOME_BY_ROLE,
  PENDING_TASKS,
  PRIMARY_CTA,
} from "../data/demo";
import { fetchPropuestas, type Propuesta } from "../api/propuestas";
import {
  ProcessTimeline,
  stepFromPropuestaEstado,
} from "../components/ProcessTimeline";
import { IconChevron } from "../components/icons";
import type { RoleId } from "../data/roles";

const ADMIN_INSTANCE_ACCESS: [string, string, string][] = [
  ["VIE - publicación", "1", "convocatorias activas"],
  ["Investigadores", "5", "propuestas en formulación"],
  ["Vinculación", "4", "dictámenes PI pendientes"],
  ["Comité Técnico", "6", "expedientes por revisar"],
  ["Consejo de Escuela", "2", "avales pendientes"],
  ["Gestora VIE", "5", "expedientes pendientes"],
  ["CIE", "3", "resoluciones pendientes"],
  ["Dirección de Investigación", "2", "notificaciones pendientes"],
];

function labelEstado(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    enviada: "Enviada",
  };
  return map[estado] ?? estado;
}

function instancePath(label: string) {
  if (label.includes("Investig")) return "/propuestas";
  if (label.toLowerCase().includes("publicaci")) return "/convocatorias";
  return "/evaluaciones";
}

function AdminHome({
  home,
  proposals,
}: {
  home: (typeof HOME_BY_ROLE)["admin"];
  proposals: Propuesta[];
}) {
  const navigate = useNavigate();

  const flowLanes = useMemo(() => {
    const count = (pred: (p: Propuesta) => boolean) =>
      proposals.filter(pred).length;
    return [
      ["Vinculación", count((p) => p.etapaFlujo === 1)],
      ["Comité Técnico", count((p) => p.etapaFlujo === 2)],
      ["Consejo de Escuela", count((p) => p.etapaFlujo === 3)],
      ["VIE", count((p) => p.etapaFlujo === 4)],
      ["CIE", count((p) => p.etapaFlujo === 5)],
      ["Notificación", count((p) => p.etapaFlujo === 6)],
      [
        "Cerradas",
        count(
          (p) =>
            p.etapaFlujo >= 7 ||
            ["aprobada", "rechazada"].includes(p.estadoActual.toLowerCase()),
        ),
      ],
    ] as [string, number][];
  }, [proposals]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p>
            Vista transversal para supervisar todas las instancias del flujo. Use
            «Vista actual» en la barra superior para operar cualquier rol sin
            cerrar sesión.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/evaluaciones" className="btn btn-secondary">
            Bandejas por rol
          </Link>
          <Link to="/administracion" className="btn btn-primary">
            Administrar sistema
          </Link>
        </div>
      </header>

      <section className="stats-grid stats-grid-five" aria-label="Indicadores">
        {home.stats.map(([label, value]) => (
          <article key={label} className="card stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </article>
        ))}
      </section>

      <div className="admin-dashboard-grid">
        <article className="card">
          <div className="section-title">
            <div>
              <h2>Flujo institucional en tiempo real</h2>
              <p>Carga de trabajo simulada por instancia.</p>
            </div>
          </div>
          <div className="flow-lanes">
            {flowLanes.map(([name, n], i) => (
              <div key={name} className="flow-lane">
                <span className="flow-index">{i + 1}</span>
                <div>
                  <strong>{name}</strong>
                  <small>
                    {n} expediente{n === 1 ? "" : "s"} en esta etapa
                  </small>
                </div>
                <span className="badge">{n}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-title">
            <div>
              <h2>Acceso a instancias</h2>
              <p>Resumen de tareas disponibles al Super Administrador.</p>
            </div>
          </div>
          <div className="admin-flow-cards">
            {ADMIN_INSTANCE_ACCESS.map(([label, value, meta]) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(instancePath(label))}
              >
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{meta}</small>
                <IconChevron size={16} />
              </button>
            ))}
          </div>
        </article>
      </div>

      <article className="card admin-proposal-table-card">
        <div className="section-title">
          <div>
            <h2>Expedientes activos</h2>
            <p>
              El administrador puede consultar cualquier propuesta y luego cambiar
              a la vista del rol responsable de su etapa.
            </p>
          </div>
        </div>
        <div className="admin-proposal-list">
          {proposals.slice(0, 6).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/propuestas/${p.id}`)}
            >
              <div>
                <strong>
                  {p.codigo} · {p.titulo}
                </strong>
                <span>{p.escuelaNombre}</span>
              </div>
              <span className="badge badge-primary">
                {labelEstado(p.estadoActual)}
              </span>
              <span className="admin-proposal-budget">{p.modalidadLabel}</span>
              <IconChevron size={16} />
            </button>
          ))}
          {proposals.length === 0 && (
            <div className="empty-state small">
              <strong>Sin expedientes cargados</strong>
              <span>Los expedientes aparecerán cuando existan propuestas.</span>
            </div>
          )}
        </div>
      </article>
    </>
  );
}

function InvestigadorHome({
  home,
  proposals,
}: {
  home: (typeof HOME_BY_ROLE)["investigador"];
  proposals: Propuesta[];
}) {
  const recent = proposals.slice(0, 2);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p>{home.description}</p>
        </div>
        <div className="page-actions">
          <Link to="/propuestas/nueva" className="btn btn-primary">
            Crear propuesta
          </Link>
        </div>
      </header>

      <section className="stats-grid stats-grid-five" aria-label="Indicadores">
        {home.stats.map(([label, value]) => (
          <article key={label} className="card stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="section-title">
          <div>
            <h2>Mis propuestas recientes</h2>
            <p>
              Seguimiento de las propuestas asociadas a la persona investigadora
              coordinadora.
            </p>
          </div>
          <Link to="/propuestas" className="btn btn-ghost">
            Ver todas
          </Link>
        </div>

        {recent.length === 0 ? (
          <article className="card empty-state small">
            <strong>Sin propuestas aún</strong>
            <span>Creá un borrador desde el botón superior.</span>
          </article>
        ) : (
          <div className="recent-proposals-list">
            {recent.map((p, i) => (
              <article
                key={p.id}
                className={`card proposal-dashboard-card${i === 0 ? " featured" : ""}`}
              >
                <div className="proposal-dashboard-head">
                  <div>
                    <div className="proposal-dashboard-meta">
                      <span className="badge badge-primary">
                        {labelEstado(p.estadoActual)}
                      </span>
                      <span>{p.escuelaNombre}</span>
                    </div>
                    <h2>{p.titulo}</h2>
                    <span>
                      {p.codigo} · {p.modalidadLabel}
                    </span>
                  </div>
                  <Link
                    to={`/propuestas/${p.id}`}
                    className="btn btn-ghost"
                  >
                    Ver detalles
                  </Link>
                </div>
                {i === 0 && (
                  <div className="compact-process">
                    <span>Estado del proceso</span>
                    <ProcessTimeline
                      currentStep={stepFromPropuestaEstado(
                        p.estadoActual,
                        p.etapaFlujo,
                      )}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function RoleHome({ role }: { role: RoleId }) {
  const navigate = useNavigate();
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

      <div className="dashboard-grid">
        <article className="card">
          <div className="section-title">
            <div>
              <h2>Pendientes prioritarios</h2>
              <p>
                Tareas que requieren atención según la responsabilidad
                institucional actual.
              </p>
            </div>
          </div>
          <div className="task-list">
            {tasks.map(([title, status, meta]) => (
              <button
                key={title}
                type="button"
                className="task-row"
                onClick={() =>
                  navigate(
                    role === "vie_publicacion"
                      ? "/convocatorias"
                      : "/evaluaciones",
                  )
                }
              >
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
            </div>
          </div>
          <button type="button" onClick={() => navigate("/historico")}>
            <span>Consulta histórica</span>
            <IconChevron size={17} />
          </button>
          <button type="button" onClick={() => navigate("/notificaciones")}>
            <span>Centro de notificaciones</span>
            <IconChevron size={17} />
          </button>
          <button type="button" onClick={() => navigate(cta.path)}>
            <span>{cta.label}</span>
            <IconChevron size={17} />
          </button>
        </article>
      </div>
    </>
  );
}

export function InicioPage() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState<Propuesta[]>([]);

  const role = session?.viewRole;
  const needsProposals = role === "investigador" || role === "admin";

  const loadPropuestas = useCallback(async () => {
    if (!needsProposals) {
      setProposals([]);
      return;
    }
    try {
      setProposals(await fetchPropuestas());
    } catch {
      setProposals([]);
    }
  }, [needsProposals]);

  useEffect(() => {
    void loadPropuestas();
  }, [loadPropuestas]);

  if (!session || !role) return null;

  if (role === "admin") {
    return <AdminHome home={HOME_BY_ROLE.admin} proposals={proposals} />;
  }

  if (role === "investigador") {
    return (
      <InvestigadorHome
        home={HOME_BY_ROLE.investigador}
        proposals={proposals}
      />
    );
  }

  return <RoleHome role={role} />;
}
