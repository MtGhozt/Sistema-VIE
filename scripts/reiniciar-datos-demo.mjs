/** Reinicio explícito y limitado a las bases locales de este proyecto. */
import {createRequire} from 'node:module';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const profile=process.argv[2],count=Number(process.argv[3]??16),url=process.env.DATABASE_URL;
if(!['desarrollo','pruebas'].includes(profile)||!Number.isInteger(count)||count<16||count>80||!url)throw new Error('Perfil/cantidad inválidos. Use reiniciar-datos-demo.sh.');
const parsed=new URL(url),expected=profile==='pruebas'?'fondos_vie_test':'fondos_vie';
if(!['localhost','127.0.0.1','[::1]'].includes(parsed.hostname)||parsed.pathname!=='/'+expected)throw new Error('Solo se pueden reiniciar las bases locales del proyecto.');
const {Pool}=createRequire(new URL('../backend/package.json',import.meta.url))('pg'),pool=new Pool({connectionString:url,connectionTimeoutMillis:5000}),client=await pool.connect();
const run=new Date().toISOString().replace(/[:.]/g,'-'),report={run,perfil:profile,base:expected,cantidad:count,reinicio:false,carga:false};
try{
 if((await client.query('SELECT current_database() AS name')).rows[0].name!==expected)throw new Error('Base inesperada');
 await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='10s'");await client.query("SELECT pg_advisory_xact_lock(hashtext('sistema-vie-reinicio'))");
 await client.query('DROP SCHEMA public CASCADE');await client.query('CREATE SCHEMA public');await client.query('SET LOCAL search_path TO public');
 const sql=async file=>client.query((await readFile(new URL(file,import.meta.url),'utf8')).replace(/^\s*(BEGIN|COMMIT|ROLLBACK);\s*$/gm,''));
 await sql('../database/DisennoDB.sql');await sql('../database/seed.sql');
 await client.query('CREATE TABLE sistema_vie_migracion(archivo text PRIMARY KEY,aplicado_en timestamptz NOT NULL DEFAULT NOW())');
 for(const file of (await readdir(new URL('../database/migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort()){await sql('../database/migrations/'+file);await client.query('INSERT INTO sistema_vie_migracion(archivo) VALUES($1)',[file]);}
 // El seed solo aporta usuarios/catálogos. Se quitan sus expedientes y convocatorias históricos.
 await client.query('TRUNCATE propuesta,convocatoria,propuesta_consecutivo_anual RESTART IDENTITY CASCADE');
 await client.query('COMMIT');report.reinicio=true;
 console.log('Esquema local reiniciado; usuarios/catálogos demo restaurados. Cargando recorrido real por API…');
}catch(e){await client.query('ROLLBACK');report.error=e.message;throw e;}
finally{client.release();await pool.end();}
try{
 const child=spawnSync(process.execPath,[new URL('./cargar-propuestas-demo.mjs',import.meta.url).pathname,'--perfil',profile,'--cantidad',String(count)],{stdio:'inherit',env:process.env});
 if(child.status!==0)throw new Error('El reinicio terminó, pero la carga no se completó. Revise el reporte del cargador; los registros parciales se conservan.');report.carga=true;
 const verify=new Pool({connectionString:url});try{report.estados=(await verify.query('SELECT estado_actual,count(*)::int AS cantidad FROM propuesta GROUP BY estado_actual ORDER BY estado_actual')).rows;report.pi=(await verify.query("SELECT (SELECT count(*) FROM dictamen_pi WHERE estado='emitido')::int AS emitidos,(SELECT count(*) FROM pi_certificacion_no_requerido)::int AS no_requeridos,(SELECT count(*) FROM revision_expediente WHERE etapa='pi' AND resultado='en_revision')::int AS en_revision")).rows[0];report.remisiones=(await verify.query("SELECT count(*)::int AS cantidad FROM comunicacion_institucional WHERE tipo='expediente_consejo'")).rows[0].cantidad;}finally{await verify.end();}
}catch(e){report.error=e.message;process.exitCode=1;}
finally{const dir=new URL(`../correcciones/correcciones-finales/evidencias/${run}-reinicio-${profile}/`,import.meta.url);await mkdir(dir,{recursive:true});await writeFile(new URL('reporte.json',dir),JSON.stringify(report,null,2)+'\n');console.log('Reporte de reinicio: '+dir.pathname);}
