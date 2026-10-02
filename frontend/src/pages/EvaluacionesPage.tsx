import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AdminEvalTransversal,
  CiePanel,
  ComiteAsistentePanel,
  ComiteEvaluadorPanel,
  ConsejoAsistentePanel,
  ConsejoPanel,
  DireccionEscuelaPanel,
  DireccionInvestigacionPanel,
  GestoraViePanel,
  VinculacionPanel,
} from "../components/evaluation/EvaluationRolePanels";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";
import { getEvaluationProposals } from "../data/demo";
import type { RoleId } from "../data/roles";

const EVAL_HEADERS: Record<RoleId, [string, string, string]> = {
  vie_publicacion: [
    "VIE — Publicación",
    "Gestión de convocatorias",
    "Esta bandeja no aplica a publicación; use Convocatorias.",
  ],
  investigador: [
    "Persona investigadora",
    "Seguimiento de propuestas",
    "Consulte el estado de sus expedientes en Propuestas.",
  ],
  vinculacion: [
    "P3 · Centro de Vinculación",
    "Dictamen de Propiedad Intelectual",
    "Revise los aspectos de propiedad intelectual y registre el oficio técnico. Esta instancia no aprueba ni rechaza la propuesta completa.",
  ],
  comite_asistente: [
    "P4-a · Comité Técnico",
    "Revisión de completitud",
    "Verifique el expediente antes de remitirlo al cuerpo evaluador.",
  ],
  comite_evaluador: [
    "P4-b · Comité Técnico",
    "Evaluación técnica",
    "Evalúe con la rúbrica oficial y registre una valoración humana independiente.",
  ],
  consejo_asistente: [
    "P5-a · Consejo de Escuela",
    "Preparación de expediente",
    "Prepare el expediente para su revisión en el Consejo de Profesores.",
  ],
  consejo: [
    "P5-b · Consejo de Profesores",
    "Aval de Consejo",
    "Revise el expediente consolidado y determine el aval correspondiente.",
  ],
  direccion_escuela: [
    "P5-c · Dirección de Escuela",
    "Comunicación del aval",
    "Comunique a VIE el aval emitido por el Consejo.",
  ],
  gestora_vie: [
    "P6-a · VIE",
    "Verificación de expediente",
    "Revise contenidos, completitud y observaciones antes de remitir al CIE.",
  ],
  cie: [
    "P6-b · CIE",
    "Evaluación y resolución",
    "Evalúe mediante la rúbrica, registre observaciones y emita la resolución institucional.",
  ],
  direccion_investigacion: [
    "P6-c · Dirección de Investigación",
    "Notificación de resolución",
    "Notifique formalmente el resultado emitido por el CIE.",
  ],
  admin: [
    "Super Administrador",
    "Bandeja transversal de evaluación",
    "Seleccione una vista de rol en la barra superior para operar la etapa correspondiente.",
  ],
};

const ACTION_TOAST: Record<string, string> = {
  pi: "Dictamen de PI emitido y oficio agregado al expediente.",
  "committee-ready": "Propuesta enviada al cuerpo evaluador.",
  return: "Propuesta devuelta con observaciones.",
  "save-rubric": "Los cambios de la evaluación se guardaron correctamente.",
  "committee-score":
    "Evaluación completada y preparada para consolidación.",
  "send-council": "Expediente enviado al Consejo de Profesores.",
  "council-approve": "Aval aprobado y oficio generado.",
  "council-reject":
    "Aval rechazado correctamente. Justificación registrada.",
  "communicate-aval":
    "Memorando generado · Envío simulado a Dirección de Investigación / VIE.",
  "vie-observation":
    "Observación enviada correctamente al equipo investigador.",
  "send-cie": "Expediente enviado al CIE.",
  "cie-approve": "Resolución aprobatoria emitida.",
  "cie-reject":
    "Resolución de rechazo emitida. Justificación registrada.",
  "notify-resolution":
    "CIE-453 generado · notificación simulada · expediente en Histórico.",
};

const EVAL_ROLES: RoleId[] = [
  "vinculacion",
  "comite_asistente",
  "comite_evaluador",
  "consejo_asistente",
  "consejo",
  "direccion_escuela",
  "gestora_vie",
  "cie",
  "direccion_investigacion",
];

export function EvaluacionesPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const proposals = useMemo(() => getEvaluationProposals(), []);
  const [selectedId, setSelectedId] = useState(proposals[0]?.id ?? "");

  if (!session) return null;

  const role = session.viewRole;
  const [eyebrow, title, description] = EVAL_HEADERS[role];
  const proposal =
    proposals.find((p) => p.id === selectedId) ?? proposals[0];

  const onAction = (action: string) => {
    showToast(ACTION_TOAST[action] ?? "Acción registrada.", "success");
  };

  if (role === "vie_publicacion") {
    return (
      <>
        <header className="page-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="page-actions">
            <Link to="/convocatorias" className="btn btn-primary">
              Ir a convocatorias
            </Link>
          </div>
        </header>
      </>
    );
  }

  if (role === "investigador") {
    return (
      <>
        <header className="page-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="page-actions">
            <Link to="/propuestas" className="btn btn-primary">
              Ver mis propuestas
            </Link>
          </div>
        </header>
      </>
    );
  }

  if (!proposal) {
    return (
      <section className="card empty-state">
        <strong>No hay propuestas disponibles</strong>
      </section>
    );
  }

  const panelProps = { proposal, onAction };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      {EVAL_ROLES.includes(role) || role === "admin" ? (
        <>
          {role !== "admin" && (
            <div className="evaluation-selector">
              <span>Expediente activo</span>
              <select
                className="input"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                aria-label="Expediente activo"
              >
                {proposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === "vinculacion" && <VinculacionPanel {...panelProps} />}
          {role === "comite_asistente" && (
            <ComiteAsistentePanel {...panelProps} />
          )}
          {role === "comite_evaluador" && (
            <ComiteEvaluadorPanel {...panelProps} />
          )}
          {role === "consejo_asistente" && (
            <ConsejoAsistentePanel {...panelProps} />
          )}
          {role === "consejo" && <ConsejoPanel {...panelProps} />}
          {role === "direccion_escuela" && (
            <DireccionEscuelaPanel {...panelProps} />
          )}
          {role === "gestora_vie" && <GestoraViePanel {...panelProps} />}
          {role === "cie" && <CiePanel {...panelProps} />}
          {role === "direccion_investigacion" && (
            <DireccionInvestigacionPanel {...panelProps} />
          )}
          {role === "admin" && (
            <>
              <div className="evaluation-selector">
                <span>Expediente activo</span>
                <select
                  className="input"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {proposals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <AdminEvalTransversal proposal={proposal} />
              <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
                Cambie «Vista actual» en la barra superior para operar cada
                etapa con el panel completo del prototipo.
              </p>
            </>
          )}
        </>
      ) : (
        <section className="card">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/inicio")}
          >
            Volver al inicio
          </button>
        </section>
      )}
    </>
  );
}
