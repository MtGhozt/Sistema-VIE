import { useEffect, useState } from "react";
import { apiJson } from "../api/client";
import type { ParticipanteInput } from "../api/propuestas";

const TIPOS_HORA = ["VIE", "VIE-Centros", "CONS", "REC", "DOC", "VIESA"];
export function EquipoEditor({ equipo, onChange }: { equipo: ParticipanteInput[]; onChange: (rows: ParticipanteInput[]) => void }) {
  const [people, setPeople] = useState<{ id: number; nombre: string; instancia: string }[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void apiJson<typeof people>("/api/personas").then(rows => { if (active) setPeople(rows); }).catch(() => { if (active) setError("No se pudo consultar el catálogo de personas. Puede reabrir este paso para reintentar."); });
    return () => { active = false; };
  }, []);
  function update(index: number, patch: Partial<ParticipanteInput>) { onChange(equipo.map((r,i) => i === index ? { ...r, ...patch } : r)); }
  function add(tipo: ParticipanteInput["tipo"]) { onChange([...equipo, { tipo, nombre: "", orcid: null, instancia: "", rol: "", periodo: "", horas: [] }]); }
  return <div className="stack-lg">
    {error && <p role="alert">{error}</p>}
    {equipo.map((row,index) => <fieldset className="card stack-md" key={row.id ?? `nuevo-${index}`}>
      <legend>{index + 1}. {row.tipo === "externo" ? "Persona colaboradora externa" : "Persona investigadora TEC"}</legend>
      {row.tipo === "funcionario_tec" && <label className="field"><span className="field-label">Seleccionar persona TEC</span>
        <select className="input" value={row.idUsuario ?? ""} onChange={e => { const p = people.find(p => p.id === Number(e.target.value)); update(index, { idUsuario: p?.id ?? null, nombre: p?.nombre ?? row.nombre, instancia: p?.instancia ?? row.instancia }); }}>
          <option value="">Captura manual / seleccionar…</option>{people.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select></label>}
      <div className="form-grid two-col">
        {([['nombre','Nombre'],['orcid','ORCID'],['instancia',row.tipo === 'externo' ? 'Institución / empresa' : 'Instancia académica'],['rol','Rol en el proyecto'],['periodo','Periodo de nombramiento'],['titularCons','Persona titular de horas CONS (si aplica)']] as const).map(([key,label]) => <label className="field" key={key}><span className="field-label">{label}</span><input className="input" readOnly={Boolean(row.idUsuario) && (key === 'nombre' || key === 'instancia')} value={row[key] ?? ''} onChange={e => update(index, { [key]: e.target.value })} /></label>)}
      </div>
      {row.horas.map((h,j) => <div className="form-grid two-col" key={j}>
        <label className="field"><span className="field-label">Tipo de horas</span><select className="input" value={h.tipo} onChange={e => update(index,{horas:row.horas.map((h,k)=>k===j?{...h,tipo:e.target.value}:h)})}>{TIPOS_HORA.map(t=><option key={t}>{t}</option>)}</select></label>
        <label className="field"><span className="field-label">Horas semanales</span><input className="input" type="number" min="0" step="0.01" value={h.cantidad} onChange={e=>update(index,{horas:row.horas.map((h,k)=>k===j?{...h,cantidad:Number(e.target.value)}:h)})}/></label>
        <button type="button" className="btn btn-secondary" aria-label={`Quitar ${h.tipo || "tipo de horas"} de ${row.nombre || `la persona ${index + 1}`}`} onClick={()=>update(index,{horas:row.horas.filter((_,k)=>k!==j)})}>Quitar tipo de horas</button>
      </div>)}
      <div className="action-row"><button type="button" className="btn btn-secondary" disabled={row.horas.length===TIPOS_HORA.length} aria-label={`Agregar tipo de horas a ${row.nombre || `la persona ${index + 1}`}`} onClick={()=>update(index,{horas:[...row.horas,{tipo:TIPOS_HORA.find(t=>!row.horas.some(h=>h.tipo===t)) ?? 'VIE',cantidad:0}]})}>Agregar tipo de horas</button>
      <button type="button" className="btn btn-secondary" aria-label={`Quitar participante ${index + 1}${row.nombre ? `: ${row.nombre}` : ""}`} onClick={()=>onChange(equipo.filter((_,i)=>i!==index))}>Quitar participante</button></div>
    </fieldset>)}
    <div className="action-row"><button type="button" className="btn btn-secondary" onClick={()=>add('funcionario_tec')}>Agregar persona TEC</button><button type="button" className="btn btn-secondary" onClick={()=>add('externo')}>Agregar persona externa</button></div>
  </div>;
}
