import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchPropuestas, type Propuesta } from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";

function labelEstado(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    enviada: "Enviada",
  };
  return map[estado] ?? estado;
}

function progressPct(p: Propuesta) {
  if (p.estadoActual === "borrador") return 35;
  if (p.estadoActual === "enviada") return Math.min(95, 45 + p.etapaFlujo * 8);
  return Math.min(100, 20 + p.etapaFlujo * 12);
}

export function PropuestasPage() {
  const { session, isAdminSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const role = session?.viewRole;
  const isAdminView = isAdminSession && role === "admin";
  const canCreate =
    role === "investigador" || isAdminView || session?.role === "admin";

  const [rows, setRows] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("Todos");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchPropuestas());
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las propuestas",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const estados = useMemo(
    () => ["Todos", ...new Set(rows.map((r) => labelEstado(r.estadoActual)))],
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      const hay =
        !q ||
        `${p.titulo} ${p.codigo} ${p.coordinadorNombre} ${p.escuelaNombre}`
          .toLowerCase()
          .includes(q);
      const est =
        estado === "Todos" || labelEstado(p.estadoActual) === estado;
      return hay && est;
    });
  }, [rows, query, estado]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">
            {isAdminView
              ? "Super Administrador · Consulta transversal"
              : "Redacción"}
          </p>
          <h1>{isAdminView ? "Todas las propuestas" : "Mis propuestas"}</h1>
          <p>
            {isAdminView
              ? "Consulte expedientes de cualquier persona investigadora y etapa institucional."
              : "Cree, complete, envíe y dé seguimiento a sus propuestas de investigación."}
          </p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <Link to="/propuestas/nueva" className="btn btn-primary">
              Crear propuesta
            </Link>
          </div>
        )}
      </header>

      <section className="card">
        <div className="toolbar">
          <div className="search-field">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, código, escuela o investigador..."
              aria-label="Buscar propuestas"
            />
          </div>
          <label className="filter-select">
            <span className="field-label" style={{ margin: 0 }}>
              Estado
            </span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              aria-label="Filtrar por estado"
            >
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p>Cargando…</p>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state small">
            <strong>Todavía no hay propuestas</strong>
            <span>
              {canCreate
                ? "Creá un borrador vinculado a una convocatoria activa."
                : "Ingresá como investigador para formular propuestas."}
            </span>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Propuesta</th>
                  {isAdminView && <th>Investigador/a</th>}
                  <th>Escuela</th>
                  <th>Modalidad</th>
                  <th>Estado</th>
                  <th>Expediente</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pct = progressPct(p);
                  return (
                    <tr
                      key={p.id}
                      className="clickable"
                      tabIndex={0}
                      onClick={() => navigate(`/propuestas/${p.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/propuestas/${p.id}`);
                        }
                      }}
                    >
                      <td>
                        <div className="table-primary">
                          <strong>{p.titulo}</strong>
                          <span>
                            {p.codigo} · {p.modalidadLabel}
                          </span>
                        </div>
                      </td>
                      {isAdminView && <td>{p.coordinadorNombre}</td>}
                      <td>{p.escuelaNombre}</td>
                      <td>{p.modalidadLabel}</td>
                      <td>
                        <span className="badge badge-primary">
                          {labelEstado(p.estadoActual)}
                        </span>
                      </td>
                      <td>
                        <div
                          className="mini-progress"
                          role="progressbar"
                          aria-label={`Avance del expediente ${p.id}`}
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuetext={`${pct}%`}
                        >
                          <div style={{ width: `${pct}%` }} />
                          <span>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/propuestas/${p.id}`}
                          className="btn btn-ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
