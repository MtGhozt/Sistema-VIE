import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {fetchSavedRubric} from '../../api/evaluaciones';
export function MiEvaluacionResumen({id}:{id:number}){
 const [data,setData]=useState<Awaited<ReturnType<typeof fetchSavedRubric>>|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;fetchSavedRubric(id,'comite').then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
 return <section className="card stack-md" aria-label="Mi evaluación del expediente"><h2>Mi evaluación del expediente</h2>{error?<p role="alert">{error}</p>:!data?<p role="status">Consultando mi evaluación…</p>:!data.asignado?<p>No está asignado a la evaluación de este expediente.</p>:<><p>Ciclo {data.ciclo} · {data.version} · {data.estado==='completada'?'Evaluación entregada':data.estado==='en_progreso'?'Borrador de evaluación':'Pendiente de evaluar'}</p><Link className="btn btn-primary" to={`/evaluaciones?propuesta=${id}${data.estado==='completada'?'&evaluacion=completada':''}`}>{data.estado==='completada'?'Consultar mi evaluación entregada':'Abrir mi evaluación'}</Link></>}</section>;
}
