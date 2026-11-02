import {Router,raw} from 'express';
import {mkdir,writeFile,unlink,readFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {query,transaction} from '../db.js';
import {requireDemoAuth} from '../middleware/demoAuth.js';
import {asyncHandler} from '../middleware/asyncHandler.js';
import {HttpError} from '../middleware/HttpError.js';
import {exigirAlcance} from '../alcancePropuestas.js';
export const documentosRouter=Router();
const root=path.resolve(process.env.DOCUMENTOS_DIR??fileURLToPath(new URL(process.env.NODE_ENV==='test'?'../../../var/documentos-pruebas/':'../../../var/documentos/',import.meta.url)));
const types:Record<string,string>={'.pdf':'application/pdf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
function validFile(data:Buffer,ext:string){
 if(ext==='.pdf')return data.subarray(0,5).toString()==='%PDF-'&&data.subarray(Math.max(0,data.length-1024)).toString().includes('%%EOF');
 // Leer nombres del directorio central sin extraer archivos ni aceptar rutas del cliente.
 let end=-1;for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(data.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)return false;let offset=data.readUInt32LE(end+16);const names=[];
 for(let n=0;n<data.readUInt16LE(end+10);n++){if(offset+46>data.length||data.readUInt32LE(offset)!==0x02014b50)return false;const len=data.readUInt16LE(offset+28);names.push(data.subarray(offset+46,offset+46+len).toString());offset+=46+len+data.readUInt16LE(offset+30)+data.readUInt16LE(offset+32);}
 return names.includes('[Content_Types].xml')&&names.includes(ext==='.docx'?'word/document.xml':'xl/workbook.xml');
}
async function writable(id:number,reqAuth:{userId:number|null;role:string|null},execute:typeof query){
 await exigirAlcance(id,reqAuth,execute);
 const p=(await execute<{id_coordinador:number;estado_actual:string}>('SELECT id_coordinador,estado_actual FROM propuesta WHERE id_propuesta=$1 FOR UPDATE',[id])).rows[0];
 if(!p||p.id_coordinador!==reqAuth.userId&&reqAuth.role!=='admin')throw new HttpError(403,'Solo la coordinación puede modificar adjuntos');
 if(p.estado_actual==='en_subsanacion'){
  const correction=await execute("SELECT 1 FROM propuesta_subsanacion WHERE id_propuesta=$1 AND fecha_reenvio IS NULL AND 'documentacion'=ANY(secciones)",[id]);
  if(!correction.rowCount)throw new HttpError(409,'La devolución no autoriza cambiar documentación');
 }else if(p.estado_actual!=='borrador')throw new HttpError(409,'Los adjuntos del expediente enviado son de solo lectura');
}
documentosRouter.get('/propuestas/:id/documentos',requireDemoAuth,asyncHandler(async(req,res)=>{const id=Number(req.params.id);await exigirAlcance(id,req.demoAuth!);res.json((await query('SELECT id_documento AS id,nombre,tipo,estado,numero_version AS version,bytes,fecha_carga,retirada,sha256 IS NOT NULL AS disponible FROM propuesta_documento WHERE id_propuesta=$1 ORDER BY nombre,numero_version DESC',[id])).rows);}));
documentosRouter.post('/propuestas/:id/documentos',requireDemoAuth,raw({type:'application/octet-stream',limit:'10mb'}),asyncHandler(async(req,res)=>{
 const id=Number(req.params.id);let nombre:string;try{nombre=decodeURIComponent(req.header('x-file-name')??'');}catch{throw new HttpError(400,'Nombre inválido');}
 if(!nombre||nombre!==path.basename(nombre)||/[\x00-\x1f\\/]/.test(nombre)||nombre.length>180)throw new HttpError(400,'Nombre de archivo inválido');
 const ext=path.extname(nombre).toLowerCase(),data=req.body;
 if(!types[ext]||!Buffer.isBuffer(data)||!data.length||!validFile(data,ext))throw new HttpError(400,'Solo PDF, DOCX o XLSX válidos, de hasta 10 MiB');
 let stored:string|undefined;
 try{const saved=await transaction(async execute=>{
  await writable(id,req.demoAuth!,execute);const version=Number((await execute('SELECT COALESCE(MAX(numero_version),0)+1 AS n FROM propuesta_documento WHERE id_propuesta=$1 AND nombre=$2',[id,nombre])).rows[0].n);
  const key=randomUUID()+ext;await mkdir(root,{recursive:true});stored=path.join(root,key);await writeFile(stored!,data,{flag:'wx'});
  const r=await execute(`INSERT INTO propuesta_documento(id_propuesta,nombre,tipo,estado,ruta_archivo,numero_version,fecha_carga,bytes,sha256,id_cargada_por) VALUES($1,$2,$3,'Completo',$4,$5,NOW(),$6,$7,$8) RETURNING id_documento AS id,nombre,numero_version AS version`,[id,nombre,ext.slice(1),key,version,data.length,createHash('sha256').update(data).digest('hex'),req.demoAuth!.userId]);
  await execute("INSERT INTO auditoria_operacion(id_usuario,accion,entidad,id_entidad,motivo,datos) VALUES($1,'cargar','documento',$2,'Carga de documento solicitada por coordinación',$3::jsonb)",[req.demoAuth!.userId,r.rows[0].id,JSON.stringify({nombre,version})]);
  await execute("UPDATE propuesta_subsanacion SET campos_atendidos=array_append(campos_atendidos,'documentos') WHERE id_propuesta=$1 AND fecha_reenvio IS NULL",[id]);return r.rows[0];});res.status(201).json(saved);
 }catch(error){if(stored)await unlink(stored).catch(()=>{});throw error;}
}));
documentosRouter.get('/propuestas/:id/documentos/:documento',requireDemoAuth,asyncHandler(async(req,res)=>{
 const id=Number(req.params.id);await exigirAlcance(id,req.demoAuth!);const d=(await query<{ruta_archivo:string;nombre:string;sha256:string;retirada:boolean}>('SELECT * FROM propuesta_documento WHERE id_propuesta=$1 AND id_documento=$2',[id,Number(req.params.documento)])).rows[0];
 if(!d||!d.sha256||d.retirada)throw new HttpError(404,'Archivo no disponible');
 if(path.basename(d.ruta_archivo)!==d.ruta_archivo)throw new HttpError(404,'Ruta no válida');
 let data:Buffer;try{data=await readFile(path.join(root,d.ruta_archivo));}catch{throw new HttpError(404,'No se encontró el binario guardado');}
 res.type(types[path.extname(d.ruta_archivo)]).attachment(d.nombre).send(data);
}));
documentosRouter.delete('/propuestas/:id/documentos/:documento',requireDemoAuth,asyncHandler(async(req,res)=>{
 await transaction(async execute=>{const id=Number(req.params.id);await writable(id,req.demoAuth!,execute);const r=await execute('UPDATE propuesta_documento SET retirada=true WHERE id_propuesta=$1 AND id_documento=$2 AND sha256 IS NOT NULL AND retirada=false RETURNING id_documento',[id,Number(req.params.documento)]);if(!r.rowCount)throw new HttpError(404,'Adjunto no encontrado');await execute("INSERT INTO auditoria_operacion(id_usuario,accion,entidad,id_entidad,motivo) VALUES($1,'retirar','documento',$2,'Retiro de versión por coordinación')",[req.demoAuth!.userId,Number(req.params.documento)]);await execute("UPDATE propuesta_subsanacion SET campos_atendidos=array_append(campos_atendidos,'documentos') WHERE id_propuesta=$1 AND fecha_reenvio IS NULL",[id]);});res.sendStatus(204);
}));
const templates:Record<string,string>={presupuesto:'6- Plantilla Presupuesto Convocatoria Fondos VIE 2027.xlsx',formulario:'4- Formulario Proyecto Investigacion Fondos VIE 2027.docx'};
documentosRouter.get('/plantillas/:tipo',requireDemoAuth,asyncHandler(async(req,res)=>{const name=Object.hasOwn(templates,String(req.params.tipo))?templates[String(req.params.tipo)]:undefined;if(!name)throw new HttpError(404,'Plantilla no disponible');res.download(fileURLToPath(new URL('../../../docs/oficiales-vie/'+name,import.meta.url)));}));
