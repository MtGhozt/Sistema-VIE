/** Verifica esquema + seed + todas las migraciones, en otro schema y con ROLLBACK. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const url=process.env.TEST_DATABASE_URL;if(!url||new URL(url).pathname!=='/fondos_vie_test')throw new Error('Solo se permite fondos_vie_test');
const {Pool}=createRequire(new URL('../backend/package.json',import.meta.url))('pg');const pool=new Pool({connectionString:url});const client=await pool.connect();const schema='verificacion_fresca_'+Date.now();const run=new Date().toISOString().replace(/[:.]/g,'-');let result;
async function executeSQL(file){assert.equal((await client.query('SELECT current_schema() AS s')).rows[0].s,schema);const sql=(await readFile(file,'utf8')).replace(/^\s*(BEGIN|COMMIT|ROLLBACK);\s*$/gm,'');await client.query(sql);assert.equal((await client.query('SELECT current_schema() AS s')).rows[0].s,schema);}
try{
 await client.query('BEGIN');await client.query(`CREATE SCHEMA "${schema}"`);await client.query(`SET LOCAL search_path TO "${schema}"`);
 await executeSQL(new URL('../database/DisennoDB.sql',import.meta.url));await executeSQL(new URL('../database/seed.sql',import.meta.url));
 const before=(await client.query('SELECT id_propuesta,codigo FROM propuesta ORDER BY id_propuesta')).rows;
 const migrations=(await readdir(new URL('../database/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();for(const f of migrations)await executeSQL(new URL('../database/migrations/'+f,import.meta.url));
 assert.deepEqual((await client.query('SELECT id_propuesta,codigo FROM propuesta ORDER BY id_propuesta')).rows,before);
 assert.equal(Number((await client.query("SELECT count(*) FROM usuario u JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario JOIN rol r ON r.id_rol=ur.id_rol WHERE r.codigo='comite_evaluador' AND u.activo")).rows[0].count),3);
 assert.equal((await client.query('SELECT ciclo_evaluacion FROM propuesta LIMIT 1')).rows[0].ciclo_evaluacion,1);
 result={run,status:'PASA',propuestas:before.length,codigosConservados:true,migrations,scope:'Esquema nuevo + seed + migraciones en una transacción; se revierte íntegramente sin borrar volúmenes ni modificar el esquema público.'};
}catch(error){result={run,status:'FALLA',detail:error.message};process.exitCode=1;}
finally{
 try{await client.query('ROLLBACK');const remains=(await client.query('SELECT 1 FROM pg_namespace WHERE nspname=$1',[schema])).rowCount;if(remains){assert.match(schema,/^verificacion_fresca_[0-9]+$/);await client.query(`DROP SCHEMA "${schema}" CASCADE`);result={...result,status:'FALLA',detail:'La transacción no aisló el esquema temporal; se limpió su contenido'};process.exitCode=1;}assert.equal((await client.query('SELECT 1 FROM pg_namespace WHERE nspname=$1',[schema])).rowCount,0);}
 catch(error){result={...result,status:'FALLA',detail:error.message};process.exitCode=1;}
 client.release();await pool.end();const folder=new URL(`../correcciones/evidencias/${run}-esquema-nuevo/`,import.meta.url);await mkdir(folder,{recursive:true});await writeFile(new URL('reporte.json',folder),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));console.log('Evidencia: '+path.basename(folder.pathname.slice(0,-1)));
}
