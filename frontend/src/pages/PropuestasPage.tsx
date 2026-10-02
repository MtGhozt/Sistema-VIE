import { Link } from "react-router-dom";

const PROPUESTAS = [
  {
    id: "PROP-2027-014",
    titulo:
      "Sistema inteligente para monitoreo de calidad del agua mediante sensores IoT",
    estado: "Pendiente de dictamen PI",
    convocatoria: "Fondos VIE 2027",
    presupuesto: "₡18 450 000",
  },
  {
    id: "PROP-2026-008",
    titulo: "Plataforma de datos abiertos para investigación institucional",
    estado: "Borrador",
    convocatoria: "Fortalecimiento 2026",
    presupuesto: "₡9 200 000",
  },
  {
    id: "PROP-2025-021",
    titulo: "Modelo de predicción de deserción estudiantil",
    estado: "Aprobada",
    convocatoria: "Fondos VIE 2025",
    presupuesto: "₡12 000 000",
  },
];

export function PropuestasPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Propuestas</p>
          <h1>Mis propuestas</h1>
          <p>
            Seguimiento de las propuestas asociadas a la persona investigadora
            coordinadora.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/propuestas/nueva" className="btn btn-primary">
            Crear propuesta
          </Link>
        </div>
      </header>

      <section className="recent-proposals-list">
        {PROPUESTAS.map((p) => (
          <article key={p.id} className="card proposal-dashboard-card">
            <div className="proposal-dashboard-head">
              <div>
                <span className="eyebrow">{p.id}</span>
                <h2>{p.titulo}</h2>
                <span>{p.convocatoria}</span>
              </div>
              <div className="proposal-dashboard-meta">
                <span className="badge badge-primary">{p.estado}</span>
                <span>{p.presupuesto}</span>
                <Link to={`/propuestas/${p.id}`} className="btn btn-secondary">
                  Abrir
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
