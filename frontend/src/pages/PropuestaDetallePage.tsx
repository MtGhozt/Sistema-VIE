import {CoordinacionEditor} from "../components/CoordinacionEditor";
import {DocumentosPanel} from "../components/DocumentosPanel";
import {apiJson} from "../api/client";
import { labelEstado } from "../data/proposalStates";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  enviarPropuesta,
  fetchPropuesta,
  fetchPropuestas,
  type PropuestaDetalle,
} from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";
import {
  ProposalDetailView,
  type ProposalDetailModel,
} from "../components/ProposalDetailView";
import { stepFromPropuestaEstado } from "../components/ProcessTimeline";


function apiToDetailModel(d: PropuestaDetalle): ProposalDetailModel {
  return {
    id: d.codigo, titulo: d.titulo, convocatoria: d.convocatoriaNombre,
    investigadora: d.coordinadorNombre, escuela: d.escuelaNombre, modalidad: d.modalidadLabel,
    estado: labelEstado(d.estadoActual), etapa: stepFromPropuestaEstado(d.estadoActual, d.etapaFlujo),
    piRequired: d.requiereDictamenPi, piAcreditada:d.piAcreditada, presupuesto: "—", resumen: d.resumen ?? "", abstract: d.abstractEn ?? "",
    identificacion:{trlActual:d.trlActual,trlEsperado:d.trlEsperado,lineas:d.lineasNombres??[]},
    general: d, actividades:d.actividades??[], fuentes:d.fuentes??[], permisos:d.permisos??[], compromisos:d.compromisos??[], equipoCompleto:d.equipo??[],
    palabras: d.keywordsEs, keywords: d.keywordsEn,
    teamTec: d.teamTec ?? [], teamExternal: d.teamExternal ?? [], presupuestoAnual: d.presupuestoAnual ?? [],
    etica: d.aspectosEticos ? `Aspectos declarados: ${[d.aspectosEticos.humanos && "seres humanos", d.aspectosEticos.biodiversidad && "biodiversidad", d.aspectosEticos.animales && "animales", d.aspectosEticos.indigenas && "pueblos indígenas"].filter(Boolean).join(", ") || "ninguno"}. ${d.aspectosEticos.exencion}` : undefined,
    productos: d.productos ?? [], observaciones: d.observaciones ?? [], documentos: d.documentos ?? [],
    timeline: (d.timeline ?? []).map(e => ({ ...e, fecha: new Date(e.fecha).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" }) })),
  };
}

export function PropuestaDetallePage() {
  const { id } = useParams();
  const proposalId = Number(id);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<PropuestaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconsideracion,setReconsideracion]=useState("");
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
    void (async () => {
      setLoading(true);
      try {
        const target=Number.isSafeInteger(proposalId)&&proposalId>0?proposalId:(await fetchPropuestas()).find(p=>p.codigo===id)?.id;
        if(!target) throw new Error("Expediente no disponible en su ámbito");
        setDetail(await fetchPropuesta(target));
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
  }, [id, proposalId, navigate, showToast]);

  if (loading || !detail) {
    return (
      <section className="card">
        <p>Cargando expediente…</p>
      </section>
    );
  }

  const model = apiToDetailModel(detail);
  const canEdit=canEditRole&&(session?.role==="admin"||detail.idCoordinador===session?.userId);
  const isDraft = detail.estadoActual === "borrador";
  const isCorrection = detail.estadoActual === "en_subsanacion";

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>{detail.codigo}</span>
      </div>
      {isCorrection && <p role="status">Debe atender las observaciones y reenviar desde el formulario de edición.</p>}
      {detail.estadoActual==='rechazo_aval'&&canEdit&&<section className="card stack-md"><h2>Solicitar reconsideración al Consejo</h2><p>El rechazo de aval continúa vigente hasta que el Consejo autorice un nuevo ciclo. No es una resolución CIE.</p><label className="field"><span>Motivo de reconsideración</span><textarea aria-label="Motivo de reconsideración" className="input textarea" value={reconsideracion} onChange={e=>setReconsideracion(e.target.value)}/></label><button type="button" className="btn btn-primary" disabled={!reconsideracion.trim()||sending} onClick={async()=>{setSending(true);try{await apiJson(`/api/evaluaciones/propuestas/${detail.id}/acciones`,{method:'POST',body:JSON.stringify({action:'request-reconsideration',payload:{texto:reconsideracion}})});showToast('Solicitud registrada para el Consejo','success');}catch(e){showToast(e instanceof Error?e.message:'No se pudo solicitar','error');}finally{setSending(false);}}}>Solicitar nuevo ciclo</button></section>}
      <ProposalDetailView
        proposal={model}
        showEdit={canEdit && (isDraft||isCorrection)}
        editTo={`/propuestas/nueva?edit=${detail.id}`}
        showSend={canEdit && isDraft}
        sending={sending}
        onSend={() => void onEnviarBorrador()}
      />
      {session&&["admin","vie_publicacion"].includes(session.role)&&detail.etapaFlujo<=1&&!["aprobada","rechazada"].includes(detail.estadoActual)&&<CoordinacionEditor id={detail.id} onSaved={()=>navigate("/propuestas")}/>}
      <section className="card"><DocumentosPanel id={detail.id}/></section>
    </>
  );
}
