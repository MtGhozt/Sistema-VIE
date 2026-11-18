import { CieRespaldo } from "./CieRespaldo";
import { DireccionRespaldo } from "./DireccionRespaldo";
import { DocumentosPanel } from "../DocumentosPanel";
import { ConsejoRespaldo } from "./ConsejoRespaldo";
import { VinculacionResumen } from "./VinculacionResumen";
import comiteTextLimits from "../../../../shared/comite-text-limits.json";
import { WordBudget } from "../WordBudget";
import { ComiteConsolidado } from "./ComiteConsolidado";
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
import { CaseFile } from "./CaseFile";
import { SimpleModal } from "./SimpleModal";
import type { EvalActionHandler } from "./evalTypes";

export function RubricPanel({
  proposal,
  onAction,
  cie = false,
}: {
  proposal: DemoProposal;
  onAction: EvalActionHandler;
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
    <div className={`rubric-layout evaluator-workspace evaluator-pane-${readingPane}`}>
      {<div className="card evaluator-reading-tools" aria-label="Distribución de lectura"><button type="button" className="btn btn-secondary" aria-pressed={readingPane==='case'} onClick={()=>setReadingPane(readingPane==='case'?'both':'case')}>Ampliar propuesta</button><button type="button" className="btn btn-secondary" aria-pressed={readingPane==='rubric'} onClick={()=>setReadingPane(readingPane==='rubric'?'both':'rubric')}>Ampliar evaluación</button><button type="button" className="btn btn-secondary" onClick={()=>setReadingPane('both')}>Mostrar ambos paneles</button></div>}

      {loadError && <p role="alert">{loadError}. Recargue antes de editar para no sobrescribir una evaluación que no se pudo recuperar.</p>}
      <article className={cie?"card rubric-case cie-case":"card rubric-case"} tabIndex={cie?0:undefined} aria-label={cie?"Expediente y respaldos":undefined}>
        {<details open className="evaluator-proposal-details"><summary>Información de la propuesta</summary><div className="evaluator-proposal-scroll" tabIndex={0} aria-label="Información desplazable de la propuesta"><CaseFile proposal={proposal}/></div></details>}
        {cie&&proposal.numericId&&<div className="stack-md cie-institutional-records"><details className="vie-document-review"><summary>Dictamen de Propiedad Intelectual</summary><VinculacionResumen id={proposal.numericId}/></details><details className="vie-document-review"><summary>Evaluación y oficio del Comité Técnico</summary><ConsejoRespaldo id={proposal.numericId}/></details><details className="vie-document-review"><summary>Aval del Consejo y comunicación a VIE</summary><DireccionRespaldo id={proposal.numericId}/></details><details className="vie-document-review"><summary>Archivos de respaldo y presupuesto adjunto</summary><DocumentosPanel id={proposal.numericId}/></details><details className="vie-document-review"><summary>Verificación VIE y resolución CIE</summary><CieRespaldo id={proposal.numericId}/></details></div>}
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
          <div className="score-ring" role="img" aria-label={`Calificación ponderada: ${average} de ${availablePoints}`} style={{background:`radial-gradient(closest-side, var(--white) 78%, transparent 80%),conic-gradient(var(--blue) ${availablePoints?average/availablePoints*100:0}%, var(--ink-08) 0)`}}>
            <strong>{average}</strong>
            <span>/ {availablePoints} puntos incluidos</span>
            <small>{recommendation}</small>
          </div>
        </div>

        {<div className="card evaluation-progress" role="status" aria-live="polite"><strong>Progreso de evaluación</strong><progress aria-label="Progreso de evaluación" max={criteria.length+1} value={criteria.filter(c=>Boolean(scores[c.id]?.reason.trim())&&(scores[c.id]?.reason.length??0)<=comiteTextLimits.justificacion&&[0,6,8,10].includes(scores[c.id]?.score)).length+(products?1:0)}/><span>{criteria.filter(c=>Boolean(scores[c.id]?.reason.trim())&&(scores[c.id]?.reason.length??0)<=comiteTextLimits.justificacion).length} de {criteria.length} criterios justificados · Productos {products?'verificados':'pendientes de verificar'}</span><small>El progreso mide la completitud; la calificación ponderada se muestra en el círculo.</small></div>}
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

        {cie&&!allJustified&&<p className="field-hint" role="status">Valore y justifique todos los criterios antes de emitir la resolución. Puede guardar la evaluación para continuar después.</p>}
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
                disabled={!allJustified}
                onClick={() => setRejectOpen(true)}
              >
                Rechazar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!allJustified || availablePoints < 100}
                title={
                  availablePoints < 100
                    ? "La rúbrica activa no suma 100 puntos; no se puede emitir una resolución definitiva hasta publicar la versión completa."
                    : undefined
                }
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
          description="Registre el fundamento. La resolución cerrará la evaluación de este expediente; su notificación corresponderá a Dirección de Investigación."
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
                disabled={!allJustified||!rejectText.trim()}
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
              aria-label="Justificación del rechazo CIE" maxLength={4000} aria-describedby="cie-rechazo-budget" className="input textarea"
              rows={6}
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
              placeholder="Fundamento de la resolución de rechazo..."
            /><WordBudget id="cie-rechazo-budget" value={rejectText} maxWords={4000} unit="caracteres"/>
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
                disabled={!allJustified||!approveText.trim()}
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
              aria-label="Justificación de la aprobación CIE" maxLength={4000} aria-describedby="cie-aprobacion-budget" className="input textarea"
              rows={6}
              value={approveText}
              onChange={(e) => setApproveText(e.target.value)}
              placeholder="Fundamento de la resolución aprobatoria..."
            /><WordBudget id="cie-aprobacion-budget" value={approveText} maxWords={4000} unit="caracteres"/>
          </label>
        </SimpleModal>
      </fieldset>
    </div>
  );
}
