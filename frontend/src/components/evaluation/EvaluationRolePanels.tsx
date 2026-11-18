import {CieRespaldo,type RespaldoCie} from "./CieRespaldo";
import {DireccionRespaldo,type ComunicacionAval} from "./DireccionRespaldo";
import {DocumentosPanel} from "../DocumentosPanel";
import {ConsejoRespaldo} from "./ConsejoRespaldo";
import {VinculacionResumen} from "./VinculacionResumen";
import consejoTextLimits from "../../../../shared/consejo-text-limits.json";
import {WordBudget} from "../WordBudget";
import {ConsejoReconsideracion} from "./ConsejoReconsideracion";
import {ComiteConsolidado} from "./ComiteConsolidado";
import vieItems from "../../../../shared/checklist-vie.json";
import { apiJson } from "../../api/client";
import { useEffect, useState } from "react";
import type { DemoProposal } from "../../data/demo";
import { IconFile, IconShield } from "../icons";
import { ProcessTimeline } from "../ProcessTimeline";
import { CaseFile } from "./CaseFile";
import { SimpleModal } from "./SimpleModal";
import { RubricPanel } from "./RubricPanel";
import { PanelIntro, SeccionesDevueltas, CheckIcon, type ActionHandler } from "./panelShared";
export { VinculacionPanel } from "./VinculacionPanel";

export function ComiteAsistentePanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const initial = Object.fromEntries(
    (proposal.documentos.length
      ? proposal.documentos
      : [{ nombre: "Revisión de completitud del expediente", estado: "Pendiente" }]
    ).map((d) => [
      d.nombre,
      d.estado === "Completo" || d.estado === "No requerido",
    ]),
  );
  const [checks, setChecks] = useState(initial);
  const [returnOpen, setReturnOpen] = useState(false);
  const [secciones,setSecciones]=useState<string[]>([]);
  const [motivo, setMotivo] = useState(
    "Falta completar documentación requerida por el Comité Técnico.",
  );
  const [enviado,setEnviado]=useState(false),[checking,setChecking]=useState(true),[statusError,setStatusError]=useState(''),[sending,setSending]=useState(false);
  useEffect(()=>{let active=true;setChecking(true);apiJson<{enviado:boolean}>(`/api/evaluaciones/propuestas/${proposal.numericId}/comite`).then(d=>{if(active)setEnviado(d.enviado);}).catch(e=>{if(active)setStatusError(e.message);}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[proposal.numericId]);
  const allOk =
    Object.keys(checks).length > 0 && Object.values(checks).every(Boolean);

  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Checklist de completitud"
          description="Verifique la documentación formal antes de iniciar la evaluación técnica."
        />
        {enviado&&proposal.numericId&&<ComiteConsolidado id={proposal.numericId} confirm={texto=>onAction("committee-confirm",{texto})}/>}
        {statusError&&<p role="alert">{statusError}</p>}
        {checking?<p role="status">Consultando estado de recepción…</p>:<p role="status" className={enviado?'badge badge-success':'badge'}>{enviado?'Enviada al Cuerpo Evaluador · recepción completada':'Pendiente de revisión de completitud'}</p>}
        {enviado&&<p>La propuesta está en evaluación técnica. Aquí puede dar seguimiento a las evaluaciones y confirmar su consolidado cuando estén completas.</p>}
        <div className="checklist" role="group" aria-label="Checklist de completitud">
          {Object.entries(checks).map(([name, ok]) => (
            <label key={name} className="check-row">
              <input
                type="checkbox"
                checked={ok}
                disabled={enviado||checking||Boolean(statusError)||sending}
                onChange={() =>
                  setChecks((c) => ({ ...c, [name]: !c[name] }))
                }
              />
              {ok ? <CheckIcon /> : <span className="custom-check" />}
              <div>
                <strong>{name}</strong>
                <span>{ok ? "Verificado" : "Falta verificar"}</span>
              </div>
            </label>
          ))}
        </div>
        {!enviado&&<div className="action-row">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={checking||Boolean(statusError)||sending}
            onClick={() => setReturnOpen(true)}
          >
            Devolver con observaciones
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allOk||checking||Boolean(statusError)||sending}
            onClick={async () => {
              if (sending || !allOk) return;
              setSending(true);
              try {
                if (
                  await onAction("committee-ready", {
                    checks,
                    completitudConfirmada: true,
                  })
                ) {
                  setEnviado(true);
                }
              } finally {
                setSending(false);
              }
            }}
          >
            {sending?"Enviando…":"Enviar a evaluación"}
          </button>
        </div>}
        <SimpleModal
          open={returnOpen&&!enviado}
          title="Devolver propuesta"
          description="Registre claramente los faltantes que debe atender la persona investigadora."
          onClose={() => setReturnOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setReturnOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  if (!await onAction("return", { texto: motivo, secciones })) return;
                  setReturnOpen(false);
                }}
              >
                Devolver propuesta
              </button>
            </>
          }
        >
          <SeccionesDevueltas value={secciones} onChange={setSecciones}/>
          <label className="field">
            <span className="field-label">Motivo</span>
            <textarea
              aria-label="Motivo"
              className="input textarea"
              rows={5}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
        </SimpleModal>
      </article>
    </div>
  );
}

export function ComiteEvaluadorPanel(props: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  return <RubricPanel {...props} />;
}

export function CiePanel(props: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  return <RubricPanel {...props} cie />;
}

export function ConsejoAsistentePanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const [texto,setTexto]=useState(''),[sending,setSending]=useState(false);
  return <div className="split-review council-assistant-workspace"><CaseFile proposal={proposal}/><article className="card review-panel"><PanelIntro title="Preparar expediente para sesión" description="Consulte el expediente y sus respaldos antes de remitir. La aprobación o rechazo del aval corresponde al Consejo de profesores."/>
    {proposal.numericId&&<><ConsejoRespaldo id={proposal.numericId}/><VinculacionResumen id={proposal.numericId}/></>}
    <label className="field"><span className="field-label">Referencia de sesión o nota de remisión</span><small>Opcional: indique la sesión si ya se conoce o una nota de preparación. No asigna una fecha ni constituye un aval.</small><textarea aria-label="Referencia de sesión o nota de remisión" className="input textarea" value={texto} maxLength={consejoTextLimits.remision} aria-describedby="consejo-remision-budget" onChange={e=>setTexto(e.target.value)}/><WordBudget id="consejo-remision-budget" value={texto} maxWords={consejoTextLimits.remision} unit="caracteres"/></label>
    <button type="button" className="btn btn-primary" disabled={sending||proposal.estado!=='Dictaminada'} onClick={async()=>{if(sending)return;setSending(true);try{await onAction('send-council',{texto});}finally{setSending(false);}}}>{sending?'Enviando…':'Enviar al Consejo'}</button>
  </article></div>;
}

export function ConsejoPanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const avg = proposal.evaluacionComite?.average;
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [approveText, setApproveText] = useState("");

  if(proposal.estado==='Aval rechazado'&&proposal.numericId)return <div className="split-review"><CaseFile proposal={proposal}/><ConsejoReconsideracion id={proposal.numericId} onAction={onAction}/></div>;
  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        {proposal.numericId&&<><ConsejoRespaldo id={proposal.numericId}/><VinculacionResumen id={proposal.numericId}/><DocumentosPanel id={proposal.numericId}/></>}
        <PanelIntro
          title="Decisión del Consejo de Profesores"
          description="Revise el expediente consolidado, la evaluación del Comité y los oficios de respaldo."
        />
        <div className="decision-score">
          <span>Calificación consolidada del Comité</span>
          <strong>{avg == null ? "Sin nota registrada" : `${avg}%`}</strong>
        </div>
        <div className="document-list compact">
          <div className="document-row">
            <IconFile size={18} />
            <div>
              <strong>Oficio del Comité Técnico</strong>
              <span>{proposal.oficioComite || "Sin oficio registrado"}</span>
            </div>
            <span className="badge">{proposal.oficioComite?"Número registrado":"Pendiente"}</span>
          </div>
          <div className="document-row">
            <IconShield size={18} />
            <div>
              <strong>Dictamen de Propiedad Intelectual</strong>
              <span>
                {proposal.piRequired
                  ? proposal.oficioPI || "Sin dictamen registrado"
                  : proposal.piAcreditada ? "No requerido (certificado)" : "Falta certificación"}
              </span>
            </div>
            <span className="badge">{proposal.piAcreditada?"Verificado":"Pendiente"}</span>
          </div>
        </div>
        {proposal.justificacionAval && (
          <div className="justification-box">
            <strong>Justificación de aval registrada</strong>
            <p>{proposal.justificacionAval}</p>
          </div>
        )}
        <div className="action-row">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={Boolean(proposal.oficioAval)||proposal.estado==='Avalada'}
            onClick={() => setRejectOpen(true)}
          >
            Rechazar aval
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={Boolean(proposal.oficioAval)||proposal.estado==='Avalada'}
            onClick={() => setApproveOpen(true)}
          >
            Aprobar aval
          </button>
        </div>
        <SimpleModal
          open={rejectOpen}
          title="Rechazar aval"
          description="El rechazo detendrá el avance de la propuesta hacia VIE."
          onClose={() => setRejectOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!rejectText.trim()}
                title={
                  rejectText.trim()
                    ? "Registrar rechazo de aval"
                    : "Escriba la justificación para habilitar Confirmar"
                }
                onClick={async () => {
                  if (!await onAction("council-reject", {
                    texto: rejectText.trim(),
                  })) return;
                  setRejectOpen(false);
                  setRejectText("");
                }}
              >
                Confirmar rechazo
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">
              Justificación del rechazo (obligatoria)
            </span>
            <textarea
              aria-label="Justificación del rechazo" maxLength={4000} aria-describedby="consejo-rechazo-budget" className="input textarea"
              rows={5}
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
              required
            /><WordBudget id="consejo-rechazo-budget" value={rejectText} maxWords={4000} unit="caracteres"/>
          </label>
          {!rejectText.trim() && (
            <p className="field-hint" role="status">
              Escriba la justificación para habilitar «Confirmar rechazo».
            </p>
          )}
        </SimpleModal>
        <SimpleModal
          open={approveOpen}
          title="Aprobar aval"
          description={`Propuesta ${proposal.id} · Registre la justificación de la aprobación.`}
          onClose={() => setApproveOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApproveOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!approveText.trim()}
                title={
                  approveText.trim()
                    ? "Registrar aval aprobatorio"
                    : "Escriba la justificación para habilitar Confirmar"
                }
                onClick={async () => {
                  if (!await onAction("council-approve", {
                    texto: approveText.trim(),
                  })) return;
                  setApproveOpen(false);
                  setApproveText("");
                }}
              >
                Confirmar aprobación
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">
              Justificación de la aprobación (obligatoria)
            </span>
            <textarea
              aria-label="Justificación de la aprobación" maxLength={4000} aria-describedby="consejo-aprobacion-budget" className="input textarea"
              rows={5}
              value={approveText}
              onChange={(e) => setApproveText(e.target.value)}
              placeholder="Explique por qué se otorga el aval..."
              required
            /><WordBudget id="consejo-aprobacion-budget" value={approveText} maxWords={4000} unit="caracteres"/>
          </label>
          {!approveText.trim() && (
            <p className="field-hint" role="status">
              Escriba la justificación para habilitar «Confirmar aprobación».
            </p>
          )}
        </SimpleModal>
      </article>
    </div>
  );
}

export function DireccionEscuelaPanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const [record,setRecord]=useState<ComunicacionAval|null>(null),[confirm,setConfirm]=useState(false),[sending,setSending]=useState(false);
  const eligible=proposal.estado==='Avalada'&&record&&Boolean(record.numero_oficio?.trim())&&!record.comunicado&&['aprueba','aprobado'].includes(record.resultado??'');
  return <div className="split-review council-assistant-workspace"><CaseFile proposal={proposal}/><article className="card review-panel"><PanelIntro title="Comunicar aval a VIE" description="Dirección registra la comunicación del aval aprobado por el Consejo para que VIE verifique el expediente."/>
   <p>{proposal.escuela}</p>
   {proposal.numericId&&<><DireccionRespaldo id={proposal.numericId} onLoad={setRecord}/><ConsejoRespaldo id={proposal.numericId}/><VinculacionResumen id={proposal.numericId}/><DocumentosPanel id={proposal.numericId}/></>}
   <button type="button" className="btn btn-primary" disabled={!eligible||sending} onClick={()=>setConfirm(true)}>Registrar comunicación del aval a VIE</button>
   <SimpleModal open={confirm} title="Registrar comunicación del aval a VIE" description="Confirme el registro. El expediente saldrá de pendientes de Dirección y quedará disponible para verificación VIE." onClose={()=>{if(!sending)setConfirm(false);}} footer={<><button type="button" className="btn btn-secondary" disabled={sending} onClick={()=>setConfirm(false)}>Cancelar</button><button type="button" className="btn btn-primary" disabled={sending||!eligible} onClick={async()=>{if(sending)return;setSending(true);try{if(await onAction('communicate-aval'))setConfirm(false);}finally{setSending(false);}}}>{sending?'Registrando…':'Confirmar comunicación'}</button></>}><p>Oficio: {record?.numero_oficio??'Pendiente de consulta'}</p><p>Destinatario: Vicerrectoría de Investigación y Extensión.</p></SimpleModal>
  </article></div>;
}

export function GestoraViePanel({proposal,onAction}:{proposal:DemoProposal;onAction:ActionHandler}) {
  const initial=Object.fromEntries(vieItems.map(item=>[item.codigo,proposal.vieChecks?.[item.codigo]??false]));
  const [checks,setChecks]=useState(initial),[saved,setSaved]=useState(initial),[saving,setSaving]=useState(false);
  const [readingPane,setReadingPane]=useState<'case'|'rubric'|'both'>('both');
  const [obs,setObs]=useState(''),[secciones,setSecciones]=useState<string[]>([]),[confirm,setConfirm]=useState(false);
  const allOk=vieItems.every(item=>checks[item.codigo]);
  const dirty=vieItems.some(item=>checks[item.codigo]!==saved[item.codigo]);
  async function save(next:Record<string,boolean>){if(saving)return;setSaving(true);try{if(await onAction('vie-checklist',{checks:next})){setSaved({...next});}}finally{setSaving(false);}}
  return <div className={`split-review evaluator-workspace evaluator-pane-${readingPane}`}>
    <div className="card evaluator-reading-tools" aria-label="Distribución de lectura"><button type="button" className="btn btn-secondary" aria-pressed={readingPane==='case'} onClick={()=>setReadingPane(readingPane==='case'?'both':'case')}>Ampliar expediente</button><button type="button" className="btn btn-secondary" aria-pressed={readingPane==='rubric'} onClick={()=>setReadingPane(readingPane==='rubric'?'both':'rubric')}>Ampliar verificación</button><button type="button" className="btn btn-secondary" onClick={()=>setReadingPane('both')}>Mostrar ambos paneles</button></div>
    <aside className="rubric-case"><details open className="evaluator-proposal-details"><summary>Información de la propuesta</summary><div className="evaluator-proposal-scroll" tabIndex={0} aria-label="Información desplazable de la propuesta"><CaseFile proposal={proposal}/></div></details></aside>
    <article className="card review-panel rubric-main"><PanelIntro title="Verificación VIE" description="Revise cada respaldo y guarde su verificación antes de remitir el expediente al CIE. VIE verifica y solicita subsanaciones; la resolución corresponde al CIE."/>
    <div className="evaluation-progress" role="status"><strong>Requisitos verificados y guardados: {vieItems.filter(item=>saved[item.codigo]).length} de {vieItems.length}</strong><progress aria-label="Progreso de verificación VIE" max={vieItems.length} value={vieItems.filter(item=>saved[item.codigo]).length}/></div>
    {vieItems.map(item=><details key={item.codigo} className="vie-document-review"><summary><span className="vie-review-title">{item.etiqueta}</span><span className="vie-review-status">{checks[item.codigo]!==saved[item.codigo]?'Cambios sin guardar':saved[item.codigo]?'Verificación guardada':'Pendiente de verificar'}</span></summary><div className="stack-md">
      {item.codigo==='propuesta'&&<p>Use «Abrir expediente completo» para consultar todas las secciones, el presupuesto estructurado y sus anexos; al volver conservará la propuesta seleccionada.</p>}
      {proposal.numericId&&item.codigo==='pi'&&<VinculacionResumen id={proposal.numericId}/>}
      {proposal.numericId&&item.codigo==='evaluacion_comite'&&<ConsejoRespaldo id={proposal.numericId}/>}
      {proposal.numericId&&item.codigo==='oficio_comite'&&<ConsejoRespaldo id={proposal.numericId}/>}
      {proposal.numericId&&item.codigo==='aval'&&<DireccionRespaldo id={proposal.numericId}/>}
      {proposal.numericId&&item.codigo==='respaldos'&&<DocumentosPanel id={proposal.numericId}/>}
      <div className="vie-review-confirmation">
        <fieldset className="vie-review-choice" aria-label={`Verificar: ${item.etiqueta}`} disabled={saving}>
          <legend>Revisión confirmada</legend>
          <div className="vie-review-options">{[false,true].map(value=><label key={String(value)}><input type="radio" name={`vie-revision-${item.codigo}`} checked={checks[item.codigo]===value} onChange={()=>setChecks(prev=>({...prev,[item.codigo]:value}))}/><span>{value?'Sí':'No'}</span></label>)}</div>
        </fieldset>
        <button type="button" className="btn btn-secondary" aria-label={`Guardar revisión de ${item.etiqueta}`} disabled={saving||checks[item.codigo]===saved[item.codigo]} onClick={()=>void save({...saved,[item.codigo]:checks[item.codigo]})}>Guardar revisión</button>
      </div>
    </div></details>)}
    <button type="button" className="btn btn-secondary" disabled={saving||!dirty} onClick={()=>void save({...checks})}>{saving?'Guardando verificación…':'Guardar verificación'}</button>
    <p className="field-hint" role="status">{dirty?'Verificación con cambios sin guardar.':'La remisión requiere guardar todos los requisitos verificados. Las marcas guardadas se conservan al volver.'}</p>
    <label className="field"><span className="field-label">Comentario o motivo de devolución</span><textarea aria-label="Comentario o motivo de devolución" className="input textarea" rows={5} value={obs} maxLength={4000} aria-describedby="vie-observacion-budget" onChange={e=>setObs(e.target.value)} placeholder="Indique qué encontró y qué debe corregirse…"/><WordBudget id="vie-observacion-budget" value={obs} maxWords={4000} unit="caracteres"/></label>
    <SeccionesDevueltas value={secciones} onChange={setSecciones}/>
    <div className="action-row"><button type="button" className="btn btn-secondary btn-observation" disabled={saving||!obs.trim()} onClick={async()=>{if(await onAction('vie-observation',{texto:obs}))setObs('');}}>Enviar comentario sin devolución</button><button type="button" className="btn btn-secondary" disabled={saving||!obs.trim()||!secciones.length} onClick={()=>onAction('return',{texto:obs,secciones,instancia:'vie'})}>Devolver para subsanación en VIE</button><button type="button" className="btn btn-primary" disabled={saving||dirty||!allOk} onClick={()=>setConfirm(true)}>Enviar al CIE</button></div>
    <SimpleModal open={confirm} title="Remitir expediente al CIE" description="Se enviará el expediente con su verificación completa. Saldrá de pendientes VIE y quedará disponible para resolución del CIE." onClose={()=>setConfirm(false)} footer={<><button type="button" className="btn btn-secondary" onClick={()=>setConfirm(false)}>Cancelar</button><button type="button" className="btn btn-primary" disabled={saving||dirty||!allOk} onClick={async()=>{if(await onAction('send-cie'))setConfirm(false);}}>Confirmar remisión al CIE</button></>}><p>Se conservarán los seis requisitos verificados en el expediente.</p></SimpleModal>
    </article></div>;
}

export function DireccionInvestigacionPanel({proposal,onAction}:{proposal:DemoProposal;onAction:ActionHandler}) {
  const [record,setRecord]=useState<RespaldoCie|null>(null),[confirm,setConfirm]=useState(false),[sending,setSending]=useState(false);
  const [readingPane,setReadingPane]=useState<'case'|'rubric'|'both'>('both');
  const eligible=Boolean(record?.resolucion&&!record.notificacion&&!proposal.notificada);
  return <div className={`split-review evaluator-workspace evaluator-pane-${readingPane}`}>
    <div className="card evaluator-reading-tools" aria-label="Distribución de lectura"><button type="button" className="btn btn-secondary" aria-pressed={readingPane==='case'} onClick={()=>setReadingPane(readingPane==='case'?'both':'case')}>Ampliar expediente</button><button type="button" className="btn btn-secondary" aria-pressed={readingPane==='rubric'} onClick={()=>setReadingPane(readingPane==='rubric'?'both':'rubric')}>Ampliar notificación</button><button type="button" className="btn btn-secondary" onClick={()=>setReadingPane('both')}>Mostrar ambos paneles</button></div>
    <aside className="rubric-case"><details open className="evaluator-proposal-details"><summary>Información de la propuesta</summary><div className="evaluator-proposal-scroll" tabIndex={0} aria-label="Información desplazable de la propuesta"><CaseFile proposal={proposal}/></div></details></aside>
    <article className="card review-panel rubric-main"><PanelIntro title="Notificación formal de resolución" description="Dirección de Investigación comunica la aprobación o el rechazo emitido por CIE. La decisión y su fundamento se consultan en solo lectura."/>
    <p>Persona destinataria: {proposal.investigadora} · {proposal.coordinadorCorreo||'Sin correo registrado'}</p>
    {proposal.numericId&&<><CieRespaldo id={proposal.numericId} onLoad={setRecord}/><details className="vie-document-review"><summary>Evaluación y oficio del Comité Técnico</summary><ConsejoRespaldo id={proposal.numericId}/></details><details className="vie-document-review"><summary>Dictamen de Propiedad Intelectual</summary><VinculacionResumen id={proposal.numericId}/></details><details className="vie-document-review"><summary>Aval del Consejo y comunicación a VIE</summary><DireccionRespaldo id={proposal.numericId}/></details><details className="vie-document-review"><summary>Archivos del expediente</summary><DocumentosPanel id={proposal.numericId}/></details></>}
    <button type="button" className="btn btn-primary" disabled={!eligible||sending} onClick={()=>setConfirm(true)}>Notificar resolución</button>
    <SimpleModal open={confirm} title="Confirmar notificación de resolución" description="Se registrará una notificación interna para la persona coordinadora y el expediente saldrá de pendientes. El resultado del CIE se conserva." onClose={()=>{if(!sending)setConfirm(false);}} footer={<><button type="button" className="btn btn-secondary" disabled={sending} onClick={()=>setConfirm(false)}>Cancelar</button><button type="button" className="btn btn-primary" disabled={!eligible||sending} onClick={async()=>{if(sending)return;setSending(true);try{if(await onAction('notify-resolution'))setConfirm(false);}finally{setSending(false);}}}>{sending?'Notificando…':'Confirmar notificación'}</button></>}><p>Resolución: {record?.resolucion?.numero_resolucion}</p><p>Resultado: {record?.resolucion?.resultado==='rechazada'?'Rechazo':'Aprobación'}</p><p>Destinatario: {proposal.investigadora}</p><p>No se envía correo externo.</p></SimpleModal>
    </article></div>;
}

export function AdminEvalTransversal({
  proposal,
}: {
  proposal: DemoProposal;
}) {
  return (
    <article className="card stack-md">
      <PanelIntro
        title="Vista transversal"
        description="El Super Administrador no simula únicamente al investigador: use «Vista actual» en la barra superior para ingresar a cualquiera de las herramientas operativas."
      />
      <ProcessTimeline
        currentStep={proposal.etapa}
        piRequired={proposal.piRequired}
          piAcreditada={proposal.piAcreditada}
      />
      <div className="admin-stage-grid">
        {[
          "Vinculación",
          "Asistente Comité",
          "Evaluador Comité",
          "Asistente Consejo",
          "Consejo",
          "Dirección Escuela",
          "Gestora VIE",
          "CIE",
          "Dirección Investigación",
        ].map((role) => (
          <div key={role}>
            <strong>{role}</strong>
            <span>Disponible mediante cambio de vista</span>
          </div>
        ))}
      </div>
    </article>
  );
}
