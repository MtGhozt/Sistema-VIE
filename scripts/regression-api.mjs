import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { testEnvironment, root } from './test-environment.mjs';
const run = new Date().toISOString().replace(/[:.]/g,'-');
const output = path.join(root,'correcciones/evidencias',`${run}-regresion-api`);
const results = [];
let env;
const sessions = new Map();
let serial = 0;
async function check(name,fn) {
  try { await fn(); results.push({name,status:'PASA'}); }
  catch(error) { results.push({name,status:'FALLA',detail:error.message}); }
  console.log(`${results.at(-1).status} | ${name} | ${results.at(-1).detail??''}`);
}
async function call(route, role, method='GET', body, expected=200) {
  const u=sessions.get(role);
  assert.ok(!role || u, `Sesión ${role} no disponible`);
  const r=await fetch(env.api+route,{method,headers:{'Content-Type':'application/json',...(u?{'X-Demo-User-Id':String(u.id),'X-Demo-Role':u.roleCode}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
  const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}
  assert.equal(r.status,expected,`${method} ${route}: ${text}`);return data;
}
async function draft() {
  const u=sessions.get('investigador');
  const result=await env.pool.query(`INSERT INTO propuesta(codigo,id_convocatoria,id_coordinador,id_escuela,titulo,modalidad,estado_actual,etapa_flujo)
    SELECT $1,(SELECT id_convocatoria FROM convocatoria ORDER BY id_convocatoria LIMIT 1),$2,id_escuela,'Regresión aislada','aplicada','borrador',0 FROM usuario WHERE id_usuario=$2 RETURNING id_propuesta`,[`RG-${Date.now()}-${++serial}`,u.id]);
  return result.rows[0].id_propuesta;
}
const patch=(id,data,status=200)=>call(`/propuestas/${id}`,'investigador','PATCH',data,status);
const detail=id=>call(`/propuestas/${id}`,'investigador');
const action=(id,role,action,payload={},status=200)=>call(`/evaluaciones/propuestas/${id}/acciones`,role,'POST',{action,payload},status);
try {
  env=await testEnvironment();
  for (const role of ['investigador','vie_publicacion','vinculacion','comite_asistente','comite_evaluador','consejo_asistente','consejo','direccion_escuela','gestora_vie','cie','direccion_investigacion','admin']) {
    await check(`Login ${role}`,async()=>{const data=await call('/demo/login',null,'POST',{email:`${role}@tec.ac.cr`,password:'prototipo2026',roleCode:role});assert.equal(data.user.roleCode,role);sessions.set(role,data.user);});
  }
  await check('Migraciones conservan compromisos sin aceptación implícita',async()=>{
    const r=await env.pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='propuesta' AND column_name IN ('declaracion_aceptada','resguardo_repositorio','resguardo_tecnico')");assert.equal(r.rowCount,3);
    const id=await draft();const d=await detail(id);assert.equal(d.declaracion,false);assert.equal(d.resguardoRepositorio,false);
  });
  await check('Campos generales, ES/EN y preguntas sobreviven a relectura',async()=>{
    const id=await draft();await patch(id,{resumen:'Propio',abstractEn:'Own',keywordsEs:'uno,dos,tres,cuatro',keywordsEn:'one,two',estadoArte:'Arte propio',hojaRuta:'Ruta propia',referencias:'Referencias propias',divulgacion:'Plan propio',fechaInicio:'2027-01-15',fechaFin:'2028-06-30',preguntasGenerales:[{numero:2,respuesta:'Sí',detalle:'Proyecto\nRelación'}]});
    await patch(id,{keywordsEs:'agua,suelo,riesgo,clima',resumen:''});const d=await detail(id);assert.equal(d.resumen,'');assert.deepEqual(d.keywordsEn,['one','two']);assert.equal(d.estadoArte,'Arte propio');assert.equal(d.preguntasGenerales[0].detalle,'Proyecto\nRelación');assert.equal(d.fechaInicio.slice(0,10),'2027-01-15');
  });
  await check('Error de keywords revierte título y no cae la API',async()=>{
    const id=await draft();await patch(id,{titulo:'Antes'});await patch(id,{titulo:'No debe persistir',keywordsEs:'repetida,repetida'},409);assert.equal((await detail(id)).titulo,'Antes');assert.equal((await call('/health')).database,'up');
  });
  await check('Equipo interno/externo, tipos de hora y CRUD real',async()=>{
    const id=await draft();const u=sessions.get('investigador');const equipo=[{tipo:'funcionario_tec',idUsuario:u.id,nombre:'Ignorar nombre ajeno',instancia:'',orcid:null,rol:'Coordinación',periodo:'2027',horas:[{tipo:'VIE',cantidad:10},{tipo:'DOC',cantidad:2}]},{tipo:'externo',nombre:'Externa de prueba',instancia:'Entidad de prueba',orcid:null,rol:'Colaboración',periodo:'2027',horas:[]}];
    await patch(id,{equipo});const d=await detail(id);assert.equal(d.equipo.length,2);assert.equal(d.equipo[0].nombre,u.name);assert.equal(d.equipo[0].horas.length,2);assert.equal(d.teamTec.length,1);assert.equal(d.teamExternal[0].nombre,'Externa de prueba');
    await patch(id,{equipo:[d.equipo[0]]});assert.equal((await detail(id)).equipo.length,1);
  });
  await check('ID ajeno de integrante no permite modificar otra propuesta',async()=>{
    const a=await draft(),b=await draft();await patch(a,{equipo:[{tipo:'externo',nombre:'Protegida',instancia:'Entidad',horas:[]}]});const member=(await detail(a)).equipo[0];await patch(b,{equipo:[{...member,nombre:'Cambio ajeno'}]},400);assert.equal((await detail(a)).equipo[0].nombre,'Protegida');
  });
  await check('Presupuesto exacto, fuentes y reversión de montos inválidos',async()=>{
    const id=await draft();await patch(id,{fechaInicio:'2027-01-15',presupuesto:[{anio:2027,operativo:0.1,duraderos:0.2}],fuentes:[{tipo:'externo',anio:2027,monto:15.5,oficio:'OF-TEST'}]});const d=await detail(id);assert.equal(d.presupuesto[0].duraderos,0.2);assert.equal(d.fuentes[0].monto,15.5);const total=await env.pool.query('SELECT monto_total FROM propuesta_presupuesto_anual WHERE id_propuesta=$1',[id]);assert.equal(total.rows[0].monto_total,'0.30');
    await patch(id,{titulo:'No guardar',presupuesto:[{anio:2027,operativo:-1,duraderos:0}]},400);assert.notEqual((await detail(id)).titulo,'No guardar');assert.equal((await detail(id)).presupuesto[0].operativo,0.1);
    await patch(id,{presupuesto:[{anio:2028,operativo:0,duraderos:1}]},400);
  });
  await check('Ética y productos se recuperan, editan y eliminan',async()=>{
    const id=await draft();await patch(id,{aspectosEticos:{humanos:true,biodiversidad:false,animales:false,indigenas:false,exencion:'No aplica exención'},permisos:[{ente:'CEC',detalle:'Trámite propio',estado:'pendiente'}],compromisos:[{ambito:'adicional',codigo:'OP-TEST',descripcion:'Producto propio',cantidad:2,dictamen:null}]});const d=await detail(id);assert.equal(d.aspectosEticos.humanos,true);assert.equal(d.permisos[0].ente,'CEC');assert.equal(d.compromisos[0].cantidad,2);assert.deepEqual(d.productos,['Producto propio']);await patch(id,{compromisos:[],permisos:[]});assert.equal((await detail(id)).compromisos.length,0);
  });
  await check('Actividad/riesgo mantiene 0,07 meses y sus responsables',async()=>{
    const id=await draft();await patch(id,{equipo:[{tipo:'externo',nombre:'Responsable',horas:[]}]});const member=(await detail(id)).equipo[0];await patch(id,{actividades:[{objetivo:'Objetivo específico',actividad:'Actividad propia',resultado:'Resultado',responsabilidad:'Ejecuta',inicio:10,duracion:0.07,participantes:[member.id],riesgos:[{riesgo:'Riesgo propio',mitigacion:'Medida propia',responsable:'Responsable'}]}]});let d=await detail(id);assert.equal(d.actividades[0].duracion,0.07);assert.equal(d.actividades[0].participantes[0],member.id);assert.equal(d.actividades[0].riesgos[0].riesgo,'Riesgo propio');await patch(id,{actividades:d.actividades});d=await detail(id);assert.equal(d.actividades.length,1);await patch(id,{actividades:[]});assert.equal((await detail(id)).actividades.length,0);
  });
  await check('Declaración explícita y límites oficiales al enviar',async()=>{
    const id=await draft();await patch(id,{keywordsEs:'uno,dos,tres,cuatro'});await call(`/propuestas/${id}/enviar`,'investigador','POST',undefined,400);
    await patch(id,{declaracion:true,resumen:Array(501).fill('palabra').join(' ')});await call(`/propuestas/${id}/enviar`,'investigador','POST',undefined,400);
    for (const n of [3,7]) {await patch(id,{resumen:'Resumen',keywordsEs:Array.from({length:n},(_,i)=>`termino${i}`).join(',')});await call(`/propuestas/${id}/enviar`,'investigador','POST',undefined,400);}
    await patch(id,{resumen:Array(500).fill('palabra').join(' '),keywordsEs:'uno,dos,tres,cuatro'});const sent=await call(`/propuestas/${id}/enviar`,'investigador','POST');assert.equal(sent.estadoActual,'enviada');
  });
  await check('Guardar rúbrica conserva criterios y separa instancias y usuarios',async()=>{
    const {rubricCriteria}=await import('../backend/dist/rubricas.js');
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='en_evaluacion',etapa_flujo=2 WHERE id_propuesta=$1",[id]);
    const scores=Object.fromEntries(rubricCriteria('aplicada').map(c=>[c.key,{score:8,reason:'Justificación humana '+c.key}]));
    await action(id,'comite_evaluador','save-rubric',{scores});
    const saved=await call(`/evaluaciones/propuestas/${id}/rubrica?instancia=comite`,'comite_evaluador');assert.deepEqual(saved.scores,scores);
    assert.deepEqual((await call(`/evaluaciones/propuestas/${id}/rubrica?instancia=cie`,'cie')).scores,{});
    assert.deepEqual((await call(`/evaluaciones/propuestas/${id}/rubrica?instancia=comite`,'admin')).scores,{});
    await action(id,'comite_evaluador','save-rubric',{scores:{}} ,400);
    const count=await env.pool.query('SELECT count(*) FROM evaluacion_puntaje p JOIN evaluacion e ON e.id_evaluacion=p.id_evaluacion WHERE e.id_propuesta=$1',[id]);assert.equal(Number(count.rows[0].count),Object.keys(scores).length);
    await action(id,'comite_evaluador','committee-score',{scores,average:99,recommendation:'RECOMIENDA'});
    const result=await env.pool.query('SELECT calificacion_promedio,recomendacion FROM resultado_comite WHERE id_propuesta=$1',[id]);assert.notEqual(Number(result.rows[0].calificacion_promedio),99);assert.equal(result.rows[0].recomendacion,'no_recomienda');
  });
  await check('Envío concurrente produce un solo evento de historial',async()=>{
    const id=await draft();await patch(id,{declaracion:true,keywordsEs:'uno,dos,tres,cuatro'});
    const u=sessions.get('investigador');
    const responses=await Promise.all([1,2].map(()=>fetch(`${env.api}/propuestas/${id}/enviar`,{method:'POST',headers:{'X-Demo-User-Id':String(u.id),'X-Demo-Role':u.roleCode}})));
    assert.equal(responses.filter(r=>r.status===200).length,1);assert.ok(responses.every(r=>[200,400,409].includes(r.status)));
    const rows=await env.pool.query("SELECT count(*) FROM propuesta_historial_estado WHERE id_propuesta=$1 AND estado_nuevo='enviada'",[id]);assert.equal(Number(rows.rows[0].count),1);
    await patch(id,{titulo:'Edición después de envío'},400);
  });
  await check('Vinculación recupera el dictamen emitido y no mezcla propuestas',async()=>{
    const id=await draft(),other=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='enviada',etapa_flujo=1 WHERE id_propuesta=$1",[id]);
    const form={potencial:'Sí',innovacion:'No',tipoActivo:'Activo propio',tipoPI:'Autoría',novedad:'Novedad propia',titularidad:'Titularidad propia',divulgacion:'Recomendación propia',confidencialidad:'Análisis propio',analisis:'Dictamen humano propio',recomendaciones:'Recomendación humana',oficio:`CV-RG-${id}`,fecha:'2026-10-31'};
    await action(id,'vinculacion','pi',form);const saved=await call(`/evaluaciones/propuestas/${id}/pi`,'vinculacion');assert.deepEqual(saved.form,form);assert.equal((await call(`/evaluaciones/propuestas/${other}/pi`,'vinculacion')).form,null);
    await call(`/evaluaciones/propuestas/${id}/pi`,'investigador','GET',undefined,403);
  });
  await check('Checklist VIE persiste y bloquea remisión incompleta',async()=>{
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='avalada',etapa_flujo=4 WHERE id_propuesta=$1",[id]);
    await action(id,'gestora_vie','send-cie',{},409);
    const keys=['propuesta','pi','evaluacion_comite','oficio_comite','aval','respaldos'];
    const checks=Object.fromEntries(keys.map(k=>[k,true]));await action(id,'gestora_vie','vie-checklist',{checks:{...checks,pi:false}});await action(id,'gestora_vie','send-cie',{},409);
    await action(id,'gestora_vie','vie-checklist',{checks});const b=await call('/evaluaciones/bandeja','gestora_vie');assert.deepEqual(b.items.find(p=>p.id===id).vieChecks,checks);
    await action(id,'gestora_vie','vie-observation',{texto:'Comentario propio VIE'});const d=await detail(id);assert.ok(d.observaciones.includes('Comentario propio VIE'));const n=await env.pool.query('SELECT 1 FROM notificacion WHERE id_propuesta=$1 AND id_usuario_destino=$2',[id,sessions.get('investigador').id]);assert.equal(n.rowCount,1);
    await action(id,'gestora_vie','send-cie');
  });
  await check('Dos devoluciones conservan ciclos independientes',async()=>{
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='enviada',etapa_flujo=1 WHERE id_propuesta=$1",[id]);
    await action(id,'comite_asistente','return',{texto:'Primera devolución'});await action(id,'comite_asistente','return',{texto:'Segunda devolución'});
    const cycles=await env.pool.query("SELECT ciclo FROM revision_expediente WHERE id_propuesta=$1 AND etapa='comite' ORDER BY ciclo",[id]);assert.deepEqual(cycles.rows.map(r=>r.ciclo),[1,2]);
  });
  await check('Vista admin filtra sin cambiar identidad ni ampliar permisos',async()=>{
    const normal=await call('/evaluaciones/bandeja','vinculacion');const admin=await call('/evaluaciones/bandeja?vista=vinculacion','admin');assert.equal(admin.role,'vinculacion');assert.deepEqual(admin.items.map(p=>p.id),normal.items.map(p=>p.id));
    await call('/evaluaciones/bandeja?vista=admin','vinculacion','GET',undefined,403);await call('/evaluaciones/bandeja?vista=inventada','admin','GET',undefined,403);await call('/evaluaciones/bandeja','investigador','GET',undefined,403);
  });
  await check('CIE conserva fundamento y decisión cerrada rechaza sobrescritura',async()=>{
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='avalada',etapa_flujo=5 WHERE id_propuesta=$1",[id]);
    await action(id,'cie','cie-reject',{texto:'Fundamento humano propio'});const r=await env.pool.query('SELECT fundamento,resultado FROM resolucion_cie WHERE id_propuesta=$1',[id]);assert.equal(r.rows[0].fundamento,'Fundamento humano propio');assert.equal(r.rows[0].resultado,'rechazada');await action(id,'cie','cie-approve',{texto:'No sobrescribir'},409);
  });
  await check('Notificación concurrente única, por destinatario y lectura persistida',async()=>{
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='avalada',etapa_flujo=5 WHERE id_propuesta=$1",[id]);await action(id,'cie','cie-approve',{texto:'Resolución de prueba'});
    await Promise.all([action(id,'direccion_investigacion','notify-resolution'),action(id,'direccion_investigacion','notify-resolution')]);
    const r=await env.pool.query('SELECT id_notificacion FROM notificacion WHERE id_propuesta=$1',[id]);assert.equal(r.rowCount,1);const nid=String(r.rows[0].id_notificacion);
    assert.ok((await call('/notificaciones','investigador')).some(n=>n.id===nid));assert.ok(!(await call('/notificaciones','cie')).some(n=>n.id===nid));await call(`/notificaciones/${nid}/leida`,'cie','PATCH',undefined,404);await call(`/notificaciones/${nid}/leida`,'investigador','PATCH',undefined,204);assert.equal((await call('/notificaciones','investigador')).find(n=>n.id===nid).unread,false);
    const b=await call('/evaluaciones/bandeja','direccion_investigacion');assert.equal(b.items.find(p=>p.id===id).notificada,true);
  });
  await check('No notificar resolución inexistente ni aprobar borrador',async()=>{
    const id=await draft();await action(id,'admin','cie-approve',{texto:'No permitido'},400);await env.pool.query("UPDATE propuesta SET estado_actual='rechazada',etapa_flujo=6 WHERE id_propuesta=$1",[id]);await action(id,'direccion_investigacion','notify-resolution',{},409);
  });
  await check('Colisión real de código revierte creación y mantiene health',async()=>{
    const id=await draft();const seq=await env.pool.query('SELECT last_value,is_called FROM propuesta_id_propuesta_seq');const next=Number(seq.rows[0].last_value)+(seq.rows[0].is_called?1:0);const code=`PROP-${new Date().getFullYear()}-${String(next).padStart(3,'0')}`;
    const old=(await env.pool.query('SELECT codigo FROM propuesta WHERE id_propuesta=$1',[id])).rows[0].codigo;await env.pool.query('UPDATE propuesta SET codigo=$1 WHERE id_propuesta=$2',[code,id]);
    try {const conv=await env.pool.query("SELECT id_convocatoria FROM convocatoria WHERE estado='activa' LIMIT 1");assert.ok(conv.rows[0]);const before=Number((await env.pool.query('SELECT count(*) FROM propuesta')).rows[0].count);await call('/propuestas','investigador','POST',{titulo:'Debe revertirse',idConvocatoria:conv.rows[0].id_convocatoria,modalidad:'aplicada'},409);assert.equal(Number((await env.pool.query('SELECT count(*) FROM propuesta')).rows[0].count),before);assert.equal((await call('/health')).database,'up');}
    finally {await env.pool.query('UPDATE propuesta SET codigo=$1 WHERE id_propuesta=$2',[old,id]);}
  });
} catch(error){results.push({name:'Entorno',status:'BLOQUEADO',detail:error.message});}
finally {
  if(env)await env.close();await mkdir(output,{recursive:true});await writeFile(path.join(output,'reporte.json'),JSON.stringify({run,scope:'Regresión de correcciones; fixtures aislados, no certifica reglas ambiguas ni rúbrica pendiente.',results},null,2)+'\n');console.log(`Evidencia: ${path.relative(root,output)}`);process.exitCode=results.some(r=>r.status!=='PASA')?1:0;
}
