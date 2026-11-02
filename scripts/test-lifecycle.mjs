/** Prueba scripts en un repositorio temporal con Docker/pnpm simulados; nunca desinstala este workspace. */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, readFile, access, rm, chmod } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
const temp=await mkdtemp(path.join(tmpdir(),'vie lifecycle-'));
const log=path.join(temp,'commands.txt'),bin=path.join(temp,'fake-bin');
const generated=['node_modules','frontend/node_modules','backend/node_modules','frontend/dist','backend/dist'];
async function exists(file){try{await access(file);return true;}catch{return false;}}
let pass=0;
try{
  await mkdir(bin);await mkdir(path.join(temp,'database'));
  for(const script of ['instalar.sh','desinstalar.sh'])await copyFile(new URL('../'+script,import.meta.url),path.join(temp,script));
  for(const file of ['pnpm-workspace.yaml','database/DisennoDB.sql','docker-compose.yml','docker-compose.test.yml','.env','README.md'])await writeFile(path.join(temp,file),'datos a conservar\n');
  for(const dir of generated){await mkdir(path.join(temp,dir),{recursive:true});await writeFile(path.join(temp,dir,'sentinel'),'preservar en simulación');}
  const fake=`#!/usr/bin/env bash\nset -eu\nprintf '%s %s\\n' "$(basename "$0")" "$*" >> "$LIFECYCLE_LOG"\n`;
  for(const name of ['docker','pnpm']){await writeFile(path.join(bin,name),fake);await chmod(path.join(bin,name),0o755);}
  const env={...process.env,PATH:bin+path.delimiter+process.env.PATH,LIFECYCLE_LOG:log};delete env.DATABASE_URL;delete env.TEST_DATABASE_URL;
  const run=(script,args=[])=>spawnSync('bash',[path.join(temp,script),...args],{cwd:'/',env,encoding:'utf8'});
  const commands=async()=>await exists(log)?await readFile(log,'utf8'):'';
  function check(label,result){assert.ok(result,label);pass++;console.log('PASA',label);}
  check('ayuda sin dependencias',run('instalar.sh',['--help']).status===0&&run('desinstalar.sh',['--help']).status===0);
  check('rechazar flags desconocidos',run('instalar.sh',['--inventado']).status===2&&run('desinstalar.sh',['--inventado']).status===2);
  check('verificar solo permite base aislada',run('instalar.sh',['--verificar']).status===2);
  const before=await commands();const dry=run('instalar.sh',['--pruebas','--verificar','--simular']);check('instalación simulada no ejecuta comandos',dry.status===0&&(await commands())===before);
  const installed=run('instalar.sh',['--pruebas','--verificar']);assert.equal(installed.status,0,installed.stderr);
  const setup=await commands();check('instalación usa lockfile y compila antes de migrar',setup.includes('pnpm install --frozen-lockfile')&&setup.indexOf('pnpm build')<setup.indexOf('pnpm db:migrate'));
  check('perfil aislado y health antes de migrar',setup.includes('-p vie-baseline')&&setup.indexOf('up -d --wait')<setup.indexOf('pnpm db:migrate'));
  check('regresiones y navegador después de instalar',setup.includes('pnpm exec playwright install chromium')&&setup.indexOf('pnpm test:fresh-schema')>setup.indexOf('pnpm db:migrate')&&setup.indexOf('pnpm regression:api')>setup.indexOf('pnpm test:fresh-schema')&&setup.indexOf('pnpm regression:decisions')>setup.indexOf('pnpm regression:api')&&setup.indexOf('pnpm regression:completion')>setup.indexOf('pnpm regression:decisions')&&setup.indexOf('pnpm regression:ui')>setup.indexOf('pnpm regression:completion')&&setup.indexOf('pnpm regression:completion-ui')>setup.indexOf('pnpm regression:ui'));
  const preDry=await commands();const dryUninstall=run('desinstalar.sh',['--pruebas','--purgar-datos','--simular']);check('desinstalación simulada no toca datos ni dependencias',dryUninstall.status===0&&(await commands())===preDry&&await exists(path.join(temp,'node_modules/sentinel')));
  await writeFile(log,'');const keep=run('desinstalar.sh',['--pruebas','--conservar-dependencias']);check('detener conserva dependencias y volumen por defecto',keep.status===0&&await exists(path.join(temp,'node_modules/sentinel'))&&!(await commands()).includes('--volumes'));
  await writeFile(log,'');const removed=run('desinstalar.sh',['--pruebas']);assert.equal(removed.status,0,removed.stderr);
  for(const dir of generated)assert.equal(await exists(path.join(temp,dir)),false,dir);
  check('desinstalar elimina únicamente directorios generados',await exists(path.join(temp,'README.md'))&&await exists(path.join(temp,'.env'))&&await exists(path.join(temp,'database/DisennoDB.sql')));
  check('sin purga no solicita borrar el volumen',!(await commands()).includes('--volumes'));
  await writeFile(log,'');const purge=run('desinstalar.sh',['--pruebas','--purgar-datos']);check('borrado de datos requiere flag explícito',purge.status===0&&(await commands()).includes('down --volumes'));
  console.log(`${pass} comprobaciones PASA. Docker/pnpm fueron dobles de prueba; no se retiraron dependencias reales.`);
}finally{await rm(temp,{recursive:true,force:true});}
