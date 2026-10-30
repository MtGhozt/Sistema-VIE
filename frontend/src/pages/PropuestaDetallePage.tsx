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

function apiToDetailModel(
  d: PropuestaDetalle,
  template?: ReturnType<typeof getDemoProposal>,
): ProposalDetailModel {
  const t = template;
  return {
    id: d.codigo,
    titulo: d.titulo,
    convocatoria: d.convocatoriaNombre,
    investigadora: d.coordinadorNombre,
    escuela: d.escuelaNombre,
    modalidad: d.modalidadLabel,
    estado: labelEstado(d.estadoActual),
    etapa: stepFromPropuestaEstado(d.estadoActual, d.etapaFlujo),
    piRequired: t?.piRequired ?? false,
    presupuesto: t?.presupuesto ?? "—",
    resumen: d.resumen ?? t?.resumen ?? "",
    abstract: d.abstractEn ?? t?.abstract ?? "",
    palabras:
      d.keywordsEs.length > 0 ? d.keywordsEs : (t?.palabras ?? []),
    keywords:
      d.keywordsEn.length > 0 ? d.keywordsEn : (t?.keywords ?? []),
    teamTec: t?.teamTec ?? [
      {
        nombre: d.coordinadorNombre,
        instancia: d.escuelaNombre,
        rol: "Coordinadora",
        horas: "—",
      },
    ],
    teamExternal: t?.teamExternal,
    presupuestoAnual: t?.presupuestoAnual,
    financiamiento: t?.financiamiento,
    productos: t?.productos,
    activoPI: t?.activoPI,
    etica: t?.etica,
    observaciones: t?.observaciones ?? [],
    timeline:
      d.estadoActual === "borrador"
        ? [
            {
              titulo: "Borrador creado",
              detalle: "Expediente en formulación.",
              fecha: new Date().toLocaleDateString("es-CR", {
                day: "numeric",
                month: "short",
              }),
            },
          ]
        : (t?.timeline ?? [
            {
              titulo: "Propuesta enviada",
              detalle:
                "La propuesta fue enviada para continuar el flujo institucional.",
              fecha: d.fechaEnvio
                ? new Date(d.fechaEnvio).toLocaleDateString("es-CR", {
                    day: "numeric",
                    month: "short",
                  })
                : "—",
            },
          ]),
    documentos: t?.documentos ?? [
      { nombre: "Formulario de propuesta", estado: "Completo" },
      { nombre: "Plan de acción y riesgos", estado: "Pendiente" },
      { nombre: "Presupuesto", estado: "Pendiente" },
    ],
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

  const model = apiToDetailModel(detail, getDemoProposal("PROP-2027-014"));
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
