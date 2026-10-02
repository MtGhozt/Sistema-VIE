import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProcessTimeline } from "../components/ProcessTimeline";

type HistoricoItem = {
  id: string;
  proyecto: string;
  escuela: string;
  investigador: string;
  tema: string;
  estado: "Aprobada" | "Rechazada";
  anio: string;
};

export const HISTORICO_ITEMS: HistoricoItem[] = [
  {
    id: "PROP-2026-031",
    proyecto: "Optimización energética en microredes universitarias",
    escuela: "Escuela de Electromecánica",
    investigador: "Ana Solano",
    tema: "Energía",
    estado: "Aprobada",
    anio: "2026",
  },
  {
    id: "PROP-2026-018",
    proyecto: "Modelo predictivo de erosión en cuencas del Caribe",
    escuela: "Escuela de Ingeniería Forestal",
    investigador: "David Mora",
    tema: "Ambiente",
    estado: "Aprobada",
    anio: "2026",
  },
  {
    id: "PROP-2025-044",
    proyecto: "Herramienta de apoyo para diagnóstico de enfermedades del café",
    escuela: "Escuela de Computación",
    investigador: "Laura Vega",
    tema: "Agrotecnología",
    estado: "Rechazada",
    anio: "2025",
  },
  {
    id: "PROP-2025-027",
    proyecto: "Análisis de materiales sostenibles para construcción",
    escuela: "Escuela de Construcción",
    investigador: "Mario Rojas",
    tema: "Materiales",
    estado: "Aprobada",
    anio: "2025",
  },
];

type Filters = {
  escuela: string;
  investigador: string;
  tema: string;
  estado: string;
  anio: string;
};

const EMPTY_FILTERS: Filters = {
  escuela: "",
  investigador: "",
  tema: "",
  estado: "",
  anio: "",
};

function HistoricoModal({
  item,
  onClose,
}: {
  item: HistoricoItem;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="historico-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="historico-modal-title">{item.proyecto}</h2>
            <p>
              {item.id} · Expediente histórico
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body historical-detail">
          <div className="detail-grid">
            <div>
              <span>Escuela</span>
              <strong>{item.escuela}</strong>
            </div>
            <div>
              <span>Persona investigadora</span>
              <strong>{item.investigador}</strong>
            </div>
            <div>
              <span>Temática</span>
              <strong>{item.tema}</strong>
            </div>
            <div>
              <span>Resultado</span>
              <strong>
                <span
                  className={
                    item.estado === "Aprobada" ? "badge badge-primary" : "badge"
                  }
                >
                  {item.estado}
                </span>
              </strong>
            </div>
          </div>
          <h3>Ruta institucional</h3>
          <ProcessTimeline currentStep={6} completed />
          <div className="historical-docs">
            <strong>Documentos generados</strong>
            <span>Dictamen PI · CV-023-2026</span>
            <span>Oficio Comité · CT-041-2026</span>
            <span>Aval Consejo · ESC-COMP-117-2026</span>
            <span>Resolución · CIE-RES-084-2026</span>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Cerrar expediente
          </button>
        </div>
      </div>
    </div>
  );
}

export function HistoricoPage() {
  const { codigo } = useParams();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<HistoricoItem | null>(null);

  useEffect(() => {
    if (!codigo) return;
    const found = HISTORICO_ITEMS.find((h) => h.id === codigo);
    if (found) setSelected(found);
  }, [codigo]);

  const filtered = useMemo(() => {
    return HISTORICO_ITEMS.filter((h) => {
      const esc =
        !filters.escuela ||
        h.escuela.toLowerCase().includes(filters.escuela.toLowerCase());
      const inv =
        !filters.investigador ||
        h.investigador
          .toLowerCase()
          .includes(filters.investigador.toLowerCase());
      const tema =
        !filters.tema ||
        h.tema.toLowerCase().includes(filters.tema.toLowerCase());
      const est = !filters.estado || h.estado === filters.estado;
      const anio = !filters.anio || h.anio === filters.anio;
      return esc && inv && tema && est && anio;
    });
  }, [filters]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Consulta histórica</p>
          <h1>Propuestas resueltas</h1>
          <p>
            Consulte expedientes históricos mediante filtros combinables por
            dependencia, persona investigadora, temática y resultado.
          </p>
        </div>
      </header>

      <section className="card filter-card">
        <div className="filter-card-title">
          <strong>Filtros de búsqueda</strong>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            Limpiar
          </button>
        </div>
        <div className="form-grid five-col">
          <label className="field">
            <span className="field-label">Escuela / Dependencia</span>
            <input
              className="input"
              value={filters.escuela}
              onChange={(e) =>
                setFilters({ ...filters, escuela: e.target.value })
              }
              placeholder="Ej. Computación"
            />
          </label>
          <label className="field">
            <span className="field-label">Persona investigadora</span>
            <input
              className="input"
              value={filters.investigador}
              onChange={(e) =>
                setFilters({ ...filters, investigador: e.target.value })
              }
              placeholder="Nombre"
            />
          </label>
          <label className="field">
            <span className="field-label">Temática</span>
            <input
              className="input"
              value={filters.tema}
              onChange={(e) => setFilters({ ...filters, tema: e.target.value })}
              placeholder="Ej. Energía"
            />
          </label>
          <label className="field">
            <span className="field-label">Estado</span>
            <select
              className="input"
              value={filters.estado}
              onChange={(e) =>
                setFilters({ ...filters, estado: e.target.value })
              }
            >
              <option value="">Todos</option>
              <option>Aprobada</option>
              <option>Rechazada</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Año</span>
            <select
              className="input"
              value={filters.anio}
              onChange={(e) =>
                setFilters({ ...filters, anio: e.target.value })
              }
            >
              <option value="">Todos</option>
              <option>2026</option>
              <option>2025</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <div className="results-head">
          <strong>{filtered.length} resultados</strong>
          <span>Los filtros pueden combinarse.</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Escuela</th>
                <th>Persona investigadora</th>
                <th>Temática</th>
                <th>Año</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="clickable"
                  tabIndex={0}
                  onClick={() => setSelected(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(row);
                    }
                  }}
                >
                  <td>
                    <div className="table-primary">
                      <strong>{row.proyecto}</strong>
                      <span>{row.id}</span>
                    </div>
                  </td>
                  <td>{row.escuela}</td>
                  <td>{row.investigador}</td>
                  <td>{row.tema}</td>
                  <td>{row.anio}</td>
                  <td>
                    <span
                      className={
                        row.estado === "Aprobada"
                          ? "badge badge-primary"
                          : "badge"
                      }
                    >
                      {row.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
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
