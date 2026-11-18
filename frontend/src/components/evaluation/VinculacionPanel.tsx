import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiJson } from "../../api/client";
import type { DemoProposal } from "../../data/demo";
import piLimits from "../../../../shared/pi-text-limits.json";
import { WordBudget } from "../WordBudget";
import { IconShield } from "../icons";
import { PanelIntro, type ActionHandler } from "./panelShared";

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
