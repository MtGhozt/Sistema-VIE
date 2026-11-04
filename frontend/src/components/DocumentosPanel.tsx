import {useEffect,useState} from 'react';
import {apiJson,downloadFile} from '../api/client';
import {useToast} from './toast/ToastContext';
type Doc={id:number;nombre:string;tipo:string;version:number;bytes:string|null;disponible:boolean;retirada:boolean};
export function DocumentosPanel({id,editable=false}:{id:number;editable?:boolean}){
 const [docs,setDocs]=useState<Doc[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');const {showToast}=useToast();
 async function reload(){setDocs(await apiJson<Doc[]>(`/api/propuestas/${id}/documentos`));}
 useEffect(()=>{let active=true;apiJson<Doc[]>(`/api/propuestas/${id}/documentos`).then(d=>{if(active)setDocs(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
 async function upload(file:File|undefined){if(!file)return;setBusy(true);setError('');try{await apiJson(`/api/propuestas/${id}/documentos`,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(file.name)},body:file});await reload();showToast('Archivo guardado en el expediente','success');}catch(e){setError(e instanceof Error?e.message:'No se pudo cargar');}finally{setBusy(false);}}
 return <section className="stack-md expediente-documentos" aria-busy={busy}><h2>Documentos del expediente</h2><p>PDF, DOCX o XLSX, hasta 10 MiB. Cada carga con el mismo nombre crea una versión; los documentos históricos sin binario no se pueden descargar.</p>
 {busy&&<p className="sr-only" role="status" aria-live="polite">Procesando documento…</p>}
 {error&&<p role="alert">{error}</p>}{editable&&<label className="field"><span className="field-label">Adjuntar documento</span><input aria-label="Adjuntar documento" type="file" accept=".pdf,.docx,.xlsx" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label>}
 {!docs.length&&<p>No hay documentos guardados.</p>}
 {docs.map(d=><div className="action-row documento-version" key={d.id}><span>{d.nombre} · v{d.version} {d.retirada?'· Retirado':''}</span><button type="button" className="btn btn-secondary" disabled={!d.disponible||d.retirada||busy} onClick={()=>void downloadFile(`/api/propuestas/${id}/documentos/${d.id}`,d.nombre).catch(e=>setError(e.message))}>Descargar {d.nombre} v{d.version}</button>{editable&&d.disponible&&!d.retirada&&<button type="button" className="btn btn-ghost" disabled={busy} onClick={async()=>{setBusy(true);try{await apiJson(`/api/propuestas/${id}/documentos/${d.id}`,{method:'DELETE'});await reload();}catch(e){setError(e instanceof Error?e.message:'No se pudo retirar');}finally{setBusy(false);}}}>Retirar versión {d.version}</button>}</div>)}
 </section>;
}
