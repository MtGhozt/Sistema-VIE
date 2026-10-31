import type { ActividadInput, ParticipanteInput } from "../api/propuestas";
import { EditableRows } from "./EditableRows";
export function PlanEditor({ rows, equipo, onChange }: { rows:ActividadInput[]; equipo:ParticipanteInput[]; onChange:(rows:ActividadInput[])=>void }) {
  function update(i:number,patch:Partial<ActividadInput>){onChange(rows.map((r,j)=>j===i?{...r,...patch}:r));}
  return <div className="stack-lg">{rows.map((row,i)=><fieldset className="card stack-lg" key={row.id??i}><legend>Actividad {i+1}</legend>
    <div className="form-grid two-col">{([['objetivo','Objetivo específico'],['actividad','Descripción de la actividad'],['resultado','Resultado esperado'],['responsabilidad','Responsabilidad (ejecuta, supervisa, participa)']] as const).map(([key,label])=><label className="field" key={key}><span className="field-label">{label}</span><textarea className="input textarea" rows={2} value={row[key]??''} onChange={e=>update(i,{[key]:e.target.value})}/></label>)}
      <label className="field"><span className="field-label">Mes de inicio correlativo</span><input className="input" type="number" min="1" step="1" value={row.inicio} onChange={e=>update(i,{inicio:Number(e.target.value)})}/></label>
      <label className="field"><span className="field-label">Duración en meses (admite fracciones)</span><input className="input" type="number" min="0.01" step="0.01" value={row.duracion} onChange={e=>update(i,{duracion:Number(e.target.value)})}/></label>
    </div>
    <fieldset><legend>Personas responsables de la actividad</legend>{equipo.filter(p=>p.id).map(p=><label className="field" key={p.id}><span><input type="checkbox" checked={row.participantes.includes(p.id!)} onChange={e=>update(i,{participantes:e.target.checked?[...row.participantes,p.id!]:row.participantes.filter(id=>id!==p.id)})}/>{p.nombre}</span></label>)}
      {equipo.some(p=>!p.id)&&<p className="field-hint">Guarde el equipo y vuelva a abrir el borrador para asignar las personas nuevas.</p>}
    </fieldset>
    <EditableRows title="Riesgos y mitigación" rows={row.riesgos} onChange={riesgos=>update(i,{riesgos})} blank={()=>({riesgo:'',mitigacion:'',responsable:''})} fields={[{key:'riesgo',label:'Riesgo identificado'},{key:'mitigacion',label:'Medida de mitigación'},{key:'responsable',label:'Responsable de gestión'}]}/>
    <button className="btn btn-secondary" type="button" onClick={()=>onChange(rows.filter((_,j)=>i!==j))}>Quitar actividad</button>
  </fieldset>)}
    <button className="btn btn-secondary" type="button" onClick={()=>onChange([...rows,{objetivo:'',actividad:'',resultado:'',responsabilidad:'',inicio:1,duracion:1,participantes:[],riesgos:[]}])}>Agregar actividad</button>
    <p className="field-hint">El formulario oficial requiere al menos un riesgo por actividad y sus medidas de mitigación.</p>
  </div>;
}
