import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const url=process.env.TEST_DATABASE_URL;if(!url||new URL(url).pathname!=='/fondos_vie_test')throw new Error('Solo se permite fondos_vie_test');
const root=fileURLToPath(new URL('../',import.meta.url)),run=new Date().toISOString().replace(/[:.]/g,'-'),folder=path.join(root,'correcciones/correcciones-finales/evidencias',run+'-validacion-actual');await mkdir(folder,{recursive:true});
// Las baterías comparten BD: ejecutar SIEMPRE secuencialmente para no contaminar conteos/concurrencia.
const allSuites=['test-lifecycle','test-fresh-schema','regression-api','regression-decisions','regression-completion','regression-merge-ian','regression-convocatoria-requisitos','regression-vie-final','regression-investigador-final','regression-investigador-ajustes','regression-vinculacion-final','regression-consejo-profesores','regression-direccion-escuela','baseline-flow'];
const suites=process.argv.includes('--ui')?allSuites.filter(s=>['regression-vie-final','regression-investigador-final','regression-investigador-ajustes','regression-vinculacion-final','regression-consejo-profesores','regression-direccion-escuela'].includes(s)):allSuites;
const results=[];
for(const suite of suites){
 console.log('Validando '+suite+'…');let log='';const exit=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(root,'scripts',suite+'.mjs')],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});child.stdout.on('data',d=>{log+=d;});child.stderr.on('data',d=>{log+=d;});child.on('error',reject);child.on('exit',code=>resolve(code));});
 await writeFile(path.join(folder,suite+'.txt'),log.split('\n').map(line=>line.trimEnd()).join('\n'));let report=Array.from(log.matchAll(/Evidencia: (.+)/g)).at(-1)?.[1].trim();let counts={};if(report){for(const candidate of [report,path.join('correcciones/evidencias',report),path.join('correcciones/correcciones-finales/evidencias',report)]){try{const d=JSON.parse(await readFile(path.join(root,candidate,'reporte.json'),'utf8'));report=candidate;for(const result of d.results??[d])if(result.status)counts[result.status]=(counts[result.status]??0)+1;break;}catch{}}}
 results.push({suite,status:exit===0?'PASA':'FALLA',exit,counts,report:report??null,log:suite+'.txt'});console.log(results.at(-1).status+' '+suite+' '+JSON.stringify(counts));
 if(exit!==0){console.log(log.slice(-2500));break;}
}
const complete=results.length===suites.length&&results.every(r=>r.status==='PASA');await writeFile(path.join(folder,'reporte.json'),JSON.stringify({run,capturas:false,secuencial:true,base:'fondos_vie_test',estado:complete?'PASA':'FALLA',suites:results,pendientes:suites.slice(results.length)},null,2)+'\n');console.log('Reporte global: '+path.relative(root,folder));process.exitCode=complete?0:1;
