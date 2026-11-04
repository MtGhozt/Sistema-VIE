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
  const id=result.rows[0].id_propuesta;
  // Preparación aislada: estas pruebas unitarias de rutas no certifican el recorrido PI.
  await env.pool.query(`INSERT INTO pi_certificacion_no_requerido(id_propuesta,id_certificador,fundamento)
    SELECT $1,id_usuario,'Certificación sintética para aislar la ruta bajo prueba' FROM usuario WHERE correo_institucional='vinculacion@tec.ac.cr'`,[id]);
  await env.pool.query("UPDATE propuesta SET abstract_en='Fixture abstract' WHERE id_propuesta=$1",[id]);await stageFixture(id);
  const {assignCommittee,proposalRubric}=await import('../backend/dist/rubricas.js');const school=(await env.pool.query('SELECT id_escuela FROM propuesta WHERE id_propuesta=$1',[id])).rows[0].id_escuela;
  await assignCommittee(env.pool,id,school);await proposalRubric(env.pool,id,'aplicada');
  return id;
}
// Precondiciones sintéticas de pruebas aisladas; baseline-flow recorre las transiciones reales.
async function stageFixture(id){const p=(await env.pool.query('SELECT etapa_flujo FROM propuesta WHERE id_propuesta=$1',[id])).rows[0];if(p.etapa_flujo>0)await env.pool.query('UPDATE propuesta SET fecha_envio=NOW() WHERE id_propuesta=$1',[id]);
 if(p.etapa_flujo>=3)await env.pool.query("INSERT INTO resultado_comite(id_propuesta,recomendacion,calificacion_promedio,fundamento) VALUES($1,'recomienda',80,'Fixture de ruta') ON CONFLICT DO NOTHING",[id]);
 if(p.etapa_flujo>=4){await env.pool.query("INSERT INTO aval_consejo(id_propuesta,resultado,observaciones) VALUES($1,'aprueba','Fixture de ruta') ON CONFLICT DO NOTHING",[id]);await env.pool.query("INSERT INTO comunicacion_institucional(id_propuesta,tipo,id_emisor,confirmada,fecha_envio) SELECT $1,'aval_consejo',id_usuario,true,NOW() FROM usuario WHERE correo_institucional='direccion_escuela@tec.ac.cr'",[id]);}
 if(p.etapa_flujo>=5)await env.pool.query("INSERT INTO propuesta_historial_estado(id_propuesta,estado_nuevo,fecha_hora,observacion) VALUES($1,'avalada',NOW(),'Expediente remitido al CIE')",[id]);
}
async function finishCommittee(id,scores){for(const role of ['e2','e3'])await action(id,role,'committee-score',{scores});await action(id,'comite_asistente','committee-confirm',{texto:'Consolidación verificada de tres evaluadores'});}
const patch=(id,data,status=200)=>call(`/propuestas/${id}`,'investigador','PATCH',data,status);
const detail=id=>call(`/propuestas/${id}`,'investigador');
async function action(id,role,operation,payload={},status=200){
 if(['save-rubric','committee-score'].includes(operation)&&payload.ciclo===undefined&&status!==403){const instance=role==='cie'||payload.instancia==='cie'?'cie':'comite';const meta=await call(`/evaluaciones/propuestas/${id}/rubrica?instancia=${instance}`,role);payload={...payload,ciclo:meta.ciclo};}
 return call(`/evaluaciones/propuestas/${id}/acciones`,role,'POST',{action:operation,payload},status);
}
try {
  env=await testEnvironment();
  for (const role of ['investigador','vie_publicacion','vinculacion','comite_asistente','comite_evaluador','consejo_asistente','consejo','direccion_escuela','gestora_vie','cie','direccion_investigacion','admin']) {
    await check(`Login ${role}`,async()=>{const data=await call('/demo/login',null,'POST',{email:`${role}@tec.ac.cr`,password:'prototipo2026',roleCode:role});assert.equal(data.user.roleCode,role);sessions.set(role,data.user);});
  }
  for(const n of [2,3]){const d=await call('/demo/login',null,'POST',{email:`comite_evaluador${n}@tec.ac.cr`,password:'prototipo2026',roleCode:'comite_evaluador'});sessions.set('e'+n,d.user);}
  await check('Migraciones conservan compromisos sin aceptación implícita',async()=>{
    const r=await env.pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='propuesta' AND column_name IN ('declaracion_aceptada','resguardo_repositorio','resguardo_tecnico')");assert.equal(r.rowCount,3);
    const id=await draft();const d=await detail(id);assert.equal(d.declaracion,false);assert.equal(d.resguardoRepositorio,false);
  });
  await check('Campos generales, ES/EN y preguntas sobreviven a relectura',async()=>{
    const id=await draft();await patch(id,{resumen:'Propio',abstractEn:'Own',keywordsEs:'uno,dos,tres,cuatro',keywordsEn:'one,two',estadoArte:'Arte propio',hojaRuta:'Ruta propia',referencias:'Referencias propias',divulgacion:'Plan propio',fechaInicio:'2027-01-15',fechaFin:'2028-06-30',preguntasGenerales:[{numero:2,respuesta:'Sí',detalle:'Proyecto\nRelación'}]});
    await patch(id,{keywordsEs:'agua,suelo,riesgo,clima',resumen:''});const d=await detail(id);assert.equal(d.resumen,'');assert.deepEqual(d.keywordsEn,['one','two']);assert.equal(d.estadoArte,'Arte propio');assert.equal(d.preguntasGenerales[0].detalle,'Proyecto\nRelación');assert.equal(d.fechaInicio.slice(0,10),'2027-01-15');
  });
  await check('Errores de guardado identifican campos, tamaño y duplicados sin persistir cambios',async()=>{
    const id=await draft();await patch(id,{titulo:'Antes'});const conflict=await patch(id,{titulo:'No debe persistir',keywordsEs:'repetida,repetida'},409);assert.match(conflict.error,/Palabras clave \(español\).*repetida.*repetido/u);assert.ok(!conflict.error.includes('23505'));await patch(id,{keywordsEn:'repeat,repeat'},409);const long=await patch(id,{keywordsEs:'x'.repeat(101)},400);assert.match(long.error,/100 caracteres/u);const titleError=await patch(id,{titulo:'x'.repeat(501)},400);assert.match(titleError.error,/nombre del proyecto.*500 caracteres/u);const oversized=await patch(id,{resumen:'x'.repeat(110000)},413);assert.match(oversized.error,/formulario supera el tamaño/u);assert.ok(!oversized.error.includes('10 MiB'));assert.equal((await detail(id)).titulo,'Antes');assert.equal((await call('/health')).database,'up');
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
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='en_evaluacion',etapa_flujo=2 WHERE id_propuesta=$1",[id]);await stageFixture(id);
    const scores=Object.fromEntries(rubricCriteria('aplicada').map(c=>[c.key,{score:8,reason:'Justificación humana '+c.key}]));
    await action(id,'comite_evaluador','save-rubric',{scores});
    const saved=await call(`/evaluaciones/propuestas/${id}/rubrica?instancia=comite`,'comite_evaluador');assert.deepEqual(saved.scores,scores);
    assert.deepEqual((await call(`/evaluaciones/propuestas/${id}/rubrica?instancia=cie`,'cie')).scores,{});
    assert.deepEqual((await call(`/evaluaciones/propuestas/${id}/rubrica?instancia=comite`,'admin')).scores,{});
    await action(id,'comite_evaluador','save-rubric',{scores:{}} ,400);
    const count=await env.pool.query('SELECT count(*) FROM evaluacion_puntaje p JOIN evaluacion e ON e.id_evaluacion=p.id_evaluacion WHERE e.id_propuesta=$1',[id]);assert.equal(Number(count.rows[0].count),Object.keys(scores).length);
    await action(id,'comite_evaluador','committee-score',{scores,average:99,recommendation:'RECOMIENDA'});
    await finishCommittee(id,scores);
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
    const id=await draft(),other=await draft();await env.pool.query('DELETE FROM pi_certificacion_no_requerido WHERE id_propuesta=ANY($1::int[])',[[id,other]]);await env.pool.query("UPDATE propuesta SET requiere_dictamen_pi=true,estado_actual='enviada',etapa_flujo=1 WHERE id_propuesta=ANY($1::int[])",[[id,other]]);
    const form={potencial:'Sí',innovacion:'No',tipoActivo:'Activo propio',tipoPI:'Autoría',novedad:'Novedad propia',titularidad:'Titularidad propia',divulgacion:'Recomendación propia',confidencialidad:'Análisis propio',analisis:'Dictamen humano propio',recomendaciones:'Recomendación humana',oficio:`CV-RG-${id}`,fecha:'2026-10-31'};
    await action(id,'vinculacion','pi',form);const saved=await call(`/evaluaciones/propuestas/${id}/pi`,'vinculacion');assert.deepEqual(saved.form,form);assert.equal((await call(`/evaluaciones/propuestas/${other}/pi`,'vinculacion')).form,null);
    await call(`/evaluaciones/propuestas/${id}/pi`,'investigador','GET',undefined,403);
  });
  await check('Checklist VIE persiste y bloquea remisión incompleta',async()=>{
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='avalada',etapa_flujo=4 WHERE id_propuesta=$1",[id]);await stageFixture(id);
    await action(id,'gestora_vie','send-cie',{},409);
    const keys=['propuesta','pi','evaluacion_comite','oficio_comite','aval','respaldos'];
    const checks=Object.fromEntries(keys.map(k=>[k,true]));await action(id,'gestora_vie','vie-checklist',{checks:{...checks,pi:false}});await action(id,'gestora_vie','send-cie',{},409);
    await action(id,'gestora_vie','vie-checklist',{checks});const b=await call('/evaluaciones/bandeja','gestora_vie');assert.deepEqual(b.items.find(p=>p.id===id).vieChecks,checks);
    await action(id,'gestora_vie','vie-observation',{texto:'Comentario propio VIE'});const d=await detail(id);assert.ok(d.observaciones.includes('Comentario propio VIE'));const n=await env.pool.query('SELECT 1 FROM notificacion WHERE id_propuesta=$1 AND id_usuario_destino=$2',[id,sessions.get('investigador').id]);assert.equal(n.rowCount,1);
    await action(id,'gestora_vie','send-cie');
  });
  await check('Dos devoluciones conservan ciclos independientes',async()=>{
    const id=await draft();await patch(id,{declaracion:true,keywordsEs:'uno,dos,tres,cuatro'});await env.pool.query("UPDATE propuesta SET estado_actual='enviada',etapa_flujo=1 WHERE id_propuesta=$1",[id]);await stageFixture(id);
    await action(id,'comite_asistente','return',{texto:'Primera devolución',secciones:['resumen']});
    await patch(id,{resumen:'Corrección uno'});await call(`/propuestas/${id}/enviar`,'investigador','POST',{respuesta:'Atendida primera devolución'});
    await action(id,'comite_asistente','return',{texto:'Segunda devolución',secciones:['resumen']});
    const cycles=await env.pool.query("SELECT ciclo FROM revision_expediente WHERE id_propuesta=$1 AND etapa='comite' ORDER BY ciclo",[id]);assert.deepEqual(cycles.rows.map(r=>r.ciclo),[1,2]);
    await patch(id,{resumen:'Corrección dos'});await call(`/propuestas/${id}/enviar`,'investigador','POST',{respuesta:'Atendida segunda devolución'});await action(id,'comite_asistente','committee-ready');const history=await env.pool.query("SELECT ciclo,resultado FROM revision_expediente WHERE id_propuesta=$1 AND etapa='comite' ORDER BY ciclo",[id]);assert.deepEqual(history.rows.map(r=>r.resultado),['devuelto','devuelto','completo']);
  });
  await check('Vista admin filtra sin cambiar identidad ni ampliar permisos',async()=>{
    const own=await draft(),foreign=await draft();
    await env.pool.query("UPDATE propuesta SET estado_actual='enviada',etapa_flujo=1,fecha_envio=NOW() WHERE id_propuesta=ANY($1::int[])",[[own,foreign]]);
    await env.pool.query("UPDATE propuesta SET id_escuela=(SELECT id_escuela FROM escuela WHERE id_escuela<>propuesta.id_escuela ORDER BY id_escuela LIMIT 1) WHERE id_propuesta=$1",[foreign]);
    const normal=await call('/evaluaciones/bandeja','vinculacion');const admin=await call('/evaluaciones/bandeja?vista=vinculacion','admin');assert.equal(admin.role,'vinculacion');
    // Cada bandeja tiene LIMIT 100 y ámbitos distintos: comparar fixtures recientes, no conjuntos completos.
    assert.ok(normal.items.some(p=>p.id===own));assert.ok(!normal.items.some(p=>p.id===foreign));assert.ok(admin.items.some(p=>p.id===own));assert.ok(admin.items.some(p=>p.id===foreign));
    assert.ok(admin.items.every(p=>['enviada','en_evaluacion','dictaminada','avalada'].includes(p.estadoActual)&&(p.etapaFlujo<=1||(p.piRequired?p.piEstado!=='emitido':p.piEstado!=='no_requerido'))));
    await call('/evaluaciones/bandeja?vista=admin','vinculacion','GET',undefined,403);await call('/evaluaciones/bandeja?vista=inventada','admin','GET',undefined,403);await call('/evaluaciones/bandeja','investigador','GET',undefined,403);
  });
  await check('Convocatoria y cronograma se editan atomicamente',async()=>{
    const c=await call('/convocatorias','vie_publicacion','POST',{nombre:'Cronograma regresión',fechaApertura:'2027-01-01',fechaCierre:'2027-12-31',estado:'borrador',hitos:[{nombre:'Hito inicial',responsable:'VIE',fechaInicio:'2027-02-01',fechaFin:'2027-02-15'}]},201);
    const before=await call(`/convocatorias/${c.id}`,'vie_publicacion');
    await call(`/convocatorias/${c.id}`,'vie_publicacion','PATCH',{nombre:'Cronograma actualizado',hitos:[{...before.hitos[0],nombre:'Hito editado'},{nombre:'Hito nuevo',responsable:'Comité',fechaInicio:'2027-03-01',fechaFin:'2027-03-15'}]});
    const updated=await call(`/convocatorias/${c.id}`,'vie_publicacion');assert.equal(updated.hitos.length,2);assert.equal(updated.hitos[0].nombre,'Hito editado');
    await call(`/convocatorias/${c.id}`,'vie_publicacion','PATCH',{nombre:'No debe persistir',hitos:[{id:2147483647,nombre:'Ajeno',fechaInicio:'2027-03-01',fechaFin:'2027-03-02'}]},400);assert.equal((await call(`/convocatorias/${c.id}`,'vie_publicacion')).nombre,'Cronograma actualizado');
    await call(`/convocatorias/${c.id}`,'vie_publicacion','PATCH',{nombre:'Cronograma final',hitos:[updated.hitos[1]]});assert.equal((await call(`/convocatorias/${c.id}`,'vie_publicacion')).hitos.length,1);
  });
  await check('Comunicar exige aval y una decisión emitida no se sobrescribe',async()=>{
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='dictaminada',etapa_flujo=3 WHERE id_propuesta=$1",[id]);await stageFixture(id);
    await action(id,'direccion_escuela','communicate-aval',{},409);
    await action(id,'consejo','council-approve',{texto:'Fundamento del Consejo',oficio:`AV-RG-${id}`});await action(id,'consejo','council-reject',{texto:'No sobrescribir'},409);await action(id,'direccion_escuela','communicate-aval');
    const rows=await env.pool.query('SELECT articulo FROM aval_consejo WHERE id_propuesta=$1',[id]);assert.equal(rows.rows[0].articulo,null);
  });
  await check('CIE conserva fundamento y decisión cerrada rechaza sobrescritura',async()=>{
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='avalada',etapa_flujo=5 WHERE id_propuesta=$1",[id]);await stageFixture(id);
    await action(id,'cie','cie-reject',{texto:'Fundamento humano propio'});const r=await env.pool.query('SELECT fundamento,resultado FROM resolucion_cie WHERE id_propuesta=$1',[id]);assert.equal(r.rows[0].fundamento,'Fundamento humano propio');assert.equal(r.rows[0].resultado,'rechazada');await action(id,'cie','cie-approve',{texto:'No sobrescribir'},409);
  });
  await check('Notificación concurrente única, por destinatario y lectura persistida',async()=>{
    const id=await draft();await env.pool.query("UPDATE propuesta SET estado_actual='avalada',etapa_flujo=5 WHERE id_propuesta=$1",[id]);await stageFixture(id);await action(id,'cie','cie-approve',{texto:'Resolución de prueba'});
    await Promise.all([action(id,'direccion_investigacion','notify-resolution'),action(id,'direccion_investigacion','notify-resolution')]);
    const r=await env.pool.query('SELECT id_notificacion FROM notificacion WHERE id_propuesta=$1',[id]);assert.equal(r.rowCount,1);const nid=String(r.rows[0].id_notificacion);
    assert.ok((await call('/notificaciones','investigador')).some(n=>n.id===nid));assert.ok(!(await call('/notificaciones','cie')).some(n=>n.id===nid));await call(`/notificaciones/${nid}/leida`,'cie','PATCH',undefined,404);await call(`/notificaciones/${nid}/leida`,'investigador','PATCH',undefined,204);assert.equal((await call('/notificaciones','investigador')).find(n=>n.id===nid).unread,false);
    const b=await call('/evaluaciones/bandeja','direccion_investigacion');assert.equal(b.items.find(p=>p.id===id).notificada,true);
  });
  await check('No notificar resolución inexistente ni aprobar borrador',async()=>{
    const id=await draft();await action(id,'admin','cie-approve',{texto:'No permitido'},400);await env.pool.query("UPDATE propuesta SET estado_actual='rechazada',etapa_flujo=6 WHERE id_propuesta=$1",[id]);await stageFixture(id);await action(id,'direccion_investigacion','notify-resolution',{},409);
  });
  await check('Código anual respeta históricos y no depende del PK',async()=>{
    const conv=await env.pool.query("SELECT id_convocatoria FROM convocatoria WHERE estado='activa' LIMIT 1");
    const before=await env.pool.query("SELECT id_propuesta,codigo FROM propuesta ORDER BY id_propuesta");
    const created=await call('/propuestas','investigador','POST',{titulo:'Consecutivo anual',idConvocatoria:conv.rows[0].id_convocatoria,modalidad:'aplicada'},201);
    assert.match(created.codigo,/^PROP-[0-9]{4}-[0-9]{3,}$/);
    const after=await env.pool.query("SELECT id_propuesta,codigo FROM propuesta WHERE id_propuesta<$1 ORDER BY id_propuesta",[created.id]);assert.deepEqual(after.rows,before.rows);
    await patch(created.id,{codigo:'NO-EDITABLE'},400);assert.equal((await detail(created.id)).codigo,created.codigo);
  });
} catch(error){results.push({name:'Entorno',status:'BLOQUEADO',detail:error.message});}
finally {
  if(env)await env.close();await mkdir(output,{recursive:true});await writeFile(path.join(output,'reporte.json'),JSON.stringify({run,scope:'Regresión de rutas con fixtures aislados. La batería D05–D11 cubre el recorrido real de rúbrica completa y consolidación.',results},null,2)+'\n');console.log(`Evidencia: ${path.relative(root,output)}`);process.exitCode=results.some(r=>r.status!=='PASA')?1:0;
}
