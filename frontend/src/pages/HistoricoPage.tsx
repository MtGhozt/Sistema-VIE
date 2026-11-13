import {useAuth} from "../auth/AuthContext";
import {PropuestaDetallePage} from "./PropuestaDetallePage";
import {estadosPi} from "../api/vinculacion";
import { FilterGroup } from "../components/FilterGroup";
import {dateLabel} from "../data/convocatoriaUi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams,useSearchParams,useNavigate } from "react-router-dom";
import {
  EMPTY_HISTORICO_FILTROS,
  fetchHistorico,
  type HistoricoFiltros,
  type HistoricoItem,
  type HistoricoOpciones,
} from "../api/historico";
import { ApiError } from "../api/client";
import { FilterPanel } from "../components/FilterPanel";
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

function formatDate(iso: string | null) { return dateLabel(iso);
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
  const {session}=useAuth();const isVinculacion=session?.viewRole==="vinculacion";const fullReader=isVinculacion||session?.viewRole==="comite_asistente";
  const [search,setSearch]=useSearchParams();const navigate=useNavigate();
  const fromUrl=()=>Object.fromEntries(Object.keys(EMPTY_HISTORICO_FILTROS).map(key=>[key,search.get(key)??''])) as HistoricoFiltros;
  const [filtros, setFiltros] = useState<HistoricoFiltros>(
    fromUrl,
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

  useEffect(()=>{setFiltros(Object.fromEntries(Object.keys(EMPTY_HISTORICO_FILTROS).map(key=>[key,search.get(key)??''])) as HistoricoFiltros);},[search]);

  // La búsqueda por texto se difiere 300 ms para no golpear la API en cada tecla.
  useEffect(() => {
    const t = window.setTimeout(() => {
      void cargar(filtros);
    }, 300);
    return () => window.clearTimeout(t);
  }, [filtros, cargar]);

  // Deep-link /historico/:codigo → abre el expediente directamente.
  useEffect(() => {
    if (!codigo||fullReader) return;
    const found = items.find((h) => h.codigo === codigo);
    if (found) setSelected(found);
  }, [codigo, items,fullReader]);

  const activos = useMemo(
    () => Object.values(filtros).filter(Boolean).length,
    [filtros],
  );

  function set<K extends keyof HistoricoFiltros>(
    key: K,
    value: HistoricoFiltros[K],
  ) {
    const next=new URLSearchParams(search);if(value)next.set(key,value);else next.delete(key);setSearch(next,{replace:true});
  }

  function openRecord(row:HistoricoItem){if(fullReader)navigate(`/historico/${encodeURIComponent(row.codigo)}`,{state:{returnTo:'/historico'+(search.toString()?'?'+search.toString():'')}});else setSelected(row);}
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

      <FilterPanel
        clearDisabled={activos === 0}
        onClear={() => setSearch({})}
      >
        <div className="independent-filters">{isVinculacion&&<FilterGroup title="Estado de PI" active={Boolean(filtros.pi)} onClear={()=>set('pi','')}><label className="field" htmlFor="filtro-pi"><span className="field-label">Estado de PI</span><select aria-label="Estado de PI" id="filtro-pi" className="input" value={filtros.pi} onChange={e=>set('pi',e.target.value)}><option value="">Todos los registros de PI</option>{estadosPi.map(s=><option key={s.valor} value={s.valor}>{s.label}</option>)}</select></label></FilterGroup>}
          <FilterGroup title="Escuela / Dependencia" active={Boolean(filtros.escuela)} onClear={()=>set("escuela","")}>
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
</FilterGroup>
          <FilterGroup title="Persona investigadora" active={Boolean(filtros.investigadora)} onClear={()=>set("investigadora","")}>
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
</FilterGroup>
          <FilterGroup title="Línea / Temática" active={Boolean(filtros.linea)} onClear={()=>set("linea","")}>
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
</FilterGroup>
          <FilterGroup title="Estado" active={Boolean(filtros.estado)} onClear={()=>set("estado","")}>
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
</FilterGroup>
          <FilterGroup title="Año" active={Boolean(filtros.anio)} onClear={()=>set("anio","")}>
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
</FilterGroup>
        </div>
      </FilterPanel>

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
                  <th scope="col">{isVinculacion?"Estado de propuesta":"Estado"}</th>{isVinculacion&&<th scope="col">Estado de PI</th>}
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
                    onClick={() => openRecord(row)}
                  >
                    <td>
                      <div className="table-primary">
                        <button
                          type="button"
                          className="table-link"
                          aria-haspopup={fullReader?undefined:"dialog"}
                          onClick={(e) => {
                            e.stopPropagation();
                            openRecord(row);
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
                    {isVinculacion&&<td><span className="badge">{row.estadoPiLabel}</span></td>}
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        aria-label={`Ver expediente ${row.codigo}: ${row.titulo}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRecord(row);
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

      {selected && !fullReader && (
        <HistoricoModal item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

export function HistoricoDetallePage() {
  const {session}=useAuth();return ["vinculacion","comite_asistente"].includes(session?.viewRole??"")?<PropuestaDetallePage/>:<HistoricoPage/>;
}
