import { useEffect, useState } from "react";
import {useAuth} from "../../auth/AuthContext";
import { Link,useLocation } from "react-router-dom";
import { fetchPropuesta, type PropuestaDetalle } from "../../api/propuestas";
import type { DemoProposal } from "../../data/demo";
import { formatCRC } from "../../data/proposalView";
import { mergeDetalleIntoCase } from "../../data/evalProposal";
import { ProcessTimeline } from "../ProcessTimeline";
import { IconFile } from "../icons";

function formatColones(n: number) {
  return formatCRC(n);
}

/** Expediente lateral: metadatos de bandeja + detalle real desde la API. */
export function CaseFile({ proposal }: { proposal: DemoProposal }) {
  const {session}=useAuth();
  const location=useLocation();const personal=new URLSearchParams(location.search).get("evaluacion");
  const returnTo=`/evaluaciones?propuesta=${proposal.numericId}`+(personal&&["pendiente","en_progreso","completada"].includes(personal)?`&evaluacion=${personal}`:"");
  const isAssistant=["comite_asistente","comite_evaluador"].includes(session?.viewRole??"");
  const fullLink=proposal.numericId!=null?<Link className={isAssistant?"btn btn-primary case-full-access":undefined} to={`/propuestas/${proposal.numericId}`} state={{returnTo}}>Abrir expediente completo (solo lectura)</Link>:null;
  const [detail, setDetail] = useState<PropuestaDetalle | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(Boolean(proposal.numericId));

  useEffect(() => {
    if (!proposal.numericId) {
      setDetail(null);
      setLoadError("");
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError("");
    void fetchPropuesta(proposal.numericId)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch((err) => {
        if (active) {
          setDetail(null);
          setLoadError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el expediente completo",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [proposal.numericId]);

  const view = detail ? mergeDetalleIntoCase(proposal, detail) : proposal;
  const years = view.presupuestoAnual ?? [];
  const plan = view.plan ?? [];
  const team = view.teamTec ?? [];

  return (
    <div className="case-file">
      <div className="case-file-head">
        <div>
          <span className="eyebrow">{view.id}</span>
          <h2>{view.titulo}</h2>
        </div>
        <span className="badge badge-primary">{view.estado}</span>
      </div>

      {isAssistant&&<div className="case-full-access-block">{fullLink}<p>Revise el formulario y el dictamen de PI. Al volver conservará esta propuesta en Evaluaciones.</p></div>}
      <ProcessTimeline
        currentStep={view.etapa}
        piRequired={view.piRequired}
        piAcreditada={view.piAcreditada}
        completed={
          view.estado === "Aprobada" || view.estado === "Rechazada"
        }
      />

      <div className="case-meta">
        <div>
          <span>Investigadora</span>
          <strong>{view.investigadora}</strong>
        </div>
        <div>
          <span>Escuela</span>
          <strong>{view.escuela}</strong>
        </div>
        <div>
          <span>Modalidad</span>
          <strong>{view.modalidad}</strong>
        </div>
        <div>
          <span>Presupuesto VIE</span>
          <strong>{view.presupuesto}</strong>
        </div>
      </div>

      {loading && (
        <p className="field-hint" role="status">
          Cargando expediente completo…
        </p>
      )}
      {loadError && (
        <p className="field-hint" role="alert">
          {loadError}. Se muestran solo los datos de la bandeja.
        </p>
      )}

      <div className="case-summary">
        <strong>Resumen</strong>
        <p>{view.resumen || "Sin resumen registrado."}</p>
      </div>

      {(detail?.problema || detail?.objetivoGeneral || detail?.metodologia) && (
        <div className="case-summary">
          <strong>Contenido técnico</strong>
          {detail?.problema && (
            <p>
              <span className="field-hint">Problema · </span>
              {detail.problema.slice(0, 480)}
              {detail.problema.length > 480 ? "…" : ""}
            </p>
          )}
          {detail?.objetivoGeneral && (
            <p>
              <span className="field-hint">Objetivo general · </span>
              {detail.objetivoGeneral.slice(0, 320)}
              {detail.objetivoGeneral.length > 320 ? "…" : ""}
            </p>
          )}
          {detail?.metodologia && (
            <p>
              <span className="field-hint">Metodología · </span>
              {detail.metodologia.slice(0, 480)}
              {detail.metodologia.length > 480 ? "…" : ""}
            </p>
          )}
        </div>
      )}

      {team.length > 0 && (
        <div className="case-summary">
          <strong>Equipo ({team.length})</strong>
          <ul className="case-team-list">
            {team.slice(0, 8).map((m) => (
              <li key={`${m.nombre}-${m.rol}`}>
                {m.nombre}
                {m.rol ? ` · ${m.rol}` : ""}
                {m.horas && m.horas !== "—" ? ` · ${m.horas}` : ""}
              </li>
            ))}
          </ul>
          {team.length > 8 && (
            <p className="field-hint">+{team.length - 8} integrantes más en el expediente.</p>
          )}
        </div>
      )}

      {plan.length > 0 && (
        <div className="case-summary">
          <strong>Plan de acción ({plan.length} actividades)</strong>
          <ul className="case-team-list">
            {plan.slice(0, 5).map((row, i) => (
              <li key={`${row.objetivo}-${row.actividad}-${i}`}>
                {row.objetivo}: {row.actividad}
                {row.riesgo ? ` · Riesgo: ${row.riesgo}` : ""}
              </li>
            ))}
          </ul>
          {plan.length > 5 && (
            <p className="field-hint">+{plan.length - 5} actividades más en el expediente.</p>
          )}
        </div>
      )}

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
        {view.documentos.length === 0 && (
          <p className="field-hint">Sin oficios ni adjuntos listados aún.</p>
        )}
        {view.documentos.map((doc) => (
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

      {!isAssistant&&fullLink}

    </div>
  );
}
