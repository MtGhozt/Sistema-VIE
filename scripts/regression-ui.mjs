import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {testEnvironment,root} from './test-environment.mjs';
const run=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join(root,'correcciones/evidencias',`${run}-regresion-ui`);
const results=[],errors=[];let env,browser;let serial=0;
async function check(name,fn){try{results.push({name,status:'PASA',detail:await fn()});}catch(error){results.push({name,status:'FALLA',detail:error.message});}console.log(results.at(-1).status,name,JSON.stringify(results.at(-1).detail??''));}
async function login(role,viewport={width:1440,height:900}){
  const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push({role,message:error.message}));
  await page.goto(env.uiOrigin+'/login');const select=page.locator('.prototype-role-box select');await expect(select).toBeEnabled();await select.selectOption(role);await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();await expect(page).toHaveURL(/\/inicio$/);return {context,page};
}
async function fixture(state='borrador',stage=0){
  const result=await env.pool.query(`INSERT INTO propuesta(codigo,id_convocatoria,id_coordinador,id_escuela,titulo,modalidad,estado_actual,etapa_flujo)
    SELECT $1,(SELECT id_convocatoria FROM convocatoria ORDER BY id_convocatoria LIMIT 1),u.id_usuario,u.id_escuela,'Borrador UI propio','aplicada',$2,$3 FROM usuario u WHERE u.correo_institucional='investigador@tec.ac.cr' RETURNING id_propuesta,codigo`,[`UI-${Date.now()}-${++serial}`,state,stage]);return result.rows[0];
}
async function selectProposal(page,proposal){await page.goto(env.uiOrigin+'/evaluaciones');const select=page.getByLabel('Expediente activo',{exact:true});await expect(select).toBeVisible();await select.selectOption(proposal.codigo);}
async function shot(page,name){await page.screenshot({path:path.join(output,`${name}.png`)});return `${name}.png`;}
try{
  await mkdir(output,{recursive:true});env=await testEnvironment({ui:true});browser=await chromium.launch({headless:true});
  await check('Acceso directo a Administración exige identidad admin',async()=>{
    const{page,context}=await login('investigador');try{await page.goto(env.uiOrigin+'/administracion');await expect(page.getByRole('heading',{name:'Acceso restringido'})).toBeVisible();return await shot(page,'acceso-restringido');}finally{await context.close();}
  });
  await check('Editar y reabrir textos del formulario conserva datos propios',async()=>{
    const p=await fixture();const{page,context}=await login('investigador');try{
      await page.goto(`${env.uiOrigin}/propuestas/nueva?edit=${p.id_propuesta}`);await expect(page.locator('.wizard-steps button').first()).toBeVisible();
      for(const[step,label,value]of [[4,'Estado del arte','Antecedentes UI propios'],[10,'Divulgación y socialización','Divulgación UI propia'],[12,'Hoja de ruta','Hoja UI propia']]){
        await page.locator('.wizard-steps button').nth(step).click();await page.getByLabel(label,{exact:true}).fill(value);
      }
      await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();await expect(page).toHaveURL(new RegExp(`/propuestas/${p.id_propuesta}$`));
      await page.goto(`${env.uiOrigin}/propuestas/nueva?edit=${p.id_propuesta}`);await expect(page.locator('.wizard-steps button').first()).toBeVisible();await page.locator('.wizard-steps button').nth(4).click();await expect(page.getByLabel('Estado del arte',{exact:true})).toHaveValue('Antecedentes UI propios');return await shot(page,'arte-reabierto');
    }finally{await context.close();}
  });
  await check('Equipo permite alta y guarda la persona externa',async()=>{
    const p=await fixture();const{page,context}=await login('investigador');try{
      await page.goto(`${env.uiOrigin}/propuestas/nueva?edit=${p.id_propuesta}`);await expect(page.locator('.wizard-steps button').first()).toBeVisible();await page.locator('.wizard-steps button').nth(2).click();await page.getByRole('button',{name:'Agregar persona externa',exact:true}).click();await page.getByLabel('Nombre',{exact:true}).fill('Externa UI propia');await page.getByLabel('Institución / empresa',{exact:true}).fill('Entidad UI');await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();await expect(page).toHaveURL(new RegExp(`/propuestas/${p.id_propuesta}$`));await page.getByRole('tab',{name:'Equipo',exact:true}).click();await expect(page.getByText('Externa UI propia',{exact:true})).toBeVisible();return await shot(page,'equipo-propio');
    }finally{await context.close();}
  });
  for(const viewport of [{width:1440,height:900},{width:390,height:844}])await check(`Modal devolución sin superposición ${viewport.width}`,async()=>{
    const p=await fixture('enviada',1);const{page,context}=await login('comite_asistente',viewport);try{
      await selectProposal(page,p);const trigger=page.getByRole('button',{name:'Devolver con observaciones',exact:true});await trigger.click();const modal=page.getByRole('dialog',{name:'Devolver propuesta',exact:true});await expect(modal).toBeVisible();
      const info=await modal.evaluate(node=>{const r=node.getBoundingClientRect(),hits=[];for(let x=r.left+15;x<r.right-15;x+=30)for(let y=r.top+15;y<r.bottom-15;y+=30){const hit=document.elementFromPoint(x,y);if(hit&&!node.contains(hit))hits.push(hit.className);}return{hits,focusInside:node.contains(document.activeElement),within:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});assert.deepEqual(info.hits,[]);assert.equal(info.focusInside,true);assert.equal(info.within,true);const screenshot=await shot(page,`modal-devolucion-${viewport.width}`);await page.keyboard.press('Escape');await expect(modal).toBeHidden();await expect(trigger).toBeFocused();return{...info,screenshot};
    }finally{await context.close();}
  });
  await check('CIE envía texto y conserva el modal y fundamento ante HTTP 500',async()=>{
    const p=await fixture('avalada',5);const{page,context}=await login('cie');try{
      await selectProposal(page,p);let payload;
      await page.route(`**/evaluaciones/propuestas/${p.id_propuesta}/acciones`,async route=>{payload=route.request().postDataJSON();await route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Fallo API de prueba'})});});
      await page.getByRole('button',{name:'Rechazar',exact:true}).click();const modal=page.getByRole('dialog',{name:'Emitir resolución de rechazo',exact:true});await modal.getByRole('textbox').fill('Fundamento UI humano');await modal.getByRole('button',{name:'Confirmar rechazo',exact:true}).click();await expect(page.getByText('Fallo API de prueba',{exact:true})).toBeVisible();await expect(modal).toBeVisible();await expect(modal.getByRole('textbox')).toHaveValue('Fundamento UI humano');assert.equal(payload.payload.texto,'Fundamento UI humano');return await shot(page,'cie-error-conservado');
    }finally{await context.close();}
  });
  await check('Guardar rúbrica y recargar recupera justificación propia',async()=>{
    const p=await fixture('en_evaluacion',2);const{page,context}=await login('comite_evaluador');try{
      await selectProposal(page,p);await expect(page.getByText('Recuperando evaluación guardada…',{exact:true})).toBeHidden();const reason=page.getByLabel('Justificación humana obligatoria',{exact:true}).first();await reason.fill('Justificación UI persistida');await page.getByRole('button',{name:'Guardar evaluación',exact:true}).click();await expect(page.getByText('Los cambios de la evaluación se guardaron correctamente.',{exact:true})).toBeVisible();await page.reload();await page.getByLabel('Expediente activo',{exact:true}).selectOption(p.codigo);await expect(page.getByText('Recuperando evaluación guardada…',{exact:true})).toBeHidden();await expect(page.getByLabel('Justificación humana obligatoria',{exact:true}).first()).toHaveValue('Justificación UI persistida');return await shot(page,'rubrica-recuperada');
    }finally{await context.close();}
  });
  await check('Error y vacío de bandeja no crean expedientes demo',async()=>{
    const{page,context}=await login('vinculacion');try{
      await page.route('**/evaluaciones/bandeja',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[],total:0,role:'vinculacion'})}));await page.goto(env.uiOrigin+'/evaluaciones');await expect(page.getByText('No hay propuestas disponibles',{exact:true})).toBeVisible();await expect(page.getByLabel('Expediente activo',{exact:true})).toHaveCount(0);
      await page.unroute('**/evaluaciones/bandeja');await page.route('**/evaluaciones/bandeja',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'API no disponible (prueba)'})}));await page.reload();await expect(page.getByText('No se pudo consultar la bandeja',{exact:true})).toBeVisible();return await shot(page,'bandeja-error-sin-demo');
    }finally{await context.close();}
  });
} catch(error){results.push({name:'Entorno',status:'BLOQUEADO',detail:error.message});}
finally{if(browser)await browser.close();if(env)await env.close();await mkdir(output,{recursive:true});await writeFile(path.join(output,'reporte.json'),JSON.stringify({run,scope:'Regresión de correcciones en Chromium; error HTTP 500 CIE simulado sin decidir expedientes.',results,errors},null,2)+'\n');console.log(`Evidencia: ${path.relative(root,output)}`);process.exitCode=results.some(r=>r.status!=='PASA')||errors.length?1:0;}
