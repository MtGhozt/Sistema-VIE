import { useState } from "react";
import { Link } from "react-router-dom";
import type { DemoProposal } from "../data/demo";
import { ProcessTimeline } from "./ProcessTimeline";

export type ProposalDetailModel = DemoProposal;

type TabId =
  | "resumen"
  | "equipo"
  | "presupuesto"
  | "productos"
  | "documentos"
  | "observaciones";

const TAB_LABELS: Record<TabId, string> = {
  resumen: "Resumen",
  equipo: "Equipo",
  presupuesto: "Presupuesto",
  productos: "Productos y ética",
  documentos: "Documentos",
  observaciones: "Observaciones",
};

function formatColones(n: number) {
  return `₡${new Intl.NumberFormat("es-CR").format(n)}`;
}

export function ProposalDetailView({
  proposal,
  showEdit = false,
  editTo = "/propuestas/nueva",
}: {
  proposal: ProposalDetailModel;
  /** Solo borradores: enviadas / en flujo = solo lectura. */
  showEdit?: boolean;
  editTo?: string;
}) {
  const [tab, setTab] = useState<TabId>("resumen");

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{proposal.id}</p>
          <h1>{proposal.titulo}</h1>
          <p>
            {proposal.investigadora} · {proposal.escuela}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/propuestas" className="btn btn-secondary">
            Volver
          </Link>
          {showEdit && (
            <Link to={editTo} className="btn btn-primary">
              Editar propuesta
            </Link>
          )}
        </div>
      </header>

      <section className="card proposal-status-card">
        <div className="proposal-status-head">
          <div>
            <span>Estado actual</span>
            <span className="badge badge-primary">{proposal.estado}</span>
          </div>
          <div>
            <span>Modalidad</span>
            <strong>{proposal.modalidad}</strong>
          </div>
          <div>
            <span>Presupuesto solicitado</span>
            <strong>{proposal.presupuesto}</strong>
          </div>
          <div>
            <span>Propiedad intelectual</span>
            <strong>
              {proposal.piRequired ? "Requiere dictamen" : "No requerida"}
            </strong>
          </div>
        </div>
        <ProcessTimeline
          currentStep={proposal.etapa}
          piRequired={proposal.piRequired}
          completed={
            proposal.estado === "Aprobada" || proposal.estado === "Rechazada"
          }
        />
      </section>

      <div className="detail-layout">
        <section className="card">
          <div
            className="tabs"
            role="tablist"
            aria-label="Secciones de la propuesta"
            onKeyDown={(e) => {
              const ids = Object.keys(TAB_LABELS) as TabId[];
              const i = ids.indexOf(tab);
              let next = -1;
              if (e.key === "ArrowRight") next = (i + 1) % ids.length;
              if (e.key === "ArrowLeft")
                next = (i - 1 + ids.length) % ids.length;
              if (e.key === "Home") next = 0;
              if (e.key === "End") next = ids.length - 1;
              if (next < 0) return;
              e.preventDefault();
              const target = ids[next]!;
              setTab(target);
              document
                .getElementById(`tab-${target}`)
                ?.focus();
            }}
          >
            {(Object.keys(TAB_LABELS) as TabId[]).map((id) => (
              <button
                key={id}
                id={`tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {TAB_LABELS[id]}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
          >

          {tab === "resumen" && (
            <div className="stack-lg">
              <div>
                <h2>Resumen</h2>
                <p className="body-copy">{proposal.resumen}</p>
              </div>
              {proposal.abstract && (
                <div>
                  <h2>Abstract</h2>
                  <p className="body-copy">{proposal.abstract}</p>
                </div>
              )}
              <div className="detail-grid">
                <div>
                  <span>Convocatoria</span>
                  <strong>{proposal.convocatoria}</strong>
                </div>
                <div>
                  <span>Modalidad</span>
                  <strong>{proposal.modalidad}</strong>
                </div>
                <div>
                  <span>Investigadora coordinadora</span>
                  <strong>{proposal.investigadora}</strong>
                </div>
                <div>
                  <span>Escuela</span>
                  <strong>{proposal.escuela}</strong>
                </div>
              </div>
              <div>
                <h2>Palabras clave</h2>
                <div className="tag-row">
                  {proposal.palabras.map((w) => (
                    <span key={w} className="badge">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
              {proposal.keywords.length > 0 && (
                <div>
                  <h2>Keywords</h2>
                  <div className="tag-row">
                    {proposal.keywords.map((w) => (
                      <span key={w} className="badge">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "equipo" && (
            <div className="stack-lg">
              <div>
                <h2>Personas investigadoras funcionarias del TEC</h2>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>ORCID</th>
                        <th>Instancia</th>
                        <th>Rol</th>
                        <th>Horas</th>
                        <th>Periodo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.teamTec.map((m) => (
                        <tr key={m.nombre}>
                          <td>{m.nombre}</td>
                          <td>{m.orcid ?? "—"}</td>
                          <td>{m.instancia}</td>
                          <td>{m.rol}</td>
                          <td>{m.horas}</td>
                          <td>{m.periodo ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {(proposal.teamExternal?.length ?? 0) > 0 && (
                <div>
                  <h2>Colaboradores externos</h2>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>ORCID</th>
                          <th>Institución / empresa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.teamExternal!.map((m) => (
                          <tr key={m.nombre}>
                            <td>{m.nombre}</td>
                            <td>{m.orcid ?? "—"}</td>
                            <td>{m.institucion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "presupuesto" && (
            <div className="stack-lg">
              <div>
                <h2>Presupuesto por año</h2>
                {(proposal.presupuestoAnual ?? []).length === 0 ? (
                  <p className="muted">Sin desglose anual en el borrador.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Año</th>
                          <th>Operativo</th>
                          <th>Bienes duraderos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.presupuestoAnual!.map((y) => (
                          <tr key={y.anio}>
                            <td>{y.anio}</td>
                            <td>{formatColones(y.operativo)}</td>
                            <td>{formatColones(y.duraderos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {(proposal.financiamiento?.length ?? 0) > 0 && (
                <div>
                  <h2>Financiamiento y contrapartida</h2>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Año 1</th>
                          <th>Año 2</th>
                          <th>Año 3</th>
                          <th>Oficio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.financiamiento!.map((f) => (
                          <tr key={f.oficio}>
                            <td>{f.tipo}</td>
                            <td>{formatColones(f.anio1)}</td>
                            <td>{formatColones(f.anio2)}</td>
                            <td>{formatColones(f.anio3)}</td>
                            <td>{f.oficio}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "productos" && (
            <div className="stack-md">
              <div>
                <h2>Compromisos de productos</h2>
                <ul>
                  {(proposal.productos ?? []).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              {proposal.activoPI && (
                <div>
                  <h2>Activo de propiedad intelectual</h2>
                  <p>{proposal.activoPI}</p>
                </div>
              )}
              {proposal.etica && (
                <div>
                  <h2>Aspectos éticos</h2>
                  <p>{proposal.etica}</p>
                </div>
              )}
            </div>
          )}

          {tab === "documentos" && (
            <div className="task-list">
              {proposal.documentos.map((d) => (
                <div
                  key={d.nombre}
                  className="task-row"
                  style={{ cursor: "default" }}
                >
                  <div>
                    <strong>{d.nombre}</strong>
                  </div>
                  <span
                    className={
                      d.estado === "Completo" ? "badge badge-primary" : "badge"
                    }
                  >
                    {d.estado}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "observaciones" && (
            <div className="stack-md">
              {(proposal.observaciones?.length ?? 0) === 0 ? (
                <p className="muted">Sin observaciones registradas.</p>
              ) : (
                proposal.observaciones!.map((o, i) => (
                  <p key={i}>{o}</p>
                ))
              )}
            </div>
          )}
          </div>
        </section>

        <aside className="card">
          <div className="section-title">
            <div>
              <h2>Actividad del expediente</h2>
            </div>
          </div>
          <div className="activity-list">
            {(proposal.timeline ?? []).map((ev) => (
              <div key={ev.titulo + ev.fecha} className="activity-item">
                <div className="activity-dot" />
                <div>
                  <strong>{ev.titulo}</strong>
                  <p>{ev.detalle}</p>
                  <span>{ev.fecha}</span>
                </div>
              </div>
            ))}
            {(proposal.timeline?.length ?? 0) === 0 && (
              <p className="muted">Sin actividad registrada aún.</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
