import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  enviarPropuesta,
  fetchPropuesta,
  type PropuestaDetalle,
} from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";
import {
  ProposalDetailView,
  type ProposalDetailModel,
} from "../components/ProposalDetailView";
import {
  ProcessTimeline,
  stepFromPropuestaEstado,
} from "../components/ProcessTimeline";
import {
  ADMIN_STAGE_ROLES,
  getDemoProposal,
} from "../data/demo";

function labelEstado(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    enviada: "Enviada",
  };
  return map[estado] ?? estado;
}

function apiToDetailModel(d: PropuestaDetalle): ProposalDetailModel {
  return {
    id: d.codigo, titulo: d.titulo, convocatoria: d.convocatoriaNombre,
    investigadora: d.coordinadorNombre, escuela: d.escuelaNombre, modalidad: d.modalidadLabel,
    estado: labelEstado(d.estadoActual), etapa: stepFromPropuestaEstado(d.estadoActual, d.etapaFlujo),
    piRequired: d.requiereDictamenPi, presupuesto: "—", resumen: d.resumen ?? "", abstract: d.abstractEn ?? "",
    palabras: d.keywordsEs, keywords: d.keywordsEn,
    teamTec: d.teamTec ?? [], teamExternal: d.teamExternal ?? [], presupuestoAnual: d.presupuestoAnual ?? [],
    etica: d.aspectosEticos ? `Aspectos declarados: ${[d.aspectosEticos.humanos && "seres humanos", d.aspectosEticos.biodiversidad && "biodiversidad", d.aspectosEticos.animales && "animales", d.aspectosEticos.indigenas && "pueblos indígenas"].filter(Boolean).join(", ") || "ninguno"}. ${d.aspectosEticos.exencion}` : undefined,
    productos: d.productos ?? [], observaciones: d.observaciones ?? [], documentos: d.documentos ?? [],
    timeline: (d.timeline ?? []).map(e => ({ ...e, fecha: new Date(e.fecha).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" }) })),
  };
}

export function PropuestaDetallePage() {
  const { id } = useParams();
  const demo = id ? getDemoProposal(id) : undefined;
  const proposalId = Number(id);
  const navigate = useNavigate();
  const { session, isAdminSession } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<PropuestaDetalle | null>(null);
  const [loading, setLoading] = useState(!demo && Number.isFinite(proposalId));
  const [sending, setSending] = useState(false);

  const canEditRole =
    session?.role === "investigador" || session?.role === "admin";

  async function onEnviarBorrador() {
    if (!detail || detail.estadoActual !== "borrador") return;
    setSending(true);
    try {
      const sent = await enviarPropuesta(detail.id);
      setDetail(sent);
      showToast(`Propuesta ${sent.codigo} enviada a revisión`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "No se pudo enviar",
        "error",
      );
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (demo || !Number.isFinite(proposalId)) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setDetail(await fetchPropuesta(proposalId));
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "No se pudo cargar",
          "error",
        );
        navigate("/propuestas", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [demo, proposalId, navigate, showToast]);

  if (demo) {
    const showAdminVista =
      isAdminSession && session?.viewRole === "admin";
    // Demo PROP-* están en flujo institucional (ya enviadas) → solo lectura.
    const demoIsDraft = demo.estado.toLowerCase() === "borrador";
    return (
      <>
        <div className="breadcrumbs">
          <Link to="/propuestas">Propuestas</Link>
          <span>/</span>
          <span>{demo.id}</span>
        </div>
        <ProposalDetailView
          proposal={demo}
          showEdit={canEditRole && demoIsDraft}
        />
        {showAdminVista && (
          <section className="card stack-md" style={{ marginTop: 18 }}>
            <div className="section-title">
              <div>
                <h2>Vista transversal</h2>
                <p>
                  El Super Administrador no simula únicamente al investigador:
                  use «Vista actual» en la barra superior para ingresar a
                  cualquiera de las herramientas operativas.
                </p>
              </div>
            </div>
            <ProcessTimeline
              currentStep={demo.etapa}
              piRequired={demo.piRequired}
            />
            <div className="admin-stage-grid">
              {ADMIN_STAGE_ROLES.map((role) => (
                <div key={role}>
                  <strong>{role}</strong>
                  <span>Disponible mediante cambio de vista</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  if (loading || !detail) {
    return (
      <section className="card">
        <p>Cargando expediente…</p>
      </section>
    );
  }

  const model = apiToDetailModel(detail);
  const isDraft = detail.estadoActual === "borrador";

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>{detail.codigo}</span>
      </div>
      <ProposalDetailView
        proposal={model}
        showEdit={canEditRole && isDraft}
        editTo={`/propuestas/nueva?edit=${detail.id}`}
        showSend={canEditRole && isDraft}
        sending={sending}
        onSend={() => void onEnviarBorrador()}
      />
    </>
  );
}
