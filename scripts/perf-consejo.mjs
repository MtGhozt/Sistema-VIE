import {testEnvironment,root} from './test-environment.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const phase=process.argv[2]??'despues';if(!['antes','despues'].includes(phase))throw new Error('Fase inválida');
const env=await testEnvironment();const measurements=[];try{
 for(const role of ['consejo_asistente','consejo']){const u=(await (await fetch(env.api+'/demo/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:role+'@tec.ac.cr',password:'prototipo2026',roleCode:role})})).json()).user;
 for(const route of ['/evaluaciones/bandeja','/historico/propuestas?consejo=pendientes',...(phase==='despues'?['/historico/propuestas?consejo=pendientes&opciones=0']:[])]){const ms=[];let bytes=0;for(let i=0;i<12;i++){const start=performance.now();const r=await fetch(env.api+route,{headers:{'X-Demo-User-Id':String(u.id),'X-Demo-Role':role}});const body=await r.text();if(!r.ok)throw new Error(body);bytes=Buffer.byteLength(body);ms.push(performance.now()-start);}ms.sort((a,b)=>a-b);measurements.push({role,route,medianaMs:+ms[6].toFixed(2),p95Ms:+ms[11].toFixed(2),bytes});}}
 const report={fase:phase,entorno:'API local aislada, 12 solicitudes por caso, sin login incluido',propuestas:Number((await env.pool.query('SELECT count(*) FROM propuesta')).rows[0].count),mediciones:measurements};const dir=path.join(root,'correcciones/correcciones-finales/evidencias/rendimiento-consejo');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,phase+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await env.close();}
