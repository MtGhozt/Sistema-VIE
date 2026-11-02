import {useEffect,useState} from 'react';
import {apiJson} from '../../api/client';
export function ConsejoReconsideracion({id,onAction}:{id:number;onAction:(action:string,payload?:unknown)=>Promise<boolean>}){
 const [request,setRequest]=useState<{motivo:string;fecha_solicitud:string}|null>(null),[reason,setReason]=useState(''),[error,setError]=useState('');
 useEffect(()=>{void apiJson<{motivo:string;fecha_solicitud:string}[]>(`/api/evaluaciones/propuestas/${id}/reconsideracion`).then(d=>setRequest(d[0]??null)).catch(e=>setError(e.message));},[id]);
 return <section className="card stack-md"><h2>Aval rechazado · reconsideración</h2>{error&&<p role="alert">{error}</p>}{request?<><p>Solicitud de la coordinación: {request.motivo}</p><label className="field"><span>Fundamento para autorizar nuevo ciclo</span><textarea aria-label="Fundamento para autorizar nuevo ciclo" className="input textarea" value={reason} onChange={e=>setReason(e.target.value)}/></label><button type="button" className="btn btn-primary" disabled={!reason.trim()} onClick={()=>void onAction('council-reconsider',{texto:reason})}>Autorizar nuevo ciclo de Consejo</button></>:<p>No hay solicitud pendiente de la coordinación. El rechazo permanece vigente.</p>}</section>;
}
