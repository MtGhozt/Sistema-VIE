import {FilterGroup} from "../components/FilterGroup";
import { labelEstado, STAGE_LABELS } from "../data/proposalStates";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchPropuestas, type Propuesta } from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { FilterPanel } from "../components/FilterPanel";
import { useToast } from "../components/toast/ToastContext";



export function PropuestasPage() {
  const { session, isAdminSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams,setSearchParams] = useSearchParams();
  const role = session?.viewRole;
  const isAdminView = isAdminSession && role === "admin";
  const canCreate =
    role === "investigador" || isAdminView || session?.role === "admin";

  const [rows, setRows] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q")??"");
  const estadoFromUrl = searchParams.get("estado");
  const [estado, setEstado] = useState(estadoFromUrl || "Todos");
  const lastToast = useRef<string | null>(null);

  useEffect(() => {
    setEstado(estadoFromUrl??"Todos");setQuery(searchParams.get("q")??"");
  }, [estadoFromUrl,searchParams]);

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
    () => ["Todos", ...new Set([...rows.map((r) => labelEstado(r.estadoActual)),...(estadoFromUrl?[estadoFromUrl]:[])])],
    [rows,estadoFromUrl],
  );

  const matchesEstado = useCallback((estadoActual: string, filter: string) => {
    if (filter === "Todos") return true;
    if(filter==="en_revision")return !["borrador","en_subsanacion","aprobada","rechazada"].includes(estadoActual);
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

      <FilterPanel
        clearDisabled={!query && estado === "Todos"}
        onClear={() => setSearchParams({})}
      >
        <div className="independent-filters">
          <FilterGroup title="Buscar propuesta" active={Boolean(query)} onClear={()=>{const p=new URLSearchParams(searchParams);p.delete("q");setSearchParams(p);}}><label className="field" htmlFor="prop-filtro-q">
            <span className="field-label">Buscar</span>
            <input
              id="prop-filtro-q"
              className="input"
              value={query}
              onChange={e=>{const p=new URLSearchParams(searchParams);p.set("q",e.target.value);setSearchParams(p,{replace:true});}}
              placeholder="Título, código, escuela o investigador…"
            />
          </label>
          </FilterGroup><FilterGroup title="Estado" active={estado!=="Todos"} onClear={()=>{const p=new URLSearchParams(searchParams);p.delete("estado");setSearchParams(p);}}><label className="field" htmlFor="prop-filtro-estado">
            <span className="field-label">Estado</span>
            <select
              id="prop-filtro-estado"
              className="input"
              value={estado}
              onChange={e=>{const p=new URLSearchParams(searchParams);p.set("estado",e.target.value);setSearchParams(p,{replace:true});}}
            >
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e==="en_revision"?"En revisión":e}
                </option>
              ))}
            </select>
          </label></FilterGroup>
        </div>
      </FilterPanel>

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
