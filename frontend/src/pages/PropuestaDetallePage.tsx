import { Link, useParams } from "react-router-dom";

export function PropuestaDetallePage() {
  const { id } = useParams();

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>{id}</span>
      </div>
      <header className="page-header">
        <div>
          <p className="eyebrow">{id}</p>
          <h1>Detalle de propuesta</h1>
          <p>
            Vista estructural del expediente. El timeline, documentos y oficios
            se completan al portar el resto del prototipo.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/propuestas" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </header>

      <section className="card proposal-status-card">
        <div className="proposal-status-head">
          <div>
            <span>Estado</span>
            <strong>Pendiente de dictamen PI</strong>
          </div>
          <div>
            <span>Convocatoria</span>
            <strong>Fondos VIE 2027</strong>
          </div>
          <div>
            <span>Escuela</span>
            <strong>Ingeniería en Computación</strong>
          </div>
          <div>
            <span>Presupuesto</span>
            <strong>₡18 450 000</strong>
          </div>
        </div>
        <div className="timeline" aria-label="Etapas del flujo">
          {[
            "Postulación",
            "PI",
            "Comité",
            "Consejo",
            "VIE",
            "CIE",
            "Notificación",
          ].map((label, i) => (
            <div
              key={label}
              className={`timeline-step${i === 0 ? " done" : ""}${i === 1 ? " active" : ""}`}
            >
              <div className="timeline-marker">{i + 1}</div>
              {i < 6 && <div className="timeline-line" />}
              <div className="timeline-copy">
                <strong>{label}</strong>
                <span>{i <= 1 ? (i === 0 ? "Listo" : "Actual") : "Pendiente"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
