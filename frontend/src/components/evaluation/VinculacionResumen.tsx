import {useEffect,useState} from 'react';
import {apiJson} from '../../api/client';
import {CollapsibleBlock} from '../CollapsibleBlock';
import {dateLabel} from '../../data/convocatoriaUi';
type Registro={estado:string|null;enRevision?:boolean;fecha:string|null;fundamentoNoRequerido:string|null;form:Record<string,string>|null};
const labels:Record<string,string>={potencial:'Potencial de protección',innovacion:'Innovación',tipoActivo:'Resultado o activo identificable',tipoPI:'Mecanismo de PI',novedad:'Novedad',titularidad:'Titularidad',divulgacion:'Recomendaciones de divulgación',confidencialidad:'Confidencialidad',analisis:'Análisis técnico',recomendaciones:'Recomendaciones',oficio:'Oficio',fecha:'Fecha del dictamen'};
export function VinculacionResumen({id}:{id:number}){
 const [data,setData]=useState<Registro|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;apiJson<Registro>(`/api/evaluaciones/propuestas/${id}/pi`).then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
 return <section className="card stack-md pi-record-review" aria-label="Registro de Propiedad Intelectual"><h2>Registro de Propiedad Intelectual</h2>{error?<p role="alert">{error}</p>:!data?<p role="status">Consultando registro PI…</p>:<><p>Estado: <strong>{data.estado==='emitido'?'Dictamen emitido':data.estado==='no_requerido'?'No requerido certificado':data.enRevision?'En revisión de PI':'Pendiente de dictamen o certificación'}</strong></p>{data.fundamentoNoRequerido&&<div><h3>Fundamento de no requerimiento</h3><p className="preserve-lines">{data.fundamentoNoRequerido}</p></div>}{data.fecha&&<p>Fecha: {dateLabel(data.fecha).replaceAll('-','/')}</p>}{data.form&&<CollapsibleBlock title="Contenido del dictamen PI" defaultOpen><dl className="pi-record-fields">{Object.entries(data.form).filter(([,value])=>value).map(([key,value])=><div key={key}><dt>{labels[key]??key}</dt><dd className="preserve-lines">{key==='fecha'?dateLabel(value).replaceAll('-','/'):value}</dd></div>)}</dl></CollapsibleBlock>}</>}</section>;
}
