import {apiJson} from "../api/client";
import { PlanEditor } from "./PlanEditor";
import { EditableRows } from "./EditableRows";
import { EquipoEditor } from "./EquipoEditor";
import { useId, useEffect, useState, type ReactNode } from "react";
import type { Convocatoria } from "../api/convocatorias";
import {
  type FormWizardState,
  type GradoVinculo,
  type YesNo,
} from "../data/formWizard";
import { formatCRC } from "../data/proposalView";

type Props = {
  bloquearIdentificacion?:boolean;
  documentos?: ReactNode;
  step: number;
  form: FormWizardState;
  patch: (partial: Partial<FormWizardState>) => void;
  convocatorias: Convocatoria[];
  idConvocatoria: number | "";
  setIdConvocatoria: (v: number | "") => void;
};

function QuestionBlock({
  number,
  question,
  children,
}: {
  number: number;
  question: string;
  children: ReactNode;
}) {
  const questionId = useId();
  return (
    // El bloque completo se anuncia como grupo con el nombre de la pregunta,
    // para que un lector de pantalla anuncie el contexto antes del control.
    <div className="question-block" role="group" aria-labelledby={questionId}>
      <div className="question-title">
        <span>{number}</span>
        <p id={questionId}>{question}</p>
      </div>
      {children}
    </div>
  );
}

function YesNoRow({
  value,
  onChange,
  extra,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  extra?: ReactNode;
}) {
  // Sin `name` compartido los dos radios no son un grupo real: no navegan con
  // las flechas ni se anuncian como "1 de 2".
  const groupName = useId();
  return (
    <div className="stack-md">
      <div className="choice-row" style={{ marginLeft: 0 }}>
        {(["No", "Sí"] as YesNo[]).map((opt) => (
          <label
            key={opt}
            className={`radio-choice${value === opt ? " selected" : ""}`}
          >
            <input
              type="radio"
              name={groupName}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span className="radio-dot" />
            {opt}
          </label>
        ))}
      </div>
      {extra}
    </div>
  );
}

export function FormWizardStepContent({
  bloquearIdentificacion=false,
  documentos,
  step,
  form,
  patch,
  convocatorias,
  idConvocatoria,
  setIdConvocatoria,
}: Props) {
  const [catalogs,setCatalogs]=useState<{modalidades:{codigo:string;nombre:string}[];lineas:{id_linea_investigacion:number;nombre:string}[]}>({modalidades:[],lineas:[]});
  const [catalogError,setCatalogError]=useState('');
  useEffect(()=>{let active=true;apiJson<typeof catalogs>('/api/catalogos').then(c=>{if(active)setCatalogs(c);}).catch(e=>{if(active)setCatalogError(e.message);});return()=>{active=false;};},[]);

  if (step === 0) {
    return (
      <div className="stack-xl">
        <div className="form-section-block">
          <p className="body-copy">
            Identificación y preguntas generales. Esta pantalla reproduce la
            primera parte del formulario oficial VIE 2027. Respondé todas las
            preguntas; los campos adicionales aparecen cuando seleccionás «Sí».
          </p>
        </div>

        <section className="form-section-block">
          <div className="numbered-title">
            <span>1</span>
            <h3>Identificación del proyecto</h3>
          </div>
          <label className="field">
            <span className="field-label">Convocatoria</span>
            <select
              className="input"
              disabled={bloquearIdentificacion} value={idConvocatoria}
              onChange={(e) =>
                setIdConvocatoria(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
            >
              <option value="" disabled>
                Seleccionar…
              </option>
              {convocatorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          {catalogError&&<p role="alert">{catalogError}</p>}
          <fieldset><legend>Líneas de investigación</legend>{catalogs.lineas.map(l=><label className="subsanacion-seccion" key={l.id_linea_investigacion}><input type="checkbox" checked={form.lineas.includes(l.id_linea_investigacion)} onChange={e=>patch({lineas:e.target.checked?[...form.lineas,l.id_linea_investigacion]:form.lineas.filter(id=>id!==l.id_linea_investigacion)})}/>{l.nombre}</label>)}</fieldset>
          <div className="form-grid two-col">{(['trlActual','trlEsperado'] as const).map(key=><label className="field" key={key}>{key==='trlActual'?'TRL actual (si aplica)':'TRL esperado (si aplica)'}<input className="input" type="number" min="1" max="9" value={form[key]??''} onChange={e=>patch({[key]:e.target.value?Number(e.target.value):null})}/></label>)}</div>
          <div className="form-grid two-col">
            <label className="field">
              <span className="field-label">Nombre del proyecto</span>
              <input
                className="input"
                value={form.titulo}
                onChange={(e) => patch({ titulo: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Modalidad</span>
              <select
                className="input"
                disabled={bloquearIdentificacion} value={form.modalidad}
                onChange={(e) => patch({ modalidad: e.target.value })}
              >
                {!catalogs.modalidades.some(m=>m.nombre===form.modalidad||m.codigo===form.modalidad)&&<option disabled={bloquearIdentificacion} value={form.modalidad}>{form.modalidad} (actual)</option>}
                {catalogs.modalidades.map((m) => (
                  <option key={m.codigo} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Fecha de inicio</span>
              <input
                type="date"
                className="input"
                value={form.inicio}
                onChange={(e) => patch({ inicio: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Fecha de finalización</span>
              <input
                type="date"
                className="input"
                value={form.fin}
                onChange={(e) => patch({ fin: e.target.value })}
              />
            </label>
          </div>
          <label className="field">
            <span className="field-label">
              Dependencia académica coordinadora
            </span>
            <input
              className="input"
              readOnly
              value={form.escuela || "Asignada según su cuenta institucional"}
            />
          </label>
        </section>

        <section className="form-section-block">
          <div className="numbered-title">
            <span>2</span>
            <h3>Preguntas generales</h3>
          </div>
          <div className="questions-stack">
            <QuestionBlock
              number={1}
              question="¿Ha sido esta propuesta sometida, parcial o totalmente, a otras fuentes de financiamiento o a FUNDATEC?"
            >
              <YesNoRow
                value={form.q1}
                onChange={(q1) => patch({ q1 })}
              />
            </QuestionBlock>
            <QuestionBlock
              number={2}
              question="¿Existe vinculación técnica o de continuidad con otros proyectos inscritos ante la VIE o con una hoja de ruta?"
            >
              <YesNoRow
                value={form.q2}
                onChange={(q2) => patch({ q2 })}
                extra={
                  form.q2 === "Sí" ? (
                    <div className="form-grid two-col">
                      <label className="field">
                        <span className="field-label">
                          Nombre del proyecto relacionado
                        </span>
                        <input
                          className="input"
                          value={form.q2Proyecto}
                          onChange={(e) =>
                            patch({ q2Proyecto: e.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">Tipo de relación</span>
                        <input
                          className="input"
                          value={form.q2Relacion}
                          onChange={(e) =>
                            patch({ q2Relacion: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  ) : null
                }
              />
            </QuestionBlock>
            <QuestionBlock
              number={3}
              question="¿Atiende problemas prioritarios identificados por planes nacionales, sectoriales o entes externos de relevancia?"
            >
              <YesNoRow
                value={form.q3}
                onChange={(q3) => patch({ q3 })}
                extra={
                  form.q3 === "Sí" ? (
                    <label className="field">
                      <span className="field-label">
                        Problema y documento de referencia
                      </span>
                      <textarea
                        className="input textarea"
                        rows={3}
                        value={form.q3Detalle}
                        onChange={(e) => patch({ q3Detalle: e.target.value })}
                      />
                    </label>
                  ) : null
                }
              />
            </QuestionBlock>
            <QuestionBlock
              number={4}
              question="¿Se requiere formalizar un instrumento jurídico entre el ITCR y entes externos?"
            >
              <YesNoRow value={form.q4} onChange={(q4) => patch({ q4 })} />
            </QuestionBlock>
            <QuestionBlock
              number={5}
              question="¿Se fundamenta esta iniciativa en un convenio marco de cooperación técnica actualmente vigente?"
            >
              <YesNoRow value={form.q5} onChange={(q5) => patch({ q5 })} />
            </QuestionBlock>
            <QuestionBlock
              number={6}
              question="¿Corresponde esta propuesta, parcial o totalmente, a investigación base para optar por un grado académico superior?"
            >
              <div className="choice-row" style={{ marginLeft: 0 }}>
                {(["No", "Sí, parcial", "Sí, totalmente"] as GradoVinculo[]).map(
                  (opt) => (
                    <label
                      key={opt}
                      className={`radio-choice${form.q6 === opt ? " selected" : ""}`}
                    >
                      <input
                        type="radio"
                        checked={form.q6 === opt}
                        onChange={() => patch({ q6: opt })}
                      />
                      <span className="radio-dot" />
                      {opt}
                    </label>
                  ),
                )}
              </div>
            </QuestionBlock>
            <QuestionBlock
              number={7}
              question="¿Contiene la propuesta información sensible de terceros o datos sujetos a confidencialidad?"
            >
              <YesNoRow value={form.q7} onChange={(q7) => patch({ q7 })} />
            </QuestionBlock>
            <QuestionBlock
              number={8}
              question="¿La propuesta presenta potencial de generar resultados susceptibles de protección mediante propiedad intelectual?"
            >
              <fieldset disabled={bloquearIdentificacion} style={{border:0,padding:0,margin:0}}><YesNoRow value={form.q8} onChange={(q8) => patch({ q8 })} /></fieldset>
            </QuestionBlock>
          </div>
        </section>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="stack-lg">
        <label className="field">
          <span className="field-label">Resumen (español · máximo 500 palabras)</span>
          <span className="field-hint" role="status">{form.resumen.trim().split(/\s+/u).filter(Boolean).length} / 500 palabras. El borrador puede guardarse incompleto.</span>
          <textarea
            className="input textarea"
            rows={6}
            aria-label="Resumen (español · máximo 500 palabras)" value={form.resumen}
            onChange={(e) => patch({ resumen: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Abstract (English)</span>
          <textarea
            className="input textarea"
            rows={6}
            aria-label="Abstract (English)" value={form.abstract}
            onChange={(e) => patch({ abstract: e.target.value })}
          />
        </label>
        <label className="field"><span className="field-label">Keywords (English · opcional)</span>
          <input className="input" value={form.keywordsEn} onChange={e => patch({ keywordsEn: e.target.value })} />
        </label>
        <label className="field">
          <span className="field-label">Palabras clave en español (entre 4 y 6, separadas por comas)</span>
          <input
            className="input"
            value={form.palabras}
            onChange={(e) => patch({ palabras: e.target.value })}
          />
        </label>
      </div>
    );
  }

  if (step === 2) {
    return <EquipoEditor equipo={form.equipo} onChange={equipo => patch({ equipo })} />;
  }

  if (step === 3) {
    return (
      <div className="stack-lg">
        <label className="field">
          <span className="field-label">Planteamiento del problema</span>
          <textarea
            className="input textarea"
            rows={5}
            aria-label="Planteamiento del problema" value={form.problema}
            onChange={(e) => patch({ problema: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Objetivos</span>
          <textarea
            className="input textarea"
            rows={4}
            aria-label="Objetivos" value={form.objetivos}
            onChange={(e) => patch({ objetivos: e.target.value })}
          />
        </label>
      </div>
    );
  }

  if (step === 4 || step === 10 || step === 12) {
    const key = step === 4 ? "estadoArte" : step === 10 ? "divulgacion" : "hojaRuta";
    const label = step === 4 ? "Estado del arte" : step === 10 ? "Divulgación y socialización" : "Hoja de ruta";
    return <label className="field"><span className="field-label">{label}</span>
      <textarea aria-label={label} className="input textarea" rows={10} value={form[key]} onChange={e => patch({ [key]: e.target.value })} />
    </label>;
  }

  if (step === 5) {
    return (
      <label className="field">
        <span className="field-label">Metodología</span>
        <textarea
          className="input textarea"
          rows={8}
          aria-label="Metodología" value={form.metodologia}
          onChange={(e) => patch({ metodologia: e.target.value })}
        />
      </label>
    );
  }

  if (step === 6) {
    return <PlanEditor rows={form.actividades} equipo={form.equipo} onChange={actividades=>patch({actividades})}/>;
  }

  if (step === 7) {
    return <div className="stack-lg">
      <p className="field-hint">Montos en colones. Los bienes duraderos se formulan para el primer año de ejecución.</p>
      <EditableRows title="Presupuesto anual" rows={form.presupuesto} onChange={presupuesto=>patch({presupuesto})}
        blank={()=>({anio:Number(form.inicio.slice(0,4))||2027,operativo:0,duraderos:0})}
        fields={[{key:'anio',label:'Año',type:'number'},{key:'operativo',label:'Presupuesto operativo (₡)',type:'number'},{key:'duraderos',label:'Bienes duraderos (₡)',type:'number'}]}/>
      <strong>Total solicitado: {formatCRC(form.presupuesto.reduce((sum,r)=>sum+r.operativo+r.duraderos,0))}</strong>
      <EditableRows title="Fuentes de financiamiento" rows={form.fuentes} onChange={fuentes=>patch({fuentes})}
        blank={()=>({tipo:'externo',anio:Number(form.inicio.slice(0,4))||2027,monto:0,oficio:''})}
        fields={[{key:'tipo',label:'Tipo',options:['externo','contrapartida','cofinanciamiento'],optionLabels:{externo:'Financiamiento externo',contrapartida:'Contrapartida',cofinanciamiento:'Cofinanciamiento'}},{key:'anio',label:'Año',type:'number'},{key:'monto',label:'Monto (₡)',type:'number'},{key:'oficio',label:'Número de oficio de respaldo'}]}/>
    </div>;
  }

  if (step === 8) {
    return <EditableRows title="Compromisos de productos" rows={form.compromisos} onChange={compromisos=>patch({compromisos})}
      blank={()=>({ambito:form.modalidad==='Desarrollo tecnológico'?'desarrollo_tecnologico':'basica_aplicada',codigo:'',descripcion:'',cantidad:1,dictamen:''})}
      fields={[{key:'ambito',label:'Ámbito',options:['basica_aplicada','desarrollo_tecnologico','adicional','activo_pi'],optionLabels:{basica_aplicada:'Investigación básica / aplicada',desarrollo_tecnologico:'Desarrollo tecnológico',adicional:'Producto adicional',activo_pi:'Activo de propiedad intelectual'}},{key:'codigo',label:'Opción del formulario oficial'},{key:'descripcion',label:'Descripción del producto'},{key:'cantidad',label:'Cantidad comprometida',type:'number'},{key:'dictamen',label:'Consecutivo del dictamen PI (si corresponde)'}]}/>;
  }

  if (step === 9) {
    return <div className="stack-lg">
      <label className="field"><span><input type="checkbox" checked={form.resguardoRepositorio} onChange={e=>patch({resguardoRepositorio:e.target.checked})} /> Acepto depositar los productos y resultados en el Repositorio Institucional, salvo prohibición por propiedad intelectual o arbitraje de publicaciones.</span></label>
      <label className="field"><span><input type="checkbox" checked={form.resguardoTecnico} onChange={e=>patch({resguardoTecnico:e.target.checked})} /> Si se desarrolla software o bases de datos, acepto entregar el respaldo técnico completo a la Dirección de Investigación para su resguardo.</span></label>
    </div>;
  }

  if (step === 11) {
    return <div className="stack-lg">
      {([['humanos','Seres humanos'],['biodiversidad','Biodiversidad'],['animales','Animales'],['indigenas','Pueblos y territorios indígenas']] as const).map(([key,label])=><label className="field" key={key}><span><input type="checkbox" checked={form.aspectosEticos[key]} onChange={e=>patch({aspectosEticos:{...form.aspectosEticos,[key]:e.target.checked}})}/> La propuesta involucra: {label}</span></label>)}
      <label className="field"><span className="field-label">Justificación de exención, cuando corresponda</span><textarea className="input textarea" rows={5} value={form.aspectosEticos.exencion} onChange={e=>patch({aspectosEticos:{...form.aspectosEticos,exencion:e.target.value}})}/></label>
      <EditableRows title="Permisos y autorizaciones" rows={form.permisos} onChange={permisos=>patch({permisos})} blank={()=>({ente:'',detalle:'',estado:'pendiente'})} fields={[{key:'ente',label:'Comité o ente regulatorio'},{key:'detalle',label:'Detalle del trámite'},{key:'estado',label:'Estado del trámite'}]}/>
      <p className="field-hint">Registrar un trámite no sustituye el aval formal del ente competente. La fase experimental requiere los permisos que correspondan.</p>
    </div>;
  }


  if (step === 13) {
    return (
      <label className="field">
        <span className="field-label">Referencias</span>
        <textarea
          className="input textarea"
          rows={10}
          aria-label="Referencias" value={form.referencias}
          onChange={(e) => patch({ referencias: e.target.value })}
        />
      </label>
    );
  }

  if (step === 14) {
    return (
      <div className="field" role="group" aria-labelledby="decl-jurada-label">
        <span className="field-label" id="decl-jurada-label">
          Declaración jurada
        </span>
        <label className="radio-choice selected">
          <input
            type="checkbox"
            checked={form.declaracion}
            onChange={(e) => patch({ declaracion: e.target.checked })}
          />
          <span className="radio-dot" />
          Confirmo que la información es veraz y completa según el formulario
          VIE 2027.
        </label>
      </div>
    );
  }

  if (step === 15) {
    return <div className="stack-md">{documentos??<p>Guarde primero el borrador para habilitar la carga de documentos.</p>}<p>Imágenes y videos quedan fuera del alcance de carga de esta entrega; no se presenta selección local como almacenamiento.</p></div>;
  }

  return (
    <div className="review-summary stack-md">
      <strong>{form.titulo}</strong>
      <p>
        Modalidad: {form.modalidad}. Escuela: {form.escuela}. Palabras clave:{" "}
        {form.palabras}.
      </p>
      {([
        ["Resumen",form.resumen],["Abstract",form.abstract],["Problema",form.problema],["Objetivos",form.objetivos],
        ["Estado del arte",form.estadoArte],["Metodología",form.metodologia],["Divulgación",form.divulgacion],["Hoja de ruta",form.hojaRuta],["Referencias",form.referencias],
      ] as const).map(([label,value])=><section key={label}><h3>{label}</h3><p style={{whiteSpace:"pre-wrap"}}>{value||"Sin completar"}</p></section>)}
      <p>Equipo: {form.equipo.map(p=>p.nombre).join(", ")||"Sin participantes"}. Actividades: {form.actividades.length}. Productos: {form.compromisos.length}.</p>
      <p>Total solicitado: {formatCRC(form.presupuesto.reduce((sum,r)=>sum+r.operativo+r.duraderos,0))}. Fuentes adicionales: {form.fuentes.length}.</p>
      <p>Declaración jurada: {form.declaracion?"Aceptada":"Pendiente de aceptación"}.</p>
      <p>
        «Guardar y salir» deja el expediente en borrador. «Enviar a revisión»
        guarda los campos del formulario y sus registros asociados y pasa la propuesta a la bandeja de evaluación.
      </p>
    </div>
  );
}
