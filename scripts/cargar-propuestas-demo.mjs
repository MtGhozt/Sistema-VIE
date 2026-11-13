import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {demoProposal,demoTopics} from './propuestas-demo-data.mjs';
const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1],profile=get('--perfil'),count=Number(get('--cantidad'));
if(!['pruebas','desarrollo'].includes(profile)||!Number.isInteger(count)||count<8||count>80)throw new Error('Perfil o cantidad inválidos. Use cargar-propuestas-demo.sh.');
if(!process.env.DATABASE_URL)throw new Error('Falta DATABASE_URL.');
const expected=profile==='pruebas'?'fondos_vie_test':'fondos_vie';
if(new URL(process.env.DATABASE_URL).pathname!==`/${expected}`)throw new Error('El perfil no coincide con la base indicada.');
const requireBackend=createRequire(new URL('../backend/package.json',import.meta.url)),{Pool}=requireBackend('pg'),pool=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});
const run=new Date().toISOString().replace(/[:.]/g,'-'),root=fileURLToPath(new URL('../',import.meta.url)),batch='PIC-'+run;
const results=[],sessions=new Map();let server,appPool,api,conv;
async function call(route,role,method='GET',body){const u=sessions.get(role);const r=await fetch(api+route,{method,signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json',...(u?{'X-Demo-User-Id':String(u.id),'X-Demo-Role':u.roleCode}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const d=r.status===204?null:await r.json();if(!r.ok)throw new Error(`${method} ${route}: ${d.error??r.status}`);return d;}
const states=['borrador','enviada','pi_en_revision','no_requerido_pendiente','no_requerido_certificado','recepcion_comite','en_subsanacion','evaluacion_pendiente','evaluacion_borrador','evaluacion_parcial','dictaminada','en_consejo','avalada','aprobada','rechazada','rechazo_aval'];
async function action(id,name,role,body={}){if(name==='committee-score'){const meta=await call(`/evaluaciones/propuestas/${id}/rubrica`,role);body={...body,ciclo:meta.ciclo};}return call(`/evaluaciones/propuestas/${id}/acciones`,role,'POST',{action:name,payload:body});}
try{
 const identity=(await pool.query('SELECT current_database() AS name')).rows[0].name;if(identity!==expected)throw new Error('Base inesperada.');
 const {createApp}=await import('../backend/dist/app.js');({pool:appPool}=await import('../backend/dist/db.js'));
 server=await new Promise(resolve=>{const s=createApp().listen(0,'127.0.0.1',()=>resolve(s));});api=`http://127.0.0.1:${server.address().port}/api`;
 for(const role of ['investigador','vie_publicacion','vinculacion','comite_asistente','comite_evaluador','consejo_asistente','consejo','direccion_escuela','gestora_vie','cie','direccion_investigacion']){const d=await call('/demo/login',null,'POST',{email:`${role}@tec.ac.cr`,password:'prototipo2026',roleCode:role});sessions.set(role,d.user);}
 for(const n of [2,3]){const d=await call('/demo/login',null,'POST',{email:`comite_evaluador${n}@tec.ac.cr`,password:'prototipo2026',roleCode:'comite_evaluador'});sessions.set('e'+n,d.user);}
 const user=sessions.get('investigador'),person=(await pool.query('SELECT nombre_completo AS nombre FROM usuario WHERE id_usuario=$1',[user.id])).rows[0];
 const now=new Date(),parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),p=k=>parts.find(v=>v.type===k).value;
 const today=`${p('year')}-${p('month')}-${p('day')}`,end=new Date(today+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+60);const closing=end.toISOString().slice(0,10);
 conv=await call('/convocatorias','vie_publicacion','POST',{nombre:`[DEMO ${batch}] Convocatoria para validación manual`,descripcion:'Lote de pruebas; no es una convocatoria institucional real.',fechaApertura:today,fechaCierre:closing,presupuestoEstimado:40000000,estado:'activa',hitos:[{nombre:'Recepción de expedientes demostrativos',responsable:'VIE demo',fechaInicio:today,fechaFin:closing}]});
 const {rubricCriteria}=await import('../backend/dist/rubricas.js');
 for(let i=0;i<count;i++){
  const target=states[i%states.length],payload=demoProposal({index:i,user:{id:user.id,nombre:person.nombre},year:Math.max(2027,now.getFullYear()+1),batch});
  const noRequired=target.startsWith('no_requerido');payload.requiereDictamenPi=!noRequired;payload.preguntasGenerales=payload.preguntasGenerales.map(q=>q.numero===8?{...q,respuesta:noRequired?'No':'Sí'}:q);if(payload.formularioGenerales)payload.formularioGenerales.q8=noRequired?'No':'Sí';
  const created=await call('/propuestas','investigador','POST',{...payload,idConvocatoria:conv.id});const id=created.id;
  const expected=target==='borrador'?'borrador':['enviada','pi_en_revision','no_requerido_pendiente'].includes(target)?'enviada':target==='en_subsanacion'?target:['dictaminada','en_consejo'].includes(target)?'dictaminada':['avalada','aprobada','rechazada','rechazo_aval'].includes(target)?target:'en_evaluacion';
  const entry={id,codigo:created.codigo,titulo:created.titulo,escenario:target,estadoEsperado:expected,estadoActual:'borrador',origen:demoTopics[i%demoTopics.length].source??'Contenido sintético realista',simulado:true};results.push(entry);
  // Un adjunto real (plantilla oficial), sin inventar un oficio institucional firmado.
  const template=await fetch(api+'/plantillas/presupuesto',{headers:{'X-Demo-User-Id':String(user.id),'X-Demo-Role':'investigador'}});if(!template.ok)throw new Error('No se pudo recuperar la plantilla oficial');
  const upload=await fetch(api+`/propuestas/${id}/documentos`,{method:'POST',headers:{'X-Demo-User-Id':String(user.id),'X-Demo-Role':'investigador','Content-Type':'application/octet-stream','X-File-Name':'presupuesto-oficial-demo.xlsx'},body:Buffer.from(await template.arrayBuffer())});if(upload.status!==201)throw new Error('No se pudo adjuntar la plantilla oficial: '+await upload.text());
  if(target!=='borrador'){
   await call(`/propuestas/${id}/enviar`,'investigador','POST',{});
   if(target==='pi_en_revision')await action(id,'pi-start','vinculacion');
   else if(target==='no_requerido_certificado')await action(id,'pi-not-required','vinculacion',{fundamento:'Revisión demostrativa: los productos comprometidos no requieren dictamen PI. Certificación para pruebas, sin validez institucional.'});
   else if(!['enviada','no_requerido_pendiente'].includes(target)){
    await action(id,'pi','vinculacion',{potencial:'Sí',innovacion:'Sí',tipoActivo:'Software y procedimiento demostrativo',tipoPI:'Derecho de autor; valoración de protección industrial según resultados',analisis:'Dictamen simulado para verificar el flujo; sin validez institucional.',novedad:'Evaluación demostrativa del aporte técnico descrito en el expediente.',titularidad:'Participación del TEC según el equipo de demostración.',recomendaciones:'Revisar la protección antes de divulgar resultados.'});
    if(target==='en_subsanacion')await action(id,'return','comite_asistente',{texto:'Aclare el alcance del problema y los tres objetivos específicos. Devolución simulada para pruebas.',secciones:['objetivos']});
    else if(target!=='recepcion_comite'){
     await action(id,'committee-ready','comite_asistente');
     const scores=Object.fromEntries(rubricCriteria(payload.modalidad).map(c=>[c.key,{score:8,reason:'Evaluación simulada: el expediente describe actividades verificables y productos coherentes con el criterio. Sin validez académica.'}]));
     if(target==='evaluacion_borrador')await action(id,'save-rubric','comite_evaluador',{scores,ciclo:(await call(`/evaluaciones/propuestas/${id}/rubrica`,'comite_evaluador')).ciclo,productosCumplen:true});
     else if(target==='evaluacion_parcial')await action(id,'committee-score','comite_evaluador',{scores,productosCumplen:true});
     else if(target!=='evaluacion_pendiente'){
      for(const evaluator of ['comite_evaluador','e2','e3'])await action(id,'committee-score',evaluator,{scores,productosCumplen:true});
      await action(id,'committee-confirm','comite_asistente',{texto:'Consolidado simulado de tres evaluaciones independientes para pruebas; sin validez institucional.'});
      if(target!=='dictaminada'){
       await action(id,'send-council','consejo_asistente',{texto:'Preparación y remisión demostrativas para sesión del Consejo.'});
       if(target!=='en_consejo'){
        await action(id,target==='rechazo_aval'?'council-reject':'council-approve','consejo',{texto:'Acuerdo simulado del Consejo, sin validez institucional.',oficio:`DEMO-AV-${id}`});
        if(!['avalada','rechazo_aval'].includes(target)){
         await action(id,'communicate-aval','direccion_escuela');await action(id,'vie-checklist','gestora_vie',{checks:Object.fromEntries(['propuesta','pi','evaluacion_comite','oficio_comite','aval','respaldos'].map(k=>[k,true]))});await action(id,'send-cie','gestora_vie');await action(id,target==='aprobada'?'cie-approve':'cie-reject','cie',{texto:'Resolución simulada de CIE, exclusivamente para pruebas de software.'});await action(id,'notify-resolution','direccion_investigacion');
        }
       }
      }
     }
    }
   }
  }
  const saved=await call(`/propuestas/${id}`,'investigador');entry.estadoActual=saved.estadoActual;
  if(saved.estadoActual!==expected)throw new Error(`Estado inesperado en ${saved.codigo}: ${saved.estadoActual}, esperado ${expected}.`);
  console.log(`${entry.codigo} · ${entry.estadoActual} · ${entry.titulo}`);
 }
 console.log(`Lote completo: ${count} propuestas para investigador@tec.ac.cr en ${expected}.`);
}catch(e){console.error('Carga detenida:',e.message);console.error('Los expedientes ya creados se conservan y se registran en el reporte. No se modifican estados por SQL.');results.push({error:e.message});process.exitCode=1;}
finally{
 if(server)await new Promise(resolve=>server.close(resolve));if(appPool)await appPool.end();await pool.end();
 const output=path.join(root,'var/datos-demo',batch);await mkdir(output,{recursive:true});await writeFile(path.join(output,'reporte.json'),JSON.stringify({batch,perfil:profile,base:expected,idConvocatoria:conv?.id,simulado:true,nota:'Únicamente título, modalidad, período y presupuesto de PIELS proceden del memorando. Evaluaciones, identificaciones, equipo y demás contenido son demostrativos.',results},null,2)+'\n');console.log(`Reporte: ${path.relative(root,output)}/reporte.json`);
}
