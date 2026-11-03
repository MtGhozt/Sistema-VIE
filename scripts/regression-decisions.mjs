/** D01–D04: recorridos por API real y casos negativos. Solo fondos_vie_test. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {testEnvironment,root} from './test-environment.mjs';
const run=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join(root,'correcciones/evidencias',`${run}-decisiones-d01-d04`);
const results=[],sessions=new Map();let env,conv,main,required,other,otherDraft;const created=[];
async function finishCommittee(id,scores){
 await action(id,'comite_asistente','committee-ready');
 const status=await call(`/evaluaciones/propuestas/${id}/comite`,'comite_asistente');
 for(const role of ['comite_evaluador','e2','e3'])if(status.miembros.find(m=>m.id_usuario===sessions.get(role).id)?.estado!=='completada')await action(id,role,'committee-score',{scores});
 await action(id,'comite_asistente','committee-confirm',{texto:'Confirmación de tres valoraciones independientes'});
}
async function check(name,fn){try{await fn();results.push({name,status:'PASA'});}catch(error){results.push({name,status:'FALLA',detail:error.message});}console.log(results.at(-1).status,name,results.at(-1).detail??'');}
async function call(route,role,method='GET',body,status=200){const user=sessions.get(role);const r=await fetch(env.api+route,{method,headers:{'Content-Type':'application/json',...(user?{'X-Demo-User-Id':String(user.id),'X-Demo-Role':user.roleCode}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});const data=await r.json();assert.equal(r.status,status,`${method} ${route}: ${JSON.stringify(data)}`);return data;}
async function action(id,role,operation,payload={},status=200){
 if(['save-rubric','committee-score'].includes(operation)&&payload.ciclo===undefined&&status!==403){const instance=role==='cie'||payload.instancia==='cie'?'cie':'comite';const meta=await call(`/evaluaciones/propuestas/${id}/rubrica?instancia=${instance}`,role);payload={...payload,ciclo:meta.ciclo};}
 return call(`/evaluaciones/propuestas/${id}/acciones`,role,'POST',{action:operation,payload},status);
}
const patch=(id,data,status=200)=>call(`/propuestas/${id}`,'investigador','PATCH',data,status);
const send=(id,respuesta,status=200)=>call(`/propuestas/${id}/enviar`,'investigador','POST',{respuesta},status);
const detail=(id,role='investigador',status=200)=>call(`/propuestas/${id}`,role,'GET',undefined,status);
const create=async(role='investigador',pi=false)=>{const p=await call('/propuestas',role,'POST',{titulo:`D01–D04 ${run}`,idConvocatoria:conv.id,modalidad:'aplicada',declaracion:true,resumen:'Resumen original',abstractEn:'Own abstract',keywordsEs:'agua,suelo,clima,riesgo',requiereDictamenPi:pi,preguntasGenerales:[{numero:8,respuesta:pi?'Sí':'No',detalle:null}]},201);created.push(p.id);return p;};
const keys=['propuesta','pi','evaluacion_comite','oficio_comite','aval','respaldos'];
try{
  env=await testEnvironment();
  for(const role of ['investigador','vinculacion','comite_asistente','comite_evaluador','consejo_asistente','consejo','direccion_escuela','gestora_vie','cie','direccion_investigacion','vie_publicacion','admin']){const d=await call('/demo/login',null,'POST',{email:`${role}@tec.ac.cr`,password:'prototipo2026',roleCode:role});sessions.set(role,d.user);}
  for(const n of [2,3]){const d=await call('/demo/login',null,'POST',{email:`comite_evaluador${n}@tec.ac.cr`,password:'prototipo2026',roleCode:'comite_evaluador'});sessions.set('e'+n,d.user);}
  conv=await call('/convocatorias','vie_publicacion','POST',{nombre:`D01–D04 ${run}`,fechaApertura:'2026-01-01',fechaCierre:'2027-12-31',estado:'activa'},201);
  await check('D01: creación concurrente única y códigos históricos intactos',async()=>{
    const historical=(await env.pool.query('SELECT id_propuesta,codigo FROM propuesta ORDER BY id_propuesta')).rows;
    const ps=await Promise.all(Array.from({length:6},()=>create()));main=ps[0];
    assert.equal(new Set(ps.map(p=>p.codigo)).size,6);
    const nums=ps.map(p=>Number(p.codigo.split('-')[2])).sort((a,b)=>a-b);assert.equal(nums.at(-1)-nums[0],5);
    const after=(await env.pool.query('SELECT id_propuesta,codigo FROM propuesta WHERE NOT(id_propuesta=ANY($1::int[])) ORDER BY id_propuesta',[ps.map(p=>p.id)])).rows;assert.deepEqual(after,historical);
    await patch(main.id,{codigo:'PROP-2027-001'},400);
    await call('/propuestas','investigador','POST',{titulo:'Código impuesto',idConvocatoria:conv.id,modalidad:'aplicada',codigo:'IMPUESTO'},400);
  });
  await check('D01: contador por año y no reutilización tras eliminar el último código',async()=>{
    const {siguienteCodigo}=await import('../backend/dist/numeracionPropuestas.js');
    const client=await env.pool.connect();try{await client.query('BEGIN');const execute=client.query.bind(client);
      const years=await client.query('SELECT n FROM generate_series(9100,9999) n WHERE NOT EXISTS(SELECT 1 FROM propuesta_consecutivo_anual c WHERE c.anio=n) ORDER BY n LIMIT 2');assert.equal(years.rowCount,2);
      const [a,b]=years.rows.map(r=>r.n);assert.equal(await siguienteCodigo(execute,a),`PROP-${a}-001`);assert.equal(await siguienteCodigo(execute,a),`PROP-${a}-002`);assert.equal(await siguienteCodigo(execute,b),`PROP-${b}-001`);
    }finally{await client.query('ROLLBACK');client.release();}
    const last=await create();const number=Number(last.codigo.split('-')[2]);await env.pool.query('DELETE FROM propuesta_palabra_clave WHERE id_propuesta=$1',[last.id]);await env.pool.query('DELETE FROM propuesta_pregunta_general WHERE id_propuesta=$1',[last.id]);await env.pool.query('DELETE FROM propuesta WHERE id_propuesta=$1',[last.id]);const next=await create();assert.ok(Number(next.codigo.split('-')[2])>number);
  });
  await check('D02: identidades de otra escuela y borradores inaccesibles incluso para admin',async()=>{
    const r=await env.pool.query(`INSERT INTO usuario(correo_institucional,clave_hash,nombre_completo,id_escuela,activo,fecha_registro)
      SELECT $1,clave_hash,'Investigador otra escuela',(SELECT id_escuela FROM escuela WHERE id_escuela<>u.id_escuela LIMIT 1),true,NOW() FROM usuario u WHERE id_usuario=$2 RETURNING id_usuario`,[`d02-${Date.now()}@test.invalid`,sessions.get('investigador').id]);
    const id=r.rows[0].id_usuario;await env.pool.query("INSERT INTO usuario_rol(id_usuario,id_rol,fecha_asignacion) SELECT $1,id_rol,CURRENT_DATE FROM rol WHERE codigo='investigador'",[id]);sessions.set('otro',{id,roleCode:'investigador'});
    other=await create('otro');otherDraft=await create('otro');await call(`/propuestas/${other.id}/enviar`,'otro','POST');
    for(const role of ['investigador','vinculacion','comite_asistente','comite_evaluador','consejo_asistente','consejo','direccion_escuela','gestora_vie','cie','direccion_investigacion','vie_publicacion']){
      await detail(other.id,role,403);await detail(otherDraft.id,role,403);
      const list=await call('/propuestas',role);assert.ok(!list.some(p=>[other.id,otherDraft.id].includes(p.id)));
      const hist=await call('/historico/propuestas',role);assert.ok(!hist.items.some(p=>[other.id,otherDraft.id].includes(p.id)));
      assert.ok(hist.opciones.escuelas.every(e=>hist.items.some(p=>p.escuelaCodigo===e.codigo)));
    }
    await detail(other.id,'admin');await detail(otherDraft.id,'admin',403);
    await call(`/evaluaciones/propuestas/${other.id}`,'cie','GET',undefined,403);
    await call(`/evaluaciones/propuestas/${other.id}/pi`,'vinculacion','GET',undefined,403);
    await call(`/evaluaciones/propuestas/${other.id}/rubrica`,'comite_evaluador','GET',undefined,403);
    await action(other.id,'comite_asistente','return',{texto:'Fuera de ámbito',secciones:['resumen']},403);
    await call(`/evaluaciones/propuestas/${otherDraft.id}/pi`,'admin','GET',undefined,403);
    const u=sessions.get('investigador');const response=await fetch(env.api+'/propuestas',{headers:{'X-Demo-User-Id':String(u.id),'X-Demo-Role':'admin'}});assert.equal(response.status,403);
  });
  await check('D02: asignación expresa por rol habilita solo el expediente enviado',async()=>{
    const uid=sessions.get('vinculacion').id;
    await env.pool.query("INSERT INTO propuesta_asignacion(id_propuesta,id_usuario,rol) VALUES($1,$3,'vinculacion'),($2,$3,'vinculacion')",[other.id,otherDraft.id,uid]);
    await detail(other.id,'vinculacion');await detail(otherDraft.id,'vinculacion',403);
    assert.ok((await call('/evaluaciones/bandeja','vinculacion')).items.some(p=>p.id===other.id));
    await detail(other.id,'cie',403);
  });
  await check('D02: pertenencia al equipo permite leer enviados y nunca editar ni ver borradores ajenos',async()=>{
    const uid=sessions.get('otro').id;const researcher=sessions.get('investigador').id;
    for(const p of [main,otherDraft])await env.pool.query(`INSERT INTO propuesta_participante(id_propuesta,tipo,id_usuario,nombre_completo) VALUES($1,'funcionario_tec',$2,'Miembro de prueba')`,[p.id,p.id===main.id?uid:researcher]);
    await detail(main.id,'otro',403);await send(main.id);await detail(main.id,'otro');
    await call(`/propuestas/${main.id}`,'otro','PATCH',{resumen:'Ajeno'},403);await detail(otherDraft.id,'investigador',403);
  });
  await check('D04: PI no requerida bloquea sin certificación; solo Vinculación certifica con fundamento',async()=>{
    await action(main.id,'comite_asistente','committee-ready',{},409);
    await action(main.id,'admin','cie-approve',{texto:'Saltar PI'},409);
    await action(main.id,'comite_asistente','pi-not-required',{fundamento:'Ajeno'},403);
    await action(main.id,'vinculacion','pi-not-required',{},400);
    await action(main.id,'vinculacion','pi-not-required',{fundamento:'La revisión de Vinculación no identifica materia que requiera dictamen.'});
    const r=(await env.pool.query('SELECT * FROM pi_certificacion_no_requerido WHERE id_propuesta=$1',[main.id])).rows[0];assert.equal(r.id_certificador,sessions.get('vinculacion').id);assert.ok(r.fecha_certificacion);assert.ok(r.fundamento);
    await action(main.id,'vinculacion','pi-not-required',{fundamento:'Sobrescribir'},409);
    await action(main.id,'comite_asistente','committee-ready');
  });
  await check('D03: devolución exige motivo/secciones, bloquea avances y conserva alcance de edición',async()=>{
    await action(main.id,'comite_asistente','return',{texto:'Incompleto'},400);
    await action(main.id,'comite_asistente','return',{texto:'Corrija metodología y resumen',secciones:['metodologia','resumen']});
    assert.equal((await detail(main.id)).estadoActual,'en_subsanacion');
    await action(main.id,'comite_asistente','committee-ready',{},409);await action(main.id,'admin','cie-approve',{texto:'Saltar subsanación'},409);
    await patch(main.id,{titulo:'No autorizado'},400);assert.equal((await detail(main.id)).titulo,main.titulo);
    await patch(main.id,{requiereDictamenPi:true},400);
    await send(main.id,'Aún no corregido',409);
    await patch(main.id,{resumen:'Resumen corregido'});await send(main.id,'Falta metodología',409);
    await patch(main.id,{metodologia:'Método corregido'});await send(main.id,undefined,400);
    const resent=await send(main.id,'Se corrigieron resumen y metodología.');assert.equal(resent.etapaFlujo,2);assert.equal(resent.estadoActual,'en_evaluacion');
    const response=await env.pool.query('SELECT respuesta FROM observacion_respuesta r JOIN observacion o ON o.id_observacion=r.id_observacion WHERE o.id_propuesta=$1',[main.id]);assert.equal(response.rowCount,2);
  });
  await check('D03: segundo ciclo independiente y Comité cierra su decisión sin sobrescritura',async()=>{
    await action(main.id,'comite_asistente','return',{texto:'Precisar método',secciones:['metodologia']});await patch(main.id,{metodologia:'Método final'});await send(main.id,'Método precisado.');await action(main.id,'comite_asistente','committee-ready');
    const {rubricCriteria}=await import('../backend/dist/rubricas.js');const scores=Object.fromEntries(rubricCriteria('aplicada').map(c=>[c.key,{score:8,reason:'Fundamento de prueba '+c.key}]));
    await action(main.id,'comite_evaluador','committee-score',{scores});await finishCommittee(main.id,scores);
    await action(main.id,'comite_evaluador','committee-score',{scores},409);await action(main.id,'comite_asistente','return',{texto:'Reabrir',secciones:['resumen']},409);
    await action(main.id,'consejo_asistente','send-council');
    await action(main.id,'consejo','council-approve',{texto:'Aval del Consejo para prueba D03'});
    await action(main.id,'consejo','council-reject',{texto:'Sobrescribir aval'},409);
    await action(main.id,'direccion_escuela','communicate-aval');
    const cycles=await env.pool.query("SELECT count(*) FROM propuesta_subsanacion WHERE id_propuesta=$1 AND instancia='comite' AND fecha_reenvio IS NOT NULL",[main.id]);assert.equal(Number(cycles.rows[0].count),2);
  });
  await check('D03: devolución VIE regresa a VIE y exige nueva verificación antes de remitir',async()=>{
    const checks=Object.fromEntries(keys.map(k=>[k,true]));await action(main.id,'gestora_vie','vie-checklist',{checks});
    await action(main.id,'gestora_vie','return',{texto:'Precisar divulgación',secciones:['divulgacion']});
    await patch(main.id,{divulgacion:'Plan de divulgación corregido'});const resent=await send(main.id,'Plan precisado.');assert.equal(resent.etapaFlujo,4);assert.equal(resent.estadoActual,'avalada');
    await action(main.id,'comite_asistente','committee-ready',{},409);await action(main.id,'gestora_vie','send-cie',{},409);
    await action(main.id,'gestora_vie','vie-checklist',{checks});await action(main.id,'gestora_vie','send-cie');
    await action(main.id,'cie','cie-approve',{texto:'Resolución de prueba tras subsanación.'});await action(main.id,'direccion_investigacion','notify-resolution');
    await action(main.id,'admin','return',{texto:'Reabrir decisión final',secciones:['resumen']},409);
  });
  await check('D04: PI requerida no se omite, dictamen emitido habilita y queda cerrado',async()=>{
    required=await create('investigador',true);await send(required.id);
    await action(required.id,'vinculacion','pi-not-required',{fundamento:'No omitir'},409);
    await action(required.id,'comite_asistente','committee-ready',{},409);
    await action(required.id,'vinculacion','pi',{potencial:'Sí',innovacion:'No',analisis:'Análisis humano',oficio:`PI-D04-${required.id}`});
    await action(required.id,'vinculacion','pi',{potencial:'No',innovacion:'No'},409);await action(required.id,'comite_asistente','committee-ready');
  });
  await check('D04: certificar un expediente histórico no altera su dictamen ni retrocede la etapa',async()=>{
    const p=await create();await send(p.id);
    // Estado preexistente de actualización: el recorrido nuevo ya está cubierto por los casos anteriores.
    await env.pool.query("INSERT INTO dictamen_pi(id_propuesta,id_emisor,potencial_proteccion,es_innovador,fecha_dictamen,estado,analisis_tecnico) VALUES($1,$2,false,false,CURRENT_DATE,'emitido','Dictamen histórico inmutable')",[p.id,sessions.get('vinculacion').id]);
    await env.pool.query("UPDATE propuesta SET estado_actual='avalada',etapa_flujo=4 WHERE id_propuesta=$1",[p.id]);
    const before=(await env.pool.query('SELECT * FROM dictamen_pi WHERE id_propuesta=$1',[p.id])).rows[0];assert.equal((await detail(p.id)).piAcreditada,false);
    await action(p.id,'gestora_vie','send-cie',{},409);
    assert.ok((await call('/evaluaciones/bandeja','vinculacion')).items.some(item=>item.id===p.id));
    await action(p.id,'vinculacion','pi-not-required',{fundamento:'Certificación explícita incorporada al actualizar un expediente anterior.'});
    assert.deepEqual((await env.pool.query('SELECT * FROM dictamen_pi WHERE id_propuesta=$1',[p.id])).rows[0],before);
    const after=await detail(p.id);assert.equal(after.piAcreditada,true);assert.equal(after.estadoActual,'avalada');assert.equal(after.etapaFlujo,4);
  });
  await check('D03: reenvío concurrente cierra una sola subsanación y conserva un único evento',async()=>{
    const p=await create();await send(p.id);await action(p.id,'comite_asistente','return',{texto:'Ajustar resumen',secciones:['resumen']});const privatePi=JSON.stringify(await detail(p.id,'vinculacion'));assert.ok(!privatePi.includes('Ajustar resumen'));
    await patch(p.id,{resumen:Array(501).fill('palabra').join(' ')});await send(p.id,'Resumen inválido',400);
    await patch(p.id,{resumen:'Resumen corregido'});
    const u=sessions.get('investigador');const responses=await Promise.all([1,2].map(()=>fetch(env.api+`/propuestas/${p.id}/enviar`,{method:'POST',headers:{'Content-Type':'application/json','X-Demo-User-Id':String(u.id),'X-Demo-Role':u.roleCode},body:JSON.stringify({respuesta:'Resumen atendido.'})})));
    assert.equal(responses.filter(r=>r.status===200).length,1);assert.ok(responses.every(r=>[200,400,409].includes(r.status)));
    const events=await env.pool.query("SELECT count(*) FROM propuesta_historial_estado WHERE id_propuesta=$1 AND estado_anterior='en_subsanacion'",[p.id]);assert.equal(Number(events.rows[0].count),1);
    await patch(p.id,{resumen:'Fuera de edición'},400);
  });
  await check('D02: cada instancia ve sus notas y solo resumen público de las previas',async()=>{
    const id=required.id;
    await env.pool.query(`INSERT INTO propuesta_historial_estado(id_propuesta,estado_anterior,estado_nuevo,id_usuario,fecha_hora,observacion,etapa_evento)
      VALUES($1,'enviada','en_evaluacion',$2,NOW(),'Privado PI',1),($1,'en_evaluacion','en_evaluacion',$2,NOW(),'Privado Comité',2),($1,'en_evaluacion','avalada',$2,NOW(),'Privado VIE futuro',4)`,[id,sessions.get('admin').id]);
    await env.pool.query("INSERT INTO observacion(id_propuesta,etapa,id_creada_por,mensaje,requiere_respuesta,fecha_creacion) VALUES($1,'vie',$2,'Nota privada VIE',false,NOW()),($1,'comite',$2,'Nota Comité',false,NOW())",[id,sessions.get('admin').id]);
    const committee=await detail(id,'comite_asistente');const serialized=JSON.stringify(committee);assert.ok(serialized.includes('Privado Comité'));assert.ok(!serialized.includes('Privado PI'));assert.ok(!serialized.includes('Privado VIE futuro'));assert.ok(!serialized.includes('Nota privada VIE'));assert.ok(serialized.includes('Nota Comité'));assert.ok(committee.timeline.some(h=>h.detalle.startsWith('Etapa previa completada')));
    const pi=JSON.stringify(await detail(id,'vinculacion'));assert.ok(pi.includes('Privado PI'));assert.ok(!pi.includes('Privado Comité'));assert.ok(!pi.includes('Nota Comité'));
  });
  await check('D03: rechazo previo no se acepta desde otra instancia ni por admin',async()=>{
    const p=await create();await send(p.id);await action(p.id,'vinculacion','pi-not-required',{fundamento:'No requerido tras revisión'});await action(p.id,'comite_asistente','committee-ready');
    const {rubricCriteria}=await import('../backend/dist/rubricas.js');const scores=Object.fromEntries(rubricCriteria('aplicada').map(c=>[c.key,{score:8,reason:'Fundamento '+c.key}]));await finishCommittee(p.id,scores);await action(p.id,'consejo','council-reject',{texto:'Rechazo fundamentado del Consejo'});
    await action(p.id,'cie','cie-approve',{texto:'No debe superar rechazo'},409);await action(p.id,'admin','council-approve',{texto:'No reabrir'},409);
    assert.equal((await detail(p.id)).estadoActual,'rechazo_aval');
  });
}catch(error){results.push({name:'Entorno/recorrido',status:'BLOQUEADO',detail:error.message});}
finally{if(env)await env.close();await mkdir(output,{recursive:true});await writeFile(path.join(output,'reporte.json'),JSON.stringify({run,scope:'D01–D04 autorizadas. Recorridos principales por API; SQL solo para escenarios de ámbito, eventos privados y contador anual. Usa la rúbrica versionada actual para sus precondiciones; D05–D11 tienen batería específica.',created,results},null,2)+'\n');console.log(`Evidencia: ${path.relative(root,output)}`);process.exitCode=results.some(r=>r.status!=='PASA')?1:0;}
