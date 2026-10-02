import { CONVOCATORIAS } from "../data/demo";

export function HistoricoPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Histórico</p>
          <h1>Propuestas resueltas</h1>
          <p>
            Consulte expedientes históricos mediante filtros combinables por
            dependencia, temática y resultado.
          </p>
        </div>
      </header>

      <section className="card filter-card">
        <div className="filter-card-title">
          <strong>Filtros</strong>
          <button type="button" className="btn btn-ghost">
            Limpiar
          </button>
        </div>
        <div className="form-grid three-col">
          <label className="field">
            <span className="field-label">Convocatoria</span>
            <select className="input" defaultValue="">
              <option value="">Todas</option>
              {CONVOCATORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Resultado</span>
            <select className="input" defaultValue="">
              <option value="">Todos</option>
              <option>Aprobada</option>
              <option>Rechazada</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Escuela</span>
            <input className="input" placeholder="Buscar…" />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="results-head">
          <strong>Resultados simulados</strong>
          <span>3 expedientes</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Resultado</th>
                <th>Año</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PROP-2025-021</td>
                <td>Modelo de predicción de deserción estudiantil</td>
                <td>
                  <span className="badge badge-primary">Aprobada</span>
                </td>
                <td>2025</td>
              </tr>
              <tr>
                <td>PROP-2024-011</td>
                <td>Sensores de bajo costo para acuicultura</td>
                <td>
                  <span className="badge">Rechazada</span>
                </td>
                <td>2024</td>
              </tr>
              <tr>
                <td>PROP-2024-003</td>
                <td>Repositorio institucional de datos FAIR</td>
                <td>
                  <span className="badge badge-primary">Aprobada</span>
                </td>
                <td>2024</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
