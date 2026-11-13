import type {CSSProperties} from "react";
import {ProposalFieldErrors} from "../components/ProposalFieldContext";
import {proposalIssues,type ProposalIssue} from "../data/proposalIssues";
import {todayCR} from "../data/convocatoriaUi";
import {DocumentosPanel} from "../components/DocumentosPanel";
import {downloadFile,apiJson} from "../api/client";
import seccionesSubsanacion from "../../../shared/subsanacion-secciones.json";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchConvocatorias, type Convocatoria } from "../api/convocatorias";
import {
  createPropuesta,
  enviarPropuesta,
  fetchPropuesta,
  patchPropuesta,
  type PropuestaDetalle,
} from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { FormWizardStepContent } from "../components/FormWizardStepContent";
import { WizardLineSteps } from "../components/WizardLineSteps";
import { useToast } from "../components/toast/ToastContext";
import {
  DEFAULT_FORM_WIZARD_STATE,
  FORM_WIZARD_STEPS,
  type FormWizardState,
} from "../data/formWizard";
import { FORM_META } from "../data/formMeta";
import { hydrateFormWizardFromDetalle } from "../data/hydrateFormWizard";
import { toIan } from "../data/formWizardAdapter";
import { FIELD_WORD_LIMITS, countWords } from "../data/textLimits";
import { canNavigateToStep } from "../data/wizardNavigation";

export function PropuestaNuevaPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdRaw = searchParams.get("edit");
  const editId = editIdRaw ? Number(editIdRaw) : NaN;
  const isEditing = Number.isFinite(editId);

  const canCreate =
    session?.role === "investigador" || session?.role === "admin";

  const [subsanacion,setSubsanacion]=useState<PropuestaDetalle["subsanacion"]>(null);
  const [respuesta,setRespuesta]=useState("");
  const [dirtySections,setDirtySections]=useState<number[]>([]);
  const [checkedSteps,setCheckedSteps]=useState<Record<number,boolean>>({});
  const [fontSize,setFontSize]=useState(16);
  const validationPanel=useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormWizardState>(DEFAULT_FORM_WIZARD_STATE);
  const [saveStatus, setSaveStatus] = useState(
    "Sin guardar",
  );
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [idConvocatoria, setIdConvocatoria] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [failure,setFailure]=useState<{title:string;message:string;savedCode?:string}|null>(null);
  const failurePanel=useRef<HTMLDivElement>(null);
  const stepHeadingRef=useRef<HTMLHeadingElement>(null);
  const previousStep=useRef(step);
  const [reload,setReload]=useState(0);
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  useEffect(()=>{if(failure&&!loadingEdit)failurePanel.current?.focus();},[failure,loadingEdit]);

  // Al avanzar de paso, el foco va al título del paso nuevo. Así el lector
  // anuncia «Paso X de 17 · <título>» en vez de dejar el foco en «Siguiente».
  useEffect(()=>{
    if(previousStep.current===step)return;
    previousStep.current=step;
    stepHeadingRef.current?.focus();
  },[step]);

  function reportFailure(reason:unknown,operation:'guardar'|'enviar',saved?:PropuestaDetalle){
    const network=reason instanceof ApiError&&reason.status===0||reason instanceof TypeError&&/fetch|network|load failed/i.test(reason.message);
    const message=network?'No se pudo confirmar la respuesta del servidor. Revise la conexión y compruebe el expediente antes de reintentar.':reason instanceof Error?reason.message:String(reason||'Ocurrió un error inesperado. Vuelva a intentarlo.');
    const conflict=reason instanceof ApiError&&reason.status===409;
    const title=saved?'El borrador se guardó, pero no se pudo enviar':`${conflict?'Conflicto':'Error'} al ${operation==='guardar'?'guardar el borrador':'enviar la propuesta'}`;
    setFailure({title,message,savedCode:saved?.codigo});
    setSaveStatus(saved?'Borrador guardado; envío pendiente':operation==='guardar'?'Guardado sin completar':'Envío sin completar');
    showToast(message,'error');
  }

  const ian=toIan(form);
  const allIssues=Object.entries(checkedSteps).flatMap(([s,full])=>proposalIssues(Number(s),ian,idConvocatoria!=="",!full));
  const fieldErrors=Object.fromEntries(allIssues.filter(i=>i.step===step).map(i=>[i.label,i.message]));
  const allowedSteps=subsanacion?seccionesSubsanacion.filter(s=>subsanacion.secciones.includes(s.codigo)).map(s=>s.paso):null;
  const correctedSteps=seccionesSubsanacion.filter(section=>subsanacion?.secciones.includes(section.codigo)&&section.campos.some(field=>subsanacion.campos_atendidos.includes(field))&&!dirtySections.includes(section.paso)&&proposalIssues(section.paso,ian,idConvocatoria!=='').length===0).map(section=>section.paso);
  const stepStates=FORM_WIZARD_STEPS.map((_,s)=>allIssues.some(i=>i.step===s)?'error':correctedSteps.includes(s)?'corrected':allowedSteps?.includes(s)?'pending':s<15&&proposalIssues(s,ian,idConvocatoria!=="").length===0?'complete':'pending');
  function goToIssue(issue:ProposalIssue){setStep(issue.step);requestAnimationFrame(()=>{const controls=Array.from(document.querySelectorAll<HTMLElement>('.wizard-body input,.wizard-body textarea,.wizard-body select,[data-proposal-label]'));const target=controls.find(e=>e.getAttribute('aria-label')===issue.label||e.dataset.proposalLabel===issue.label);target?.focus();target?.scrollIntoView({block:'center'});});}
  function showIssues(items:ProposalIssue[],full=true){if(!items.length)return false;setCheckedSteps(prev=>({...prev,...Object.fromEntries(items.map(i=>[i.step,full]))}));setStep(items[0].step);requestAnimationFrame(()=>validationPanel.current?.focus());return true;}
  function attemptStep(target:number){if(allowedSteps){setStep(target);return;}const issues=Array.from({length:target},(_,s)=>proposalIssues(s,toIan(form),idConvocatoria!=="")).flat();if(!showIssues(issues))setStep(target);}
  const progressPct = Math.round(stepStates.slice(0,15).filter(state=>state==='complete'||state==='corrected').length/15*100);

  useEffect(()=>{
    if(isEditing||!session)return;
    let active=true;
    apiJson<{id:number;instancia:string}[]>('/api/personas').then(rows=>{
      const own=rows.find(p=>p.id===session.userId);if(active&&own)setForm(f=>({...f,escuela:own.instancia??''}));
    }).catch(e=>{if(active)showToast(e.message,'error');});
    return()=>{active=false;};
  },[isEditing,session,showToast]);

  useEffect(() => {
    void (async () => {
      try {
        const rows = await fetchConvocatorias();
        const activas = rows.filter((c) => c.estado === "activa"&&c.fechaApertura<=todayCR()&&c.fechaCierre>=todayCR());
        setConvocatorias(isEditing?rows:activas);
        if (!isEditing) {
          if (activas[0]) setIdConvocatoria(activas[0].id);

        }
      } catch (err) {
        showToast(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar convocatorias",
          "error",
        );
      }
    })();
  }, [showToast, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    void (async () => {
      setLoadingEdit(true);
      try {
        const d = await fetchPropuesta(editId);
        if (!["borrador","en_subsanacion"].includes(d.estadoActual)) {
          showToast(
            "Solo se pueden editar propuestas en borrador",
            "error",
          );
          navigate(`/propuestas/${d.id}`, { replace: true });
          return;
        }
        setSubsanacion(d.subsanacion);
        setRespuesta(d.subsanacion?.respuesta??'');
        if(d.subsanacion){const targets=seccionesSubsanacion.filter(s=>d.subsanacion?.secciones.includes(s.codigo));setStep(current=>targets.some(s=>s.paso===current)?current:targets[0]?.paso??0);}
        setIdConvocatoria(d.idConvocatoria);
        setForm(hydrateFormWizardFromDetalle(d));
        setSaveStatus(reload>0?(d.subsanacion?'Correcciones guardadas en el servidor':'Borrador guardado en el servidor'):'Borrador cargado');
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "No se pudo cargar el borrador",
          "error",
        );
        navigate("/propuestas", { replace: true });
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [isEditing, editId, navigate, showToast,reload]);

  function patch(partial: Partial<FormWizardState>) {
    setForm((prev) => ({ ...prev, ...partial, ...(subsanacion?{q8:prev.q8}:{}) }));
    if(subsanacion)setDirtySections(previous=>previous.includes(step)?previous:[...previous,step]);
    setSaveStatus("Cambios sin guardar");
  }

  function draftPayload() {
    return {
      ...form.detallesFormulario,
      idConvocatoria:Number(idConvocatoria),
      trlActual:form.trlEsperado??form.trlActual,trlEsperado:form.trlEsperado,lineas:form.lineas,
      titulo: form.titulo.trim(),
      modalidad: form.modalidad,
      resumen: form.resumen.trim(),
      abstractEn: form.abstract.trim(),
      problema: form.problema.trim(),
      objetivoGeneral: form.objetivos.trim(),
      metodologia: form.metodologia.trim(),
      aspectosEticos: form.aspectosEticos, permisos: form.permisos,
      compromisos: form.compromisos,
      actividades: form.actividades,
      equipo: form.equipo, presupuesto: form.presupuesto, fuentes: form.fuentes,
      declaracion: form.declaracion, resguardoRepositorio: form.resguardoRepositorio, resguardoTecnico: form.resguardoTecnico,
      keywordsEs: form.palabras,
      keywordsEn: form.keywordsEn,
      estadoArte: form.estadoArte, referencias: form.referencias, hojaRuta: form.hojaRuta, divulgacion: form.divulgacion,
      fechaInicio: form.inicio, fechaFin: form.fin, requiereDictamenPi: form.q8 === "Sí",
      preguntasGenerales: Array.from({ length: 8 }, (_, i) => ({ numero: i + 1,
        respuesta: String(form[`q${i + 1}` as keyof FormWizardState]),
        detalle: i === 1 ? `${form.q2Proyecto}\n${form.q2Relacion}` : i === 2 ? form.q3Detalle : null })),
    };
  }

  async function persistDraft(stepsToSave?:number[]): Promise<PropuestaDetalle> {
    if (isEditing) {
      const payload=draftPayload();
      if(subsanacion) {
        const allowed=seccionesSubsanacion.filter(s=>subsanacion.secciones.includes(s.codigo)&&(!stepsToSave||stepsToSave.includes(s.paso))).flatMap(s=>s.campos);
        const changes=Object.fromEntries(Object.entries(payload).filter(([key])=>allowed.includes(key)));
        return patchPropuesta(editId,{...changes,respuestaSubsanacion:respuesta});
      }
      return patchPropuesta(editId,payload);
    }
    return createPropuesta({
      ...draftPayload(),
      idConvocatoria: Number(idConvocatoria),
    });
  }

  async function onSave(exit=false) {
    setFailure(null);
    if (!canCreate) {reportFailure('Ingresá como investigador para crear propuestas','guardar');return;}
    const sectionsToSave=allowedSteps?[...new Set([...dirtySections,...(allowedSteps.includes(step)?[step]:[])])]:undefined;
    const draftErrors=(sectionsToSave??Array.from({length:15},(_,i)=>i)).flatMap(s=>proposalIssues(s,toIan(form),idConvocatoria!=='',!subsanacion));
    if(showIssues(draftErrors,Boolean(subsanacion)))return;
    setSaving(true);
    setSaveStatus('Guardando…');
    try {
      const saved = await persistDraft(sectionsToSave);
      if(subsanacion){if(saved.subsanacion!==undefined)setSubsanacion(saved.subsanacion);setDirtySections([]);}
      setSaveStatus(subsanacion?'Correcciones guardadas en el servidor':'Borrador guardado en el servidor');
      showToast(subsanacion?'Correcciones guardadas':'Borrador guardado', 'success');
      if(isEditing&&!exit)setReload(r=>r+1);
      navigate(exit?`/propuestas/${saved.id}`:`/propuestas/nueva?edit=${saved.id}`, { replace: true });
    } catch (err) {
      reportFailure(err,'guardar');
    } finally {
      setSaving(false);
    }
  }

  /** Guardar y enviar son operaciones distintas: un fallo de envío conserva el borrador creado. */
  async function onEnviar() {
    setFailure(null);
    if (!canCreate) {reportFailure('Ingresá como investigador para enviar propuestas','enviar');return;}
    if(showIssues((allowedSteps??Array.from({length:15},(_,i)=>i)).flatMap(s=>proposalIssues(s,toIan(form),idConvocatoria!==''))))return;
    if(subsanacion&&!respuesta.trim()){reportFailure('Explique cómo atendió las observaciones antes de reenviar.','enviar');return;}
    if (!form.titulo.trim() || idConvocatoria === '') {reportFailure('Complete el nombre del proyecto y seleccione una convocatoria antes de enviar.','enviar');return;}
    if(!subsanacion&&!form.abstract.trim()){reportFailure('Resumen y palabras clave: complete el abstract en inglés. Las keywords EN son opcionales.','enviar');return;}
    const count = countWords(form.resumen);
    const terms = form.palabras.split(',').map(w => w.trim()).filter(Boolean);
    if(!subsanacion&&count>FIELD_WORD_LIMITS.resumen){reportFailure(`Resumen: contiene ${count} palabras y el máximo permitido es ${FIELD_WORD_LIMITS.resumen}. Reduzca su extensión.`,'enviar');return;}
    if(!subsanacion&&(terms.length<4||terms.length>6)){reportFailure(`Palabras clave en español: se requieren de 4 a 6 términos; actualmente hay ${terms.length}.`,'enviar');return;}
    if (!subsanacion&&!form.declaracion) {reportFailure('Declaración jurada: debe aceptar el compromiso antes de enviar.','enviar');return;}
    setSaving(true);
    setSaveStatus('Guardando antes de enviar…');
    let saved:PropuestaDetalle|undefined;
    try {
      saved = await persistDraft();
      setSaveStatus('Borrador guardado; enviando…');
      const sent = await enviarPropuesta(saved.id,subsanacion?respuesta:undefined);
      showToast(`Propuesta ${sent.codigo} enviada a revisión`, 'success');
      navigate(`/propuestas/${sent.id}`, { replace: true });
    } catch (err) {
      reportFailure(err,saved?'enviar':'guardar',saved);
      // Permite corregir/reintentar sobre el mismo registro si el primer envío falla.
      if(saved&&!isEditing)navigate(`/propuestas/nueva?edit=${saved.id}`,{replace:true});
    } finally {
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <section className="card">
        <h1>Nueva propuesta</h1>
        <p>Esta acción requiere el rol Investigador (o admin).</p>
        <Link to="/propuestas" className="btn btn-secondary">
          Volver
        </Link>
      </section>
    );
  }

  if (loadingEdit) {
    return (
      <section className="card" aria-busy="true">
        <h1 className="sr-only">Cargando propuesta</h1>
        <p role="status" aria-live="polite">
          Cargando borrador…
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>{isEditing ? "Editar borrador" : "Nueva"}</span>
      </div>

      {failure&&<div ref={failurePanel} role="alert" tabIndex={-1} className="card stack-md" aria-labelledby="proposal-failure-title" style={{marginBottom:18,borderLeft:'4px solid var(--danger, #a51d2d)'}}>
        <h2 id="proposal-failure-title">{failure.title}</h2>
        <p style={{whiteSpace:'pre-wrap'}}>{failure.message}</p>
        {failure.savedCode&&<p>El expediente <strong>{failure.savedCode}</strong> conserva el borrador. Corrija lo indicado y vuelva a intentar el envío.</p>}
        <p>Los datos ingresados permanecen en el formulario. Este aviso corresponde al último intento.</p>
      </div>}
      {allIssues.length>0&&<div className="card feedback-error stack-md" ref={validationPanel} role="alert" tabIndex={-1}>
        <h2>Revise los campos indicados</h2><p>Corrija estos datos antes de continuar. La información escrita se conserva.</p>
        <ul>{allIssues.map((issue,i)=><li key={`${issue.step}-${issue.label}-${i}`}><button className="btn btn-ghost" type="button" onClick={()=>goToIssue(issue)}>{FORM_WIZARD_STEPS[issue.step]} · {issue.label}: {issue.message}</button></li>)}</ul>
      </div>}
      <div className="wizard-layout wizard-layout-wide">
        <aside className="wizard-sidebar">
          <div className="wizard-progress-head">
            <span>Progreso</span>
            <strong>{progressPct}%</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Avance del formulario"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${progressPct}% del formulario completado`}
          >
            <div style={{ width: `${progressPct}%` }} />
          </div>
          <details className="wizard-index" open><summary>Secciones del formulario</summary><WizardLineSteps
            steps={FORM_WIZARD_STEPS}
            states={stepStates} markedSteps={allowedSteps??undefined}
            step={step}
            canSelect={(i) =>
              Boolean(subsanacion)||canNavigateToStep(
                i,
                step,
                toIan(form),
                idConvocatoria !== "",
              )
            }
            onBlockedSelect={attemptStep}
            onSelect={target=>target>step?attemptStep(target):setStep(target)}
          /></details>
        </aside>

        <section className="card wizard-card" style={{"--proposal-reading-size":`${fontSize}px`} as CSSProperties}>
          <div className="wizard-card-head institutional-form-head">
            <div>
              <span className="eyebrow">
                {FORM_META.shortLabel} · Paso {step + 1} de{" "}
                {FORM_WIZARD_STEPS.length}
              </span>
              <h1 className="sr-only">
                {subsanacion ? "Subsanar propuesta" : isEditing ? "Editar borrador de propuesta" : "Nueva propuesta de investigación"}
              </h1>
              <h2 ref={stepHeadingRef} tabIndex={-1}>
                {FORM_WIZARD_STEPS[step]}
              </h2>
            </div>
            <div className="form-code">
              <strong>{FORM_META.code}</strong>
              <span role="status" aria-live="polite">
                {saveStatus}
              </span>
            </div>
          </div>

          <div className="action-row" aria-label="Tamaño del texto"><button type="button" className="btn btn-secondary" disabled={fontSize<=14} onClick={()=>setFontSize(v=>v-2)}>Reducir letra</button><button type="button" className="btn btn-secondary" disabled={fontSize>=24} onClick={()=>setFontSize(v=>v+2)}>Ampliar letra</button></div>
          {subsanacion && <div className="stack-md correction-guide" role="note"><p><strong>Subsanación para {subsanacion.instancia}:</strong> {subsanacion.motivo}</p><p>Rojo: corrección pendiente o error. Azul: corrección guardada y validada en el formulario; no implica aprobación de la instancia. Verde: sección completa. Al modificar una corrección guardada vuelve a quedar pendiente.</p><div className="action-row">{seccionesSubsanacion.filter(s=>subsanacion.secciones.includes(s.codigo)).map(s=><button key={s.codigo} type="button" aria-label={s.etiqueta} className={`btn btn-secondary ${correctedSteps.includes(s.paso)?"correction-saved":"correction-pending"}`} onClick={()=>setStep(s.paso)}>{s.etiqueta} · {correctedSteps.includes(s.paso)?"Guardada y validada":"Pendiente de corrección"}</button>)}</div><p>Edite únicamente: {seccionesSubsanacion.filter(s=>subsanacion.secciones.includes(s.codigo)).map(s=>s.etiqueta).join(", ")}.</p>
            <label className="field"><span className="field-label">Respuesta a las observaciones</span><textarea aria-label="Respuesta a las observaciones" className="input textarea" maxLength={5000} value={respuesta} onChange={e=>setRespuesta(e.target.value)} required /></label></div>}
          <fieldset style={{border:0,padding:0,margin:0,minWidth:0}}>
          {(step===7||step===15)&&<div className="action-row"><button type="button" className="btn btn-secondary" onClick={()=>void downloadFile('/api/plantillas/presupuesto','Presupuesto-VIE-2027.xlsx').catch(e=>showToast(e.message,'error'))}>Descargar plantilla oficial de presupuesto</button></div>}
          <ProposalFieldErrors.Provider value={fieldErrors}><div className="wizard-body" style={{fontSize,"--proposal-reading-size":`${fontSize}px`} as CSSProperties}>
            <FormWizardStepContent
              bloquearIdentificacion={Boolean(subsanacion)}
              readOnly={Boolean(subsanacion)&&step!==16&&!allowedSteps?.includes(step)}
              documentos={isEditing?<DocumentosPanel id={editId} editable/>:undefined}
              step={step}
              form={form}
              patch={patch}
              convocatorias={convocatorias}
              idConvocatoria={idConvocatoria}
              setIdConvocatoria={subsanacion?()=>{}:setIdConvocatoria}
            />
          </div></ProposalFieldErrors.Provider>

          </fieldset>
          {isEditing&&<Link className="btn btn-ghost" aria-disabled={saving} onClick={e=>{if(saving)e.preventDefault();}} to={`/propuestas/${editId}`}>Ver expediente guardado</Link>}
          {subsanacion&&<p className="field-hint">Guardar correcciones valida y confirma las secciones modificadas. Si falta un dato, se señala y la sección sigue pendiente.</p>}
          <div className="wizard-footer">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Anterior
            </button>
            <div className="wizard-footer-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={() => void onSave()}
              >
                {subsanacion?"Guardar correcciones":"Guardar borrador"}
              </button>
              {step < FORM_WIZARD_STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if(step<15&&(!allowedSteps||allowedSteps.includes(step))){const issues=proposalIssues(step,toIan(form),idConvocatoria!=="");if(showIssues(issues))return;setCheckedSteps(prev=>({...prev,[step]:true}));}
                    setStep((s) =>
                      Math.min(FORM_WIZARD_STEPS.length - 1, s + 1),
                    );
                  }}
                >
                  Siguiente
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={saving}
                    onClick={() => void onSave(true)}
                  >
                    Guardar y salir
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={() => void onEnviar()}
                  >
                    {subsanacion?`Reenviar a ${subsanacion.instancia}`:"Enviar a revisión"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
