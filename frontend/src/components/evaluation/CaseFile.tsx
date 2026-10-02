import { ProcessTimeline } from "../ProcessTimeline";
import { IconFile } from "../icons";
import type { DemoProposal } from "../../data/demo";

function formatColones(n: number) {
  return `₡${new Intl.NumberFormat("es-CR").format(n)}`;
}

/** Expediente lateral del prototipo HTML (`kt`). */
export function CaseFile({ proposal }: { proposal: DemoProposal }) {
  const years = proposal.presupuestoAnual ?? [];

  return (
    <div className="case-file">
      <div className="case-file-head">
        <div>
          <span className="eyebrow">{proposal.id}</span>
          <h3>{proposal.titulo}</h3>
        </div>
        <span className="badge badge-primary">{proposal.estado}</span>
      </div>

      <ProcessTimeline
        currentStep={proposal.etapa}
        piRequired={proposal.piRequired}
        completed={
          proposal.estado === "Aprobada" || proposal.estado === "Rechazada"
        }
      />

      <div className="case-meta">
        <div>
          <span>Investigadora</span>
          <strong>{proposal.investigadora}</strong>
        </div>
        <div>
          <span>Escuela</span>
          <strong>{proposal.escuela}</strong>
        </div>
        <div>
          <span>Modalidad</span>
          <strong>{proposal.modalidad}</strong>
        </div>
        <div>
          <span>Presupuesto VIE</span>
          <strong>{proposal.presupuesto}</strong>
        </div>
      </div>

      <div className="case-summary">
        <strong>Resumen</strong>
        <p>{proposal.resumen}</p>
      </div>

      {years.length > 0 && (
        <div className="case-budget-years">
          <strong>Presupuesto por año</strong>
          {years.map((y) => (
            <div key={y.anio}>
              <span>{y.anio}</span>
              <span>Operativo: {formatColones(y.operativo)}</span>
              <span>Bienes duraderos: {formatColones(y.duraderos)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="case-docs">
        <strong>Expediente</strong>
        {proposal.documentos.map((doc) => (
          <div key={doc.nombre}>
            <IconFile size={15} />
            <span>{doc.nombre}</span>
            <span
              className={
                doc.estado === "Completo" || doc.estado === "No requerido"
                  ? "badge badge-primary"
                  : "badge"
              }
            >
              {doc.estado}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
