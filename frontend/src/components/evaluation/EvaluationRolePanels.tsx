import {DireccionRespaldo,type ComunicacionAval} from "./DireccionRespaldo";
import {DocumentosPanel} from "../DocumentosPanel";
import {ConsejoRespaldo} from "./ConsejoRespaldo";
import {VinculacionResumen} from "./VinculacionResumen";
import consejoTextLimits from "../../../../shared/consejo-text-limits.json";
import comiteTextLimits from "../../../../shared/comite-text-limits.json";
import {Link} from "react-router-dom";
import {WordBudget} from "../WordBudget";
import piLimits from "../../../../shared/pi-text-limits.json";
import {ConsejoReconsideracion} from "./ConsejoReconsideracion";
import {ComiteConsolidado} from "./ComiteConsolidado";
import seccionesSubsanacion from "../../../../shared/subsanacion-secciones.json";
import vieItems from "../../../../shared/checklist-vie.json";
import { apiJson } from "../../api/client";
import {
  fetchEvaluacionIA,
  fetchSavedRubric,
  postEvaluacionIA,
  type EvaluacionIA,
} from "../../api/evaluaciones";
import { useEffect, useMemo, useState } from "react";
import type { DemoProposal } from "../../data/demo";
import {
  RUBRIC_SCORE_OPTIONS,
  getRubricForModalidad,
  getRubricSections,
} from "../../data/evaluationRubrics";
import { IconFile, IconShield } from "../icons";
import { ProcessTimeline } from "../ProcessTimeline";
import { CaseFile } from "./CaseFile";
import { SimpleModal } from "./SimpleModal";

function SeccionesDevueltas({value,onChange}:{value:string[];onChange:(value:string[])=>void}) {
  return <fieldset className="subsanacion-secciones"><legend>Secciones que debe corregir</legend>{seccionesSubsanacion.map(s=><label className="subsanacion-seccion" key={s.codigo}><input type="checkbox" checked={value.includes(s.codigo)} onChange={e=>onChange(e.target.checked?[...value,s.codigo]:value.filter(v=>v!==s.codigo))}/>{s.etiqueta}</label>)}</fieldset>;
}

function PanelIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="section-title" style={{ marginBottom: 16 }}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

type ActionHandler = (
  action: string,
  payload?: unknown,
) => Promise<boolean>;

function CheckIcon() {
  // Decorativo: el estado ya lo anuncia el texto "Verificado" / "Falta verificar".
  return (
    <span className="custom-check" aria-hidden="true">
      ✓
    </span>
  );
}

export function VinculacionPanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const [form, setForm] = useState({
    potencial:"",tipoActivo:"",tipoPI:"",innovacion:"",novedad:"",titularidad:"",divulgacion:"",confidencialidad:"",analisis:"",recomendaciones:"",oficio:"",fecha:"",
  });
  const [enRevision,setEnRevision]=useState(false);
  const [piEstado,setPiEstado]=useState<string|null>(null);
  const [fundamento,setFundamento]=useState("");
  const [loading, setLoading] = useState(Boolean(proposal.numericId));
  const [loadError, setLoadError] = useState("");
  useEffect(()=>{
    if(!proposal.numericId)return;
    let active=true;
    void apiJson<{form:typeof form|null;estado:string|null;fundamentoNoRequerido:string|null;enRevision?:boolean}>(`/api/evaluaciones/propuestas/${proposal.numericId}/pi`).then(data=>{if(active){if(data.form)setForm(data.form);setPiEstado(data.estado);setEnRevision(Boolean(data.enRevision));setFundamento(data.fundamentoNoRequerido??"");}})
      .catch(err=>{if(active)setLoadError(err instanceof Error?err.message:"No se pudo recuperar el dictamen");})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[proposal.numericId]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="pi-evaluation-workspace">
      <div className="card pi-review-link"><h2>{proposal.titulo}</h2><p>Consulte el expediente completo en una pantalla de lectura. Aquí se registra únicamente la revisión de PI.</p><Link className="btn btn-secondary" to={`/historico/${encodeURIComponent(proposal.id)}`}>Revisar expediente completo</Link></div>
      <article className="card review-panel">
        <PanelIntro
          title="Dictamen técnico de Propiedad Intelectual"
          description="Documento técnico del Centro de Vinculación. Su resultado se incorpora al expediente y el flujo continúa hacia el Comité Técnico."
        />
        <div className="pi-scope-note">
          <IconShield size={17} />
          <span>
            Este dictamen analiza el potencial y la gestión de PI.{" "}
            <strong>
              No sustituye la evaluación académica ni decide la aprobación
              general de la propuesta.
            </strong>
          </span>
        </div>
        {loadError && <p role="alert">{loadError}</p>}
        {loading && <p role="status">Recuperando dictamen…</p>}
        {!["emitido","no_requerido"].includes(piEstado??"")&&<p role="status">{enRevision?"En revisión de PI":"Pendiente de revisión de PI"}</p>}
        {!enRevision&&!loading&&!loadError&&!["emitido","no_requerido"].includes(piEstado??"")&&<button type="button" className="btn btn-secondary" onClick={async()=>{if(await onAction("pi-start"))setEnRevision(true);}}>Iniciar revisión de PI</button>}
        {piEstado && <p role="status">Registro PI: {piEstado}. Las decisiones emitidas no se sobrescriben.</p>}
        <fieldset className="stack-md" disabled={loading||Boolean(loadError)||["emitido","no_requerido"].includes(piEstado??"")} style={{border:0,padding:0,margin:0,minWidth:0}}>
          {!proposal.piRequired ? <div className="stack-md"><p>La propuesta declara que no requiere dictamen. Vinculación debe certificarlo antes de que el expediente avance.</p><label className="field"><span className="field-label">Fundamento de PI no requerido</span><textarea aria-label="Fundamento de PI no requerido" className="input textarea" maxLength={piLimits.fundamento} aria-describedby="pi-fundamento-budget" value={fundamento} onChange={e=>setFundamento(e.target.value)}/><WordBudget id="pi-fundamento-budget" value={fundamento} maxWords={piLimits.fundamento} unit="caracteres"/></label><button type="button" className="btn btn-primary" disabled={!fundamento.trim()} onClick={async()=>{if(await onAction("pi-not-required",{fundamento}))setPiEstado("no_requerido");}}>Certificar PI no requerido</button></div> : <>
          <div className="form-grid two-col">
            <label className="field">
              <span className="field-label">¿Existe potencial de protección?</span>
              <select
                className="input"
                value={form.potencial}
                onChange={(e) => set("potencial", e.target.value)}
              >
                <option value="" disabled>Seleccionar…</option>
                <option>No</option>
                <option>Sí</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">
                ¿El resultado se considera innovador?
              </span>
              <select
                className="input"
                value={form.innovacion}
                onChange={(e) => set("innovacion", e.target.value)}
              >
                <option value="" disabled>Seleccionar…</option>
                <option>No</option>
                <option>Sí</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">Resultado o activo identificable</span>
              <small id="pi-tipoActivo-help">Indique qué resultado podría protegerse: por ejemplo, software, prototipo o procedimiento. Si no aplica, indíquelo.</small>
              <input aria-label="Resultado o activo identificable" maxLength={piLimits.tipoActivo} aria-describedby="pi-tipoActivo-help pi-tipoActivo-budget"
                className="input"
                value={form.tipoActivo}
                onChange={(e) => set("tipoActivo", e.target.value)}
              /><WordBudget id="pi-tipoActivo-budget" value={form.tipoActivo} maxWords={piLimits.tipoActivo} unit="caracteres"/>
            </label>
            <label className="field">
              <span className="field-label">Mecanismo de PI considerado</span>
              <small id="pi-tipoPI-help">Indique la vía de protección considerada: patente, derecho de autor, secreto industrial u otra. Si no aplica o está por determinar, indíquelo.</small>
              <input aria-label="Mecanismo de PI considerado" maxLength={piLimits.tipoPI} aria-describedby="pi-tipoPI-help pi-tipoPI-budget"
                className="input"
                value={form.tipoPI}
                onChange={(e) => set("tipoPI", e.target.value)}
              /><WordBudget id="pi-tipoPI-budget" value={form.tipoPI} maxWords={piLimits.tipoPI} unit="caracteres"/>
            </label>
          </div>
          {(
            [
              ["novedad", "Novedad / elementos diferenciadores", 4],
              ["titularidad", "Titularidad y participación institucional", 3],
              [
                "divulgacion",
                "Recomendaciones antes de divulgación pública",
                3,
              ],
              [
                "confidencialidad",
                "Confidencialidad / información de terceros",
                3,
              ],
              ["analisis", "Análisis técnico", 5],
              [
                "recomendaciones",
                "Recomendaciones del Centro de Vinculación",
                4,
              ],
            ] as const
          ).map(([key, label, rows]) => (
            <label key={key} className="field">
              <span className="field-label">{label}</span>
              <textarea
                aria-label={label} maxLength={piLimits[key]} aria-describedby={`pi-${key}-budget`} className="input textarea"
                rows={rows}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              /><WordBudget id={`pi-${key}-budget`} value={form[key]} maxWords={piLimits[key]} unit="caracteres"/>
            </label>
          ))}
          <p className="pi-scope-note">El número de oficio y la fecha y hora de emisión se asignan automáticamente al emitir el dictamen. Podrá consultar todo el contenido registrado en el expediente.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {const {oficio: _oficio,fecha: _fecha,...contenido}=form;if(await onAction("pi", contenido))setPiEstado("emitido");}}
          >
            Emitir y registrar dictamen
          </button></>}
        </fieldset>
      </article>
    </div>
  );
}

export function ComiteAsistentePanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const initial = Object.fromEntries(
    proposal.documentos.map((d) => [
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
  const allOk = Object.values(checks).every(Boolean);

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
            onClick={async () => {if(sending)return;setSending(true);try{if(await onAction("committee-ready"))setEnviado(true);}finally{setSending(false);}}}
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

function RubricPanel({
  proposal,
  onAction,
  cie = false,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
  cie?: boolean;
}) {
  const [readingPane,setReadingPane]=useState<'both'|'case'|'rubric'>('both');
  const [sections,setSections]=useState(()=>getRubricSections(proposal.modalidad));
  const criteria=useMemo(()=>getRubricForModalidad(proposal.modalidad,sections),[proposal.modalidad,sections]);
  const [assigned,setAssigned]=useState(true);
  const [productRules,setProductRules]=useState<{minAcademicos:number;minPI:number;academicos:number;activosPI:number;cumple:boolean}|null>(null);
  const [cycle,setCycle]=useState(0);
  const [version,setVersion]=useState("Recuperando versión…");
  const [closed,setClosed]=useState(false),[products,setProducts]=useState(false);
  const [scores, setScores] = useState(() =>
    Object.fromEntries(
      criteria.map((c) => [
        c.id,
        {
          score: 0,
          reason: "",
        },
      ]),
    ),
  );

  const [loadingSaved, setLoadingSaved] = useState(Boolean(proposal.numericId));
  const [loadError, setLoadError] = useState("");
  const [ai, setAi] = useState<EvaluacionIA | null>(null);
  const [aiLoading, setAiLoading] = useState(Boolean(proposal.numericId) && !cie);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  useEffect(() => {
    if (!proposal.numericId) return;
    let active = true;
    void fetchSavedRubric(proposal.numericId,cie?"cie":"comite").then(data=>{
      if(active){setCycle(data.ciclo);setVersion(data.version);setAssigned(data.asignado);setSections(data.sections);setClosed(data.estado==='completada');setProductRules(data.productos);setProducts(data.productosVerificados);setScores(Object.fromEntries(getRubricForModalidad(proposal.modalidad,data.sections).map(c=>[c.id,data.scores[c.id]??{score:0,reason:''}])));}
    }).catch(err=>{ if(active) setLoadError(err instanceof Error?err.message:"No se pudo recuperar la evaluación"); })
      .finally(()=>{ if(active) setLoadingSaved(false); });
    return ()=>{active=false;};
  },[proposal.numericId,proposal.modalidad,cie]);
  useEffect(() => {
    if (cie || !proposal.numericId) { setAiLoading(false); return; }
    let active = true;
    setAiLoading(true);
    void fetchEvaluacionIA(proposal.numericId)
      .then((data) => { if (active) setAi(data.evaluacion); })
      .catch((err) => { if (active) setAiError(err instanceof Error ? err.message : "No se pudo consultar la sugerencia de IA"); })
      .finally(() => { if (active) setAiLoading(false); });
    return () => { active = false; };
  }, [proposal.numericId, cie]);
  const aiCriteria = useMemo(
    () => new Map((ai?.resultado.criterios ?? []).map((criterion) => [criterion.id, criterion])),
    [ai],
  );
  const applyAiSuggestions = () => {
    if (!ai) return;
    setScores((previous) => Object.fromEntries(criteria.map((criterion) => {
      const suggestion = aiCriteria.get(criterion.id);
      return [criterion.id, suggestion ? { score: suggestion.puntaje, reason: suggestion.justificacion } : previous[criterion.id]];
    })));
  };
  const generateAi = async () => {
    if (!proposal.numericId) return;
    setAiBusy(true);
    setAiError("");
    try {
      const data = await postEvaluacionIA(proposal.numericId);
      setAi(data.evaluacion);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "No se pudo generar la evaluación con IA");
    } finally {
      setAiBusy(false);
    }
  };
  const availablePoints = criteria.reduce((sum,c)=>sum+c.weight,0);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [approveText, setApproveText] = useState("");

  const weighted = criteria.reduce((acc, c) => {
    const s = scores[c.id]?.score ?? 0;
    return acc + c.weight * (s / 10);
  }, 0);
  const average = Math.round(weighted * 100) / 100;
  const failedRequired = criteria.filter(
    (c) => c.required && (scores[c.id]?.score ?? 0) <= 6,
  );
  const allJustified = criteria.every((c) =>
    String(scores[c.id]?.reason ?? "").trim()&&String(scores[c.id]?.reason??"").length<=comiteTextLimits.justificacion,
  );
  const recommendation =
    average >= 70 && failedRequired.length === 0 && products && productRules?.cumple
      ? "RECOMIENDA"
      : "NO RECOMIENDA";

  return (
    <div className={`rubric-layout${!cie?` evaluator-workspace evaluator-pane-${readingPane}`:''}`}>
      {!cie&&<div className="card evaluator-reading-tools" aria-label="Distribución de lectura"><button type="button" className="btn btn-secondary" aria-pressed={readingPane==='case'} onClick={()=>setReadingPane(readingPane==='case'?'both':'case')}>Ampliar propuesta</button><button type="button" className="btn btn-secondary" aria-pressed={readingPane==='rubric'} onClick={()=>setReadingPane(readingPane==='rubric'?'both':'rubric')}>Ampliar evaluación</button><button type="button" className="btn btn-secondary" onClick={()=>setReadingPane('both')}>Mostrar ambos paneles</button></div>}

      {loadError && <p role="alert">{loadError}. Recargue antes de editar para no sobrescribir una evaluación que no se pudo recuperar.</p>}
      <article className="card rubric-case">
        {!cie?<details open className="evaluator-proposal-details"><summary>Información de la propuesta</summary><div className="evaluator-proposal-scroll" tabIndex={0} aria-label="Información desplazable de la propuesta"><CaseFile proposal={proposal}/></div></details>:<CaseFile proposal={proposal}/>}
      </article>
      <fieldset className="rubric-main" disabled={loadingSaved || Boolean(loadError)||closed||!assigned} style={{border:0,padding:0,margin:0,minWidth:0}}>
        {loadingSaved && <p role="status">Recuperando evaluación guardada…</p>}
        <div className="rubric-summary">
          <div>
            <p className="eyebrow">
              {cie ? "Rúbrica CIE" : "Evaluación individual"}
            </p>
            <h2>
              {cie
                ? "Evaluación y resolución del CIE"
                : `Rúbrica versionada · ${proposal.modalidad}`}
            </h2>
            <p>
              Definición versionada basada en la rúbrica oficial Fondos VIE 2027. Escala: 0, 6, 8 o 10. Los requisitos obligatorios con 0 o 6 y el incumplimiento de productos determinan una recomendación desfavorable. La nota y su justificación son humanas.
            </p>
          </div>
          <div className="score-ring" role="img" aria-label={`Calificación ponderada: ${average} de ${availablePoints}`} style={!cie?{background:`radial-gradient(closest-side, white 78%, transparent 80%),conic-gradient(var(--blue) ${availablePoints?average/availablePoints*100:0}%, var(--ink-08) 0)`}:undefined}>
            <strong>{average}</strong>
            <span>/ {availablePoints} puntos incluidos</span>
            <small>{recommendation}</small>
          </div>
        </div>

        {!cie&&<div className="card evaluation-progress" role="status" aria-live="polite"><strong>Progreso de evaluación</strong><progress aria-label="Progreso de evaluación" max={criteria.length+1} value={criteria.filter(c=>Boolean(scores[c.id]?.reason.trim())&&(scores[c.id]?.reason.length??0)<=comiteTextLimits.justificacion&&[0,6,8,10].includes(scores[c.id]?.score)).length+(products?1:0)}/><span>{criteria.filter(c=>Boolean(scores[c.id]?.reason.trim())&&(scores[c.id]?.reason.length??0)<=comiteTextLimits.justificacion).length} de {criteria.length} criterios justificados · Productos {products?'verificados':'pendientes de verificar'}</span><small>El progreso mide la completitud; la calificación ponderada se muestra en el círculo.</small></div>}
        {!cie && proposal.numericId && (
          <article className="card ai-eval" aria-live="polite">
            <div className="ai-eval-head">
              <div>
                <p className="eyebrow">Apoyo automatizado · no vinculante</p>
                <h3>Evaluación sugerida por IA</h3>
                <p className="muted">
                  Analiza el expediente con la rúbrica oficial Fondos VIE 2027.
                  Es una sugerencia para su revisión: la calificación definitiva
                  y su justificación son humanas.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={aiBusy}
                onClick={() => void generateAi()}
              >
                {aiBusy
                  ? "Generando evaluación…"
                  : ai
                    ? "Regenerar evaluación IA"
                    : "Generar evaluación con IA"}
              </button>
            </div>
            {aiLoading && <p role="status">Buscando sugerencia de IA…</p>}
            {aiError && <p role="alert" className="field-error-text">{aiError}</p>}
            {ai && (
              <>
                <div className="ai-eval-summary">
                  <div className={`ai-eval-score ${ai.recomendacion === "RECOMIENDA" ? "is-positive" : "is-negative"}`}>
                    <strong>{ai.puntajeTotal}</strong>
                    <span>/ 100</span>
                    <small>{ai.recomendacion}</small>
                  </div>
                  <div>
                    <p>{ai.resumen}</p>
                    <small className="muted">
                      {ai.modelo} · {new Date(ai.fechaGeneracion).toLocaleString("es-CR")} · generada por {ai.generadoPor}
                    </small>
                  </div>
                </div>
                {ai.resultado.alertas.length > 0 && (
                  <ul className="ai-eval-alerts">
                    {ai.resultado.alertas.map((alert) => <li key={alert}>{alert}</li>)}
                  </ul>
                )}
                <div className="action-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={applyAiSuggestions}
                  >
                    Usar sugerencias como punto de partida
                  </button>
                </div>
                <p className="muted">
                  Se copiarán las notas y justificaciones sugeridas a su
                  evaluación. Revíselas, corríjalas y confirme: la nota final es
                  humana.
                </p>
              </>
            )}
          </article>
        )}

        <p>Versión del expediente: {version} · Ciclo {cycle}</p>
        {!cie&&proposal.numericId&&<ComiteConsolidado id={proposal.numericId}/>}
        {!assigned&&<p role="status">Solo las personas asignadas al Comité pueden guardar una evaluación individual.</p>}
        {closed&&<p role="status">Evaluación entregada; solo lectura.</p>}
        {productRules&&<p>Productos mínimos: {productRules.minAcademicos} académicos{productRules.minPI?` más ${productRules.minPI} activo de la lista 5.5.a`:""}. Registrados: {productRules.academicos} académicos y {productRules.activosPI} activos. {productRules.cumple?"Cantidad suficiente; requiere verificación humana.":"No cumple la cantidad mínima registrada."}</p>}
        <label className="subsanacion-seccion"><input type="checkbox" checked={products} onChange={e=>setProducts(e.target.checked)}/>Verifiqué que los productos comprometidos cumplen los mínimos oficiales (validación no sumativa).</label>
        {sections.map((section) => (
          <details open key={section.id} className="rubric-section">
            <summary className="rubric-section-head">
              <div>
                <h3>{section.title}</h3>
                <span>Peso total de la sección: {section.weight}%</span>
              </div>
            </summary>
            {section.criteria.map((_crit, idx) => {
              const id = `${section.id}-${idx}`;
              const full = criteria.find((c) => c.id === id)!;
              const row = scores[id];
              const aiSuggestion = aiCriteria.get(id);
              return (
                <article key={id} className="card criterion">
                  <div className="criterion-head">
                    <div>
                      <strong>{full.label}</strong>
                      <span>
                        Peso {full.weight}%{" "}
                        {full.required ? "· Requisito obligatorio" : ""}
                      </span>
                    </div>
                  </div>
                  {full.requirement&&<p>{full.requirement}</p>}
                  <p>{full.levels[String(row?.score??0)]}</p>
                  {!cie && aiSuggestion && (
                    <div className="ai-criterion">
                      <div className="ai-criterion-head">
                        <span>Sugerencia IA</span>
                        <strong>{aiSuggestion.puntaje} / 10</strong>
                        {aiSuggestion.confianza && <small>Confianza {aiSuggestion.confianza}</small>}
                      </div>
                      <p>{aiSuggestion.justificacion}</p>
                      {aiSuggestion.evidencia && (
                        <small>Evidencia: {aiSuggestion.evidencia}</small>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setScores((current) => ({
                            ...current,
                            [id]: { score: aiSuggestion.puntaje, reason: aiSuggestion.justificacion },
                          }))
                        }
                      >
                        Usar esta sugerencia
                      </button>
                    </div>
                  )}
                  <div className="human-eval">
                    <label className="field" htmlFor={`valoracion-${id}`}>
                      <span className="field-label">Valoración humana</span>
                      <select
                        id={`valoracion-${id}`}
                        className="input"
                        value={row?.score ?? 0}
                        onChange={(e) =>
                          setScores((s) => ({
                            ...s,
                            [id]: {
                              ...s[id],
                              score: Number(e.target.value),
                            },
                          }))
                        }
                      >
                        {RUBRIC_SCORE_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n} / 10
                          </option>
                        ))}
                      </select>
                    </label>
                    <label
                      className="field"
                      htmlFor={`justificacion-${id}`}
                    >
                      <span className="field-label">
                        Justificación humana obligatoria
                      </span>
                      <textarea
                        id={`justificacion-${id}`}
                        aria-label="Justificación humana obligatoria"
                        maxLength={comiteTextLimits.justificacion} aria-describedby={`budget-${id}`}
                        className="input textarea"
                        rows={3}
                        value={row?.reason ?? ""}
                        placeholder="Justifique la valoración con evidencia del expediente..."
                        onChange={(e) =>
                          setScores((s) => ({
                            ...s,
                            [id]: { ...s[id], reason: e.target.value },
                          }))
                        }
                      /><WordBudget id={`budget-${id}`} value={row?.reason??""} maxWords={comiteTextLimits.justificacion} unit="caracteres"/>
                    </label>
                  </div>
                </article>
              );
            })}
          </details>
        ))}

        <article className="card rubric-result-card">
          <p className="sr-only" role="status" aria-live="polite">
            Calificación ponderada: {average} de {availablePoints} puntos.
            Resultado de referencia: {recommendation}.
          </p>
          <div>
            <span>Calificación ponderada</span>
            <strong>{average} / {availablePoints} puntos incluidos</strong>
          </div>
          <div>
            <span>Resultado de referencia</span>
            <strong>{recommendation}</strong>
          </div>
          <div>
            <span>Requisitos obligatorios bajo mínimo</span>
            <strong>{failedRequired.length}</strong>
          </div>
        </article>

        <div className="action-row end">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              onAction("save-rubric", {
                average,
                scores,
                productosCumplen:products,ciclo:cycle,
                instancia: cie ? "cie" : "comite",
                recommendation,
              })
            }
          >
            Guardar evaluación
          </button>
          {cie ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectOpen(true)}
              >
                Rechazar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={false}
                title={availablePoints < 100 ? "Pendiente de incorporar y validar la rúbrica oficial completa; este subconjunto no permite una recomendación definitiva." : undefined}
                onClick={() => setApproveOpen(true)}
              >
                Aprobar y emitir resolución
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!allJustified}
              onClick={() =>
                onAction("committee-score", {
                  average,
                  scores,
                  productosCumplen:products,ciclo:cycle,
recommendation,
                })
              }
            >
              Completar evaluación
            </button>
          )}
        </div>

        <SimpleModal
          open={rejectOpen}
          title="Emitir resolución de rechazo"
          description="Registre el fundamento que acompañará la resolución del CIE."
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
                onClick={async () => {
                  if (!await onAction("cie-reject", {
                    average,
                    scores,
                  productosCumplen:products,ciclo:cycle,
texto: rejectText.trim(),
                  })) return;
                  setRejectOpen(false);
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
              className="input textarea"
              rows={6}
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
              placeholder="Fundamento de la resolución de rechazo..."
            />
          </label>
        </SimpleModal>

        <SimpleModal
          open={approveOpen}
          title="Aprobar y emitir resolución"
          description={`Propuesta ${proposal.id} · Calificación ${average}% · Resultado: ${recommendation}`}
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
                onClick={async () => {
                  if (!await onAction("cie-approve", {
                    average,
                    scores,
                  productosCumplen:products,ciclo:cycle,
recommendation,
                    texto: approveText.trim(),
                  })) return;
                  setApproveOpen(false);
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
              className="input textarea"
              rows={6}
              value={approveText}
              onChange={(e) => setApproveText(e.target.value)}
              placeholder="Fundamento de la resolución aprobatoria..."
            />
          </label>
        </SimpleModal>
      </fieldset>
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
    {vieItems.map(item=><details key={item.codigo} className="vie-document-review"><summary>{item.etiqueta} · {saved[item.codigo]?'Verificación guardada':'Pendiente de verificar'}{checks[item.codigo]!==saved[item.codigo]?' · Cambios sin guardar':''}</summary><div className="stack-md">
      {item.codigo==='propuesta'&&<p>Use «Abrir expediente completo» para consultar todas las secciones, el presupuesto estructurado y sus anexos; al volver conservará la propuesta seleccionada.</p>}
      {proposal.numericId&&item.codigo==='pi'&&<VinculacionResumen id={proposal.numericId}/>}
      {proposal.numericId&&item.codigo==='evaluacion_comite'&&<ConsejoRespaldo id={proposal.numericId}/>}
      {proposal.numericId&&item.codigo==='oficio_comite'&&<ConsejoRespaldo id={proposal.numericId}/>}
      {proposal.numericId&&item.codigo==='aval'&&<DireccionRespaldo id={proposal.numericId}/>}
      {proposal.numericId&&item.codigo==='respaldos'&&<DocumentosPanel id={proposal.numericId}/>}
      <label className="check-row"><input type="checkbox" aria-label={`Verificar: ${item.etiqueta}`} disabled={saving} checked={checks[item.codigo]} onChange={e=>setChecks(prev=>({...prev,[item.codigo]:e.target.checked}))}/><span>He revisado: {item.etiqueta}</span></label>
      <button type="button" className="btn btn-secondary" disabled={saving||checks[item.codigo]===saved[item.codigo]} onClick={()=>void save({...saved,[item.codigo]:checks[item.codigo]})}>Guardar revisión de {item.etiqueta}</button>
    </div></details>)}
    <button type="button" className="btn btn-secondary" disabled={saving||!dirty} onClick={()=>void save({...checks})}>{saving?'Guardando verificación…':'Guardar verificación'}</button>
    <p className="field-hint" role="status">{dirty?'Verificación con cambios sin guardar.':'La remisión requiere guardar todos los requisitos verificados. Las marcas guardadas se conservan al volver.'}</p>
    <label className="field"><span className="field-label">Comentario o motivo de devolución</span><textarea aria-label="Comentario o motivo de devolución" className="input textarea" rows={5} value={obs} maxLength={4000} aria-describedby="vie-observacion-budget" onChange={e=>setObs(e.target.value)} placeholder="Indique qué encontró y qué debe corregirse…"/><WordBudget id="vie-observacion-budget" value={obs} maxWords={4000} unit="caracteres"/></label>
    <SeccionesDevueltas value={secciones} onChange={setSecciones}/>
    <div className="action-row"><button type="button" className="btn btn-secondary btn-observation" disabled={saving||!obs.trim()} onClick={async()=>{if(await onAction('vie-observation',{texto:obs}))setObs('');}}>Enviar comentario sin devolución</button><button type="button" className="btn btn-secondary" disabled={saving||!obs.trim()||!secciones.length} onClick={()=>onAction('return',{texto:obs,secciones,instancia:'vie'})}>Devolver para subsanación en VIE</button><button type="button" className="btn btn-primary" disabled={saving||dirty||!allOk} onClick={()=>setConfirm(true)}>Enviar al CIE</button></div>
    <SimpleModal open={confirm} title="Remitir expediente al CIE" description="Se enviará el expediente con su verificación completa. Saldrá de pendientes VIE y quedará disponible para resolución del CIE." onClose={()=>setConfirm(false)} footer={<><button type="button" className="btn btn-secondary" onClick={()=>setConfirm(false)}>Cancelar</button><button type="button" className="btn btn-primary" disabled={saving||dirty||!allOk} onClick={async()=>{if(await onAction('send-cie'))setConfirm(false);}}>Confirmar remisión al CIE</button></>}><p>Se conservarán los seis requisitos verificados en el expediente.</p></SimpleModal>
    </article></div>;
}

export function DireccionInvestigacionPanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const rejected = proposal.estado.includes("Rechazada");
  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Notificación formal de resolución"
          description="Comunique el resultado emitido por el CIE y cierre el flujo institucional."
        />
        <div className="official-doc">
          <IconFile size={24} />
          <div>
            <span>Resolución CIE</span>
            <strong>{proposal.resolucion || "Sin resolución registrada"}</strong>
            <small>Resultado: {rejected ? "Rechazo" : "Aprobación"}</small>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <span>Persona investigadora</span>
            <strong>{proposal.investigadora}</strong>
          </div>
          <div>
            <span>Fecha de resolución</span>
            <strong>{proposal.fechaResolucion ? new Date(proposal.fechaResolucion).toLocaleDateString("es-CR",{timeZone:"America/Costa_Rica"}) : "Sin fecha registrada"}</strong>
          </div>
          <div>
            <span>Correo</span>
            <strong>{proposal.coordinadorCorreo || "Sin correo registrado"}</strong>
          </div>
          <div>
            <span>Estado de notificación</span>
            <strong>{proposal.notificada ? "Notificada" : "Pendiente"}</strong>
          </div>
        </div>
        <div className="action-stack">
          <button
            type="button"
            className="btn btn-secondary"
            disabled
            title="Fuera de alcance del prototipo: no se genera PDF automático de resoluciones"
          >
            PDF de resolución · fuera de alcance
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={proposal.notificada}
            onClick={() => onAction("notify-resolution")}
          >
            {proposal.notificada
              ? "Resolución notificada"
              : "Notificar resolución"}
          </button>
        </div>
      </article>
    </div>
  );
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
