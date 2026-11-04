import { labelEstado, STAGE_LABELS } from "../data/proposalStates";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchPropuestas, type Propuesta } from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";



export function PropuestasPage() {
  const { session, isAdminSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = session?.viewRole;
  const isAdminView = isAdminSession && role === "admin";
  const canCreate =
    role === "investigador" || isAdminView || session?.role === "admin";

  const [rows, setRows] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const estadoFromUrl = searchParams.get("estado");
  const [estado, setEstado] = useState(estadoFromUrl || "Todos");
  const lastToast = useRef<string | null>(null);

  useEffect(() => {
    if (estadoFromUrl) setEstado(estadoFromUrl);
  }, [estadoFromUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRows(await fetchPropuestas());
      lastToast.current = null;
    } catch (err) {
      const mensaje =
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las propuestas";
      setLoadError(mensaje);
      // Evita dos toasts idénticos (p. ej. StrictMode en desarrollo)
      if (lastToast.current !== mensaje) {
        lastToast.current = mensaje;
        showToast(mensaje, "error");
      }
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

  const matchesEstado = useCallback((estadoActual: string, filter: string) => {
    if (filter === "Todos") return true;
    const code = estadoActual.toLowerCase();
    const label = labelEstado(estadoActual);
    return (
      label === filter ||
      label.toLowerCase() === filter.toLowerCase() ||
      code === filter.toLowerCase()
    );
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      const hay =
        !q ||
        `${p.titulo} ${p.codigo} ${p.coordinadorNombre} ${p.escuelaNombre}`
          .toLowerCase()
          .includes(q);
      const est = matchesEstado(p.estadoActual, estado);
      return hay && est;
    });
  }, [rows, query, estado, matchesEstado]);

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

      <section className="card filter-card" style={{ marginBottom: 18 }}>
        <div className="filter-card-title">
          <strong>Filtros de búsqueda</strong>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!query && estado === "Todos"}
            onClick={() => {
              setQuery("");
              setEstado("Todos");
            }}
          >
            Limpiar
          </button>
        </div>
        <div className="form-grid two-col">
          <label className="field" htmlFor="prop-filtro-q">
            <span className="field-label">Buscar</span>
            <input
              id="prop-filtro-q"
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Título, código, escuela o investigador…"
            />
          </label>
          <label className="field" htmlFor="prop-filtro-estado">
            <span className="field-label">Estado</span>
            <select
              id="prop-filtro-estado"
              className="input"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <div className="section-inline" style={{ marginBottom: 12 }}>
          <strong>
            {loading
              ? "Cargando…"
              : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}
          </strong>
          <span className="muted">Los filtros pueden combinarse</span>
        </div>

        {loading && <p>Cargando…</p>}

        {!loading && loadError && (
          <p role="alert" className="field-hint" style={{ color: "var(--danger, #b00020)" }}>
            {loadError}
          </p>
        )}

        {!loading && !loadError && filtered.length === 0 && (
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
                        <span>{STAGE_LABELS[p.etapaFlujo] ?? "Sin etapa registrada"}</span>
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
