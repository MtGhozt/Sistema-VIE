import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { HOME_BY_ROLE, PRIMARY_CTA } from "../data/demo";
import { labelEstado } from "../data/proposalStates";
import { fetchPropuestas, type Propuesta } from "../api/propuestas";
import {
  fetchConvocatorias,
  type Convocatoria,
} from "../api/convocatorias";
import {
  fetchEvaluacionBandeja,
  type EvaluacionBandejaItem,
} from "../api/evaluaciones";
import {
  ProcessTimeline,
  stepFromPropuestaEstado,
} from "../components/ProcessTimeline";
import { IconChevron } from "../components/icons";
import type { RoleId } from "../data/roles";

const EVAL_ROLES: RoleId[] = [
  "vinculacion",
  "comite_asistente",
  "comite_evaluador",
  "consejo_asistente",
  "consejo",
  "direccion_escuela",
  "gestora_vie",
  "cie",
  "direccion_investigacion",
];

function normEstado(estado: string) {
  return estado.toLowerCase();
}

function isPropuestaActiva(p: Propuesta) {
  const e = normEstado(p.estadoActual);
  return e !== "aprobada" && e !== "rechazada";
}

function formatCierreMeta(fechaCierre: string) {
  const d = fechaCierre.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return `Cierre ${fechaCierre}`;
  return `Cierre ${day}/${m}/${y}`;
}

function labelConvocatoriaEstado(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    activa: "Publicada",
    cerrada: "Cerrada",
    finalizada: "Finalizada",
  };
  return map[estado] ?? estado;
}

function isProximaCierre(c: Convocatoria, today = new Date()) {
  if (c.estado !== "activa") return false;
  const cierre = new Date(c.fechaCierre.slice(0, 10));
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const limit = new Date(start);
  limit.setDate(limit.getDate() + 30);
  cierre.setHours(0, 0, 0, 0);
  return cierre >= start && cierre <= limit;
}

function instancePath(label: string) {
  if (label.includes("Investig")) return "/propuestas";
  if (label.toLowerCase().includes("publicaci")) return "/convocatorias";
  return "/evaluaciones";
}

function adminInstanceAccess(
  proposals: Propuesta[],
  convocatorias: Convocatoria[],
): [string, string, string][] {
  const etapa = (n: number) =>
    String(proposals.filter((p) => p.etapaFlujo === n).length);
  const borradores = String(
    proposals.filter((p) => normEstado(p.estadoActual) === "borrador").length,
  );
  const activas = String(
    convocatorias.filter((c) => c.estado === "activa").length,
  );
  return [
    ["VIE - publicación", activas, "convocatorias activas"],
    ["Investigadores", borradores, "propuestas en formulación"],
    ["Vinculación", etapa(1), "dictámenes PI pendientes"],
    ["Comité Técnico", etapa(2), "expedientes por revisar"],
    ["Consejo de Escuela", etapa(3), "avales pendientes"],
    ["Gestora VIE", etapa(4), "expedientes pendientes"],
    ["CIE", etapa(5), "resoluciones pendientes"],
    ["Dirección de Investigación", etapa(6), "notificaciones pendientes"],
  ];
}

function adminStatValue(
  label: string,
  proposals: Propuesta[],
  convocatorias: Convocatoria[],
): number {
  const l = label.toLowerCase();
  if (l.includes("propuesta") && l.includes("activ")) {
    return proposals.filter(isPropuestaActiva).length;
  }
  if (l.includes("convocatoria")) return convocatorias.length;
  if (l.includes("resolucion")) {
    return proposals.filter((p) => normEstado(p.estadoActual) === "aprobada")
      .length;
  }
  if (l.includes("accion") && l.includes("pendiente")) {
    return proposals.filter((p) => {
      const e = normEstado(p.estadoActual);
      return e !== "borrador" && e !== "aprobada" && e !== "rechazada";
    }).length;
  }
  return 0;
}

function adminStatPath(label: string) {
  const l = label.toLowerCase();
  if (l.includes("propuesta")) return "/propuestas";
  if (l.includes("convocatoria")) return "/convocatorias";
  return "/evaluaciones";
}

function investigadorStatValue(label: string, proposals: Propuesta[]): number {
  const l = label.toLowerCase();
  if (l.includes("borrador")) {
    return proposals.filter((p) => normEstado(p.estadoActual) === "borrador")
      .length;
  }
  if (l.includes("corrección") || l.includes("correccion")) {
    return proposals.filter((p) => {
      const e = normEstado(p.estadoActual);
      return e === "en_subsanacion" || e.includes("correccion");
    }).length;
  }
  if (l.includes("aprobada")) {
    return proposals.filter((p) => normEstado(p.estadoActual) === "aprobada")
      .length;
  }
  if (l.includes("rechazada")) {
    return proposals.filter((p) => normEstado(p.estadoActual) === "rechazada")
      .length;
  }
  if (l.includes("revisión") || l.includes("revision")) {
    return proposals.filter((p) => {
      const e = normEstado(p.estadoActual);
      if (e === "borrador" || e === "aprobada" || e === "rechazada") {
        return false;
      }
      if (e === "en_subsanacion" || e.includes("correccion")) return false;
      return true;
    }).length;
  }
  return 0;
}

function investigadorStatPath(label: string) {
  const l = label.toLowerCase();
  if (l.includes("borrador")) {
    return `/propuestas?estado=${encodeURIComponent(labelEstado("borrador"))}`;
  }
  if (l.includes("corrección") || l.includes("correccion")) {
    return `/propuestas?estado=${encodeURIComponent(labelEstado("en_subsanacion"))}`;
  }
  if (l.includes("aprobada")) {
    return `/propuestas?estado=${encodeURIComponent(labelEstado("aprobada"))}`;
  }
  if (l.includes("rechazada")) {
    return `/propuestas?estado=${encodeURIComponent(labelEstado("rechazada"))}`;
  }
  return "/propuestas";
}

function convocatoriaStatValue(label: string, convocatorias: Convocatoria[]) {
  const l = label.toLowerCase();
  if (l.includes("activa")) {
    return convocatorias.filter((c) => c.estado === "activa").length;
  }
  if (l.includes("borrador")) {
    return convocatorias.filter((c) => c.estado === "borrador").length;
  }
  if (l.includes("próxima") || l.includes("proxima")) {
    return convocatorias.filter((c) => isProximaCierre(c)).length;
  }
  if (l.includes("finaliz")) {
    return convocatorias.filter(
      (c) => c.estado === "cerrada" || c.estado === "finalizada",
    ).length;
  }
  return 0;
}

function convocatoriaStatPath(label: string) {
  const l = label.toLowerCase();
  if (l.includes("activa")) return "/convocatorias?estado=activa";
  if (l.includes("borrador")) return "/convocatorias?estado=borrador";
  if (l.includes("próxima") || l.includes("proxima")) {
    return "/convocatorias?estado=proximas";
  }
  if (l.includes("finaliz")) return "/convocatorias?estado=cerrada";
  return "/convocatorias";
}

function evalRoleStatValue(label: string, items: EvaluacionBandejaItem[]) {
  const l = label.toLowerCase();
  const total = items.length;
  // En bandeja = total de expedientes visibles para el rol
  if (l.includes("bandeja") || l.includes("total") || l.includes("recibid")) {
    return total;
  }
  // Recién enviadas = llegaron al flujo pero aún no están en evaluación activa
  if (l.includes("enviad") || l.includes("recién") || l.includes("recien")) {
    return items.filter((i) => normEstado(i.estadoActual) === "enviada").length;
  }
  // En evaluación = el comité/instancia ya las está trabajando
  if (
    l.includes("en evaluación") ||
    l.includes("en evaluacion") ||
    l.includes("progreso")
  ) {
    return items.filter((i) => normEstado(i.estadoActual) === "en_evaluacion")
      .length;
  }
  // Ya dictaminadas = el comité emitió resultado (pasan a consejo/consolidación)
  if (l.includes("dictamin") || l.includes("consolida") || l.includes("complet")) {
    return items.filter((i) =>
      ["dictaminada", "avalada"].includes(normEstado(i.estadoActual)),
    ).length;
  }
  if (l.includes("pendiente")) return total;
  if (
    l.includes("faltante") ||
    l.includes("devuelt") ||
    l.includes("corrección") ||
    l.includes("correccion")
  ) {
    return items.filter((i) => normEstado(i.estadoActual) === "en_subsanacion")
      .length;
  }
  return 0;
}

function AdminHome({
  home,
  proposals,
  convocatorias,
}: {
  home: (typeof HOME_BY_ROLE)["admin"];
  proposals: Propuesta[];
  convocatorias: Convocatoria[];
}) {
  const navigate = useNavigate();
  const instanceRows = useMemo(
    () => adminInstanceAccess(proposals, convocatorias),
    [proposals, convocatorias],
  );

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
            ["aprobada", "rechazada"].includes(normEstado(p.estadoActual)),
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
        {home.stats.map(([label]) => (
          <button
            key={label}
            type="button"
            className="card stat-card"
            onClick={() => navigate(adminStatPath(label))}
          >
            <div className="stat-value">
              {adminStatValue(label, proposals, convocatorias)}
            </div>
            <div className="stat-label">{label}</div>
          </button>
        ))}
      </section>

      <div className="admin-dashboard-grid">
        <article className="card">
          <div className="section-title">
            <div>
              <h2>Distribución de expedientes por etapa</h2>
              <p>Carga de trabajo según la etapa institucional del flujo.</p>
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
              <p>Accesos rápidos con carga actual por instancia.</p>
            </div>
          </div>
          <div className="admin-flow-cards">
            {instanceRows.map(([label, value, meta]) => (
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
          {proposals.filter(isPropuestaActiva).slice(0, 6).map((p) => (
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
          {proposals.filter(isPropuestaActiva).length === 0 && (
            <div className="empty-state small">
              <strong>Sin expedientes activos</strong>
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
  const navigate = useNavigate();
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
        {home.stats.map(([label]) => (
          <button
            key={label}
            type="button"
            className="card stat-card"
            onClick={() => navigate(investigadorStatPath(label))}
          >
            <div className="stat-value">
              {investigadorStatValue(label, proposals)}
            </div>
            <div className="stat-label">{label}</div>
          </button>
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

function RoleHome({
  role,
  convocatorias,
  sessionRole,
}: {
  role: RoleId;
  convocatorias: Convocatoria[];
  sessionRole: RoleId;
}) {
  const navigate = useNavigate();
  const home = HOME_BY_ROLE[role];
  const cta = PRIMARY_CTA[role];
  const five = home.stats.length >= 5;
  const [bandejaItems, setBandejaItems] = useState<EvaluacionBandejaItem[]>(
    [],
  );

  const isViePublicacion = role === "vie_publicacion";
  const isEvalRole = EVAL_ROLES.includes(role);

  useEffect(() => {
    if (!isEvalRole) {
      setBandejaItems([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const view =
          sessionRole === "admin" && isEvalRole ? role : undefined;
        const res = await fetchEvaluacionBandeja(view);
        if (!cancelled) setBandejaItems(res.items);
      } catch {
        if (!cancelled) setBandejaItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEvalRole, role, sessionRole]);

  const statEntries = useMemo(() => {
    return home.stats.map(([label]) => {
      let value = 0;
      if (isViePublicacion) {
        value = convocatoriaStatValue(label, convocatorias);
      } else if (isEvalRole) {
        value = evalRoleStatValue(label, bandejaItems);
      }
      return { label, value };
    });
  }, [home.stats, isViePublicacion, isEvalRole, convocatorias, bandejaItems]);

  const vieTasks = useMemo(() => {
    if (!isViePublicacion) return [];
    return [...convocatorias]
      .sort((a, b) => a.fechaCierre.localeCompare(b.fechaCierre))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        title: c.nombre,
        status: labelConvocatoriaEstado(c.estado),
        meta: formatCierreMeta(c.fechaCierre),
        path: convocatoriaStatPath(
          c.estado === "borrador"
            ? "Borradores"
            : c.estado === "activa"
              ? "Convocatorias activas"
              : "Finalizadas",
        ),
      }));
  }, [convocatorias, isViePublicacion]);

  /** Pendientes reales desde bandeja API (sin lista demo alambrada). */
  const pendingTasks = useMemo(() => {
    if (isViePublicacion || !isEvalRole) return [];
    return [...bandejaItems]
      .sort((a, b) => {
        const fa = a.fechaEnvio ?? "";
        const fb = b.fechaEnvio ?? "";
        return fb.localeCompare(fa);
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.titulo,
        status: item.estadoLabel || labelEstado(item.estadoActual),
        meta: `${item.codigo} · ${item.escuela}`,
        path: `/evaluaciones?propuesta=${item.id}`,
      }));
  }, [isViePublicacion, isEvalRole, bandejaItems]);

  function statNavigate(label: string) {
    if (isViePublicacion) {
      navigate(convocatoriaStatPath(label));
      return;
    }
    navigate("/evaluaciones");
  }

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
        {statEntries.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            className="card stat-card"
            onClick={() => statNavigate(label)}
          >
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </button>
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
            {isViePublicacion &&
              vieTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="task-row"
                  onClick={() => navigate(task.path)}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.meta}</span>
                  </div>
                  <div className="task-row-end">
                    <span className="badge badge-primary">{task.status}</span>
                    <IconChevron size={16} />
                  </div>
                </button>
              ))}
            {!isViePublicacion &&
              pendingTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="task-row"
                  onClick={() => navigate(task.path)}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.meta}</span>
                  </div>
                  <div className="task-row-end">
                    <span className="badge badge-primary">{task.status}</span>
                    <IconChevron size={16} />
                  </div>
                </button>
              ))}
            {isViePublicacion && vieTasks.length === 0 && (
              <div className="empty-state small">
                <strong>Sin convocatorias</strong>
                <span>Creá una convocatoria desde el acceso principal.</span>
              </div>
            )}
            {!isViePublicacion && isEvalRole && pendingTasks.length === 0 && (
              <div className="empty-state small">
                <strong>Sin pendientes</strong>
                <span>No hay expedientes en su bandeja en este momento.</span>
              </div>
            )}
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
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);

  const role = session?.viewRole;
  const sessionRole = session?.role;
  const needsProposals = role === "investigador" || role === "admin";
  const needsConvocatorias =
    role === "admin" || role === "vie_publicacion";

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

  const loadConvocatorias = useCallback(async () => {
    if (!needsConvocatorias) {
      setConvocatorias([]);
      return;
    }
    try {
      setConvocatorias(await fetchConvocatorias());
    } catch {
      setConvocatorias([]);
    }
  }, [needsConvocatorias]);

  useEffect(() => {
    void loadPropuestas();
  }, [loadPropuestas]);

  useEffect(() => {
    void loadConvocatorias();
  }, [loadConvocatorias]);

  if (!session || !role || !sessionRole) return null;

  if (role === "admin") {
    return (
      <AdminHome
        home={HOME_BY_ROLE.admin}
        proposals={proposals}
        convocatorias={convocatorias}
      />
    );
  }

  if (role === "investigador") {
    return (
      <InvestigadorHome
        home={HOME_BY_ROLE.investigador}
        proposals={proposals}
      />
    );
  }

  return (
    <RoleHome
      role={role}
      convocatorias={convocatorias}
      sessionRole={sessionRole}
    />
  );
}
