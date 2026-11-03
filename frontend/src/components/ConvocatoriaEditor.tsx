import { useState } from "react";
import { patchConvocatoria, type ConvocatoriaDetalle } from "../api/convocatorias";
import { EditableRows } from "./EditableRows";
export function ConvocatoriaEditor({value,onSaved,onCancel}:{value:ConvocatoriaDetalle;onSaved:()=>void;onCancel:()=>void}){
  const [nombre,setNombre]=useState(value.nombre),[descripcion,setDescripcion]=useState(value.descripcion??''),[apertura,setApertura]=useState(value.fechaApertura.slice(0,10)),[cierre,setCierre]=useState(value.fechaCierre.slice(0,10)),[presupuesto,setPresupuesto]=useState(value.presupuestoEstimado==null?'':String(value.presupuestoEstimado));
  const [hitos,setHitos]=useState(value.hitos.map(h=>({id:h.id,nombre:h.nombre,responsable:h.responsable,fechaInicio:h.fechaInicio.slice(0,10),fechaFin:h.fechaFin.slice(0,10)})));
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  return <form className="stack-lg" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{await patchConvocatoria(value.id,{nombre,descripcion,fechaApertura:apertura,fechaCierre:cierre,presupuestoEstimado:presupuesto===''?null:Number(presupuesto),hitos});onSaved();}catch(err){setError(err instanceof Error?err.message:'No se guardó la convocatoria');}finally{setBusy(false);}}}>
    <h3>Editar convocatoria y cronograma</h3>{error&&<p role="alert">{error}</p>}
    <fieldset disabled={busy} className="stack-md" style={{border:0,padding:0,margin:0,minWidth:0}}>
      <label className="field"><span className="field-label">Nombre de la convocatoria</span><input className="input" value={nombre} onChange={e=>setNombre(e.target.value)} required/></label>
      <label className="field"><span className="field-label">Descripción</span><textarea aria-label="Descripción" className="input textarea" value={descripcion} onChange={e=>setDescripcion(e.target.value)}/></label>
      <div className="form-grid two-col"><label className="field"><span className="field-label">Fecha de apertura</span><input className="input" type="date" value={apertura} onChange={e=>setApertura(e.target.value)} required/></label><label className="field"><span className="field-label">Fecha de cierre</span><input className="input" type="date" value={cierre} onChange={e=>setCierre(e.target.value)} required/></label></div>
      <label className="field"><span className="field-label">Presupuesto estimado (₡)</span><input className="input" type="number" min="0" step="0.01" value={presupuesto} onChange={e=>setPresupuesto(e.target.value)}/></label>
      <EditableRows title="Hitos del cronograma" rows={hitos} onChange={setHitos} blank={()=>({id:0,nombre:'',responsable:'VIE',fechaInicio:apertura,fechaFin:cierre})} fields={[{key:'nombre',label:'Nombre del hito'},{key:'responsable',label:'Responsable'},{key:'fechaInicio',label:'Inicio (AAAA-MM-DD)'},{key:'fechaFin',label:'Fin (AAAA-MM-DD)'}]}/>
      <div className="action-row"><button className="btn btn-primary" type="submit">Guardar convocatoria y cronograma</button><button className="btn btn-secondary" type="button" onClick={onCancel}>Cancelar edición</button></div>
    </fieldset>
  </form>;
}
