import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  EMPTY_HISTORICO_FILTROS,
  fetchHistorico,
  type HistoricoFiltros,
  type HistoricoItem,
  type HistoricoOpciones,
} from "../api/historico";
import { ApiError } from "../api/client";
import { ProcessTimeline } from "../components/ProcessTimeline";
import { SimpleModal } from "../components/evaluation/SimpleModal";
const EMPTY_OPTIONS: HistoricoOpciones = {
  escuelas: [],
  lineas: [],
  estados: [],
  anios: [],
};

function yearOf(iso: string | null) {
  return iso ? Number(iso.slice(0, 4)) : null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function HistoricoModal({
  item,
  onClose,
}: {
  item: HistoricoItem;
  onClose: () => void;
}) {
  return (
    <SimpleModal
      open
      title={item.titulo}
      description={`${item.codigo} · Expediente histórico`}
      onClose={onClose}
      bodyClassName="historical-detail"
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Cerrar expediente
        </button>
      }
    >
      <div className="detail-grid">
        <div>
          <span>Escuela</span>
          <strong>{item.escuela}</strong>
        </div>
        <div>
          <span>Persona investigadora</span>
          <strong>{item.investigadora}</strong>
        </div>
        <div>
          <span>Línea / Temática</span>
          <strong>{item.lineas.length ? item.lineas.join(", ") : "—"}</strong>
        </div>
        <div>
          <span>Modalidad</span>
          <strong>{item.modalidadLabel}</strong>
        </div>
        <div>
          <span>Resultado</span>
          <strong>
            <span
              className={
                item.estado === "aprobada"
                  ? "badge badge-primary"
                  : "badge"
              }
            >
              {item.estadoLabel}
            </span>
          </strong>
        </div>
        <div>
          <span>Fecha de resolución</span>
          <strong>{formatDate(item.fechaResolucion)}</strong>
        </div>
      </div>
      <h3>Ruta institucional</h3>
      <ProcessTimeline
        currentStep={item.etapaFlujo}
        completed={item.estado === "aprobada" || item.estado === "rechazada"}
      />
      {item.documentos.length > 0 && (
        <div className="historical-docs">
          <strong>Documentos generados</strong>
          {item.documentos.map((d) => (
            <span key={d.numero}>
              {d.tipo} · {d.numero}
            </span>
          ))}
        </div>
      )}
    </SimpleModal>
  );
}

export function HistoricoPage() {
  const { codigo } = useParams();
  const [filtros, setFiltros] = useState<HistoricoFiltros>(
    EMPTY_HISTORICO_FILTROS,
  );
  const [items, setItems] = useState<HistoricoItem[]>([]);
  const [opciones, setOpciones] = useState<HistoricoOpciones>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HistoricoItem | null>(null);

  const cargar = useCallback(async (f: HistoricoFiltros) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistorico(f);
      setItems(data.items);
      setOpciones(data.opciones);
    } catch (err) {
      setItems([]);
      const mensaje =
        err instanceof ApiError
          ? err.message
          : "No se pudo consultar el histórico de propuestas";
      // Solo error inline: evita duplicar el mismo mensaje en toast
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  // La búsqueda por texto se difiere 300 ms para no golpear la API en cada tecla.
  useEffect(() => {
    const t = window.setTimeout(() => {
      void cargar(filtros);
    }, 300);
    return () => window.clearTimeout(t);
  }, [filtros, cargar]);

  // Deep-link /historico/:codigo → abre el expediente directamente.
  useEffect(() => {
    if (!codigo) return;
    const found = items.find((h) => h.codigo === codigo);
    if (found) setSelected(found);
  }, [codigo, items]);

  const activos = useMemo(
    () => Object.values(filtros).filter(Boolean).length,
    [filtros],
  );

  function set<K extends keyof HistoricoFiltros>(
    key: K,
    value: HistoricoFiltros[K],
  ) {
    setFiltros((f) => ({ ...f, [key]: value }));
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Consulta histórica</p>
          <h1>Histórico de propuestas</h1>
          <p>
            Consulte expedientes históricos mediante filtros combinables por
            dependencia, persona investigadora, línea de investigación, estado
            y año.
          </p>
        </div>
      </header>

      <section className="card filter-card">
        <div className="filter-card-title">
          <strong>Filtros de búsqueda</strong>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setFiltros(EMPTY_HISTORICO_FILTROS)}
            disabled={activos === 0}
          >
            Limpiar{activos > 0 ? ` (${activos})` : ""}
          </button>
        </div>
        <div className="form-grid five-col">
          <label className="field" htmlFor="filtro-escuela">
            <span className="field-label">Escuela / Dependencia</span>
            <select
              id="filtro-escuela"
              className="input"
              value={filtros.escuela}
              onChange={(e) => set("escuela", e.target.value)}
            >
              <option value="">Todas</option>
              {opciones.escuelas.map((e) => (
                <option key={e.codigo} value={e.nombre}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="filtro-investigadora">
            <span className="field-label">Persona investigadora</span>
            <input
              id="filtro-investigadora"
              className="input"
              value={filtros.investigadora}
              onChange={(e) => set("investigadora", e.target.value)}
              placeholder="Nombre o apellido"
            />
          </label>
          <label className="field" htmlFor="filtro-linea">
            <span className="field-label">Línea / Temática</span>
            <select
              id="filtro-linea"
              className="input"
              value={filtros.linea}
              onChange={(e) => set("linea", e.target.value)}
            >
              <option value="">Todas</option>
              {opciones.lineas.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="filtro-estado">
            <span className="field-label">Estado</span>
            <select
              id="filtro-estado"
              className="input"
              value={filtros.estado}
              onChange={(e) => set("estado", e.target.value)}
            >
              <option value="">Todos</option>
              {opciones.estados.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="filtro-anio">
            <span className="field-label">Año</span>
            <select
              id="filtro-anio"
              className="input"
              value={filtros.anio}
              onChange={(e) => set("anio", e.target.value)}
            >
              <option value="">Todos</option>
              {opciones.anios.map((a) => (
                <option key={a} value={String(a)}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card" aria-busy={loading}>
        <div className="results-head">
          <strong role="status" aria-live="polite">
            {loading
              ? "Consultando…"
              : `${items.length} ${items.length === 1 ? "resultado" : "resultados"}`}
          </strong>
          <span>Los filtros pueden combinarse.</span>
        </div>

        {error && (
          <div role="alert" aria-live="assertive">
            <p className="field-error-text">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="empty-state small">
            <strong>Sin resultados</strong>
            <span>
              Ninguna propuesta coincide con los filtros seleccionados.
              Ajustá o limpiá los filtros para ampliar la búsqueda.
            </span>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">
                Resultados del histórico de propuestas
              </caption>
              <thead>
                <tr>
                  <th scope="col">Propuesta</th>
                  <th scope="col">Escuela</th>
                  <th scope="col">Persona investigadora</th>
                  <th scope="col">Línea / Temática</th>
                  <th scope="col">Año</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.id}
                    className="clickable"
                    onClick={() => setSelected(row)}
                  >
                    <td>
                      <div className="table-primary">
                        <button
                          type="button"
                          className="table-link"
                          aria-haspopup="dialog"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(row);
                          }}
                        >
                          {row.titulo}
                        </button>
                        <span>
                          {row.codigo} · {row.modalidadLabel}
                        </span>
                      </div>
                    </td>
                    <td>{row.escuela}</td>
                    <td>{row.investigadora}</td>
                    <td>{row.lineas.length ? row.lineas.join(", ") : "—"}</td>
                    <td>
                      {yearOf(row.fechaResolucion ?? row.fechaEnvio) ?? "—"}
                    </td>
                    <td>
                      <span
                        className={
                          row.estado === "aprobada"
                            ? "badge badge-primary"
                            : "badge"
                        }
                      >
                        {row.estadoLabel}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        aria-label={`Ver expediente ${row.codigo}: ${row.titulo}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(row);
                        }}
                      >
                        Ver expediente
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <HistoricoModal item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

export function HistoricoDetallePage() {
  return <HistoricoPage />;
}
