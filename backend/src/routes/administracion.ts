import {Router} from 'express';
import {scryptSync,randomBytes} from 'node:crypto';
import {query,transaction} from '../db.js';
import {requireDemoAuth} from '../middleware/demoAuth.js';
import {asyncHandler} from '../middleware/asyncHandler.js';
import {HttpError} from '../middleware/HttpError.js';
import {exigirAlcance} from '../alcancePropuestas.js';
import type {Section} from '../rubricas.js';
export const administracionRouter=Router();
const catalogs={escuelas:{table:'escuela',pk:'id_escuela'},modalidades:{table:'modalidad_catalogo',pk:'codigo'},lineas:{table:'linea_investigacion',pk:'id_linea_investigacion'}} as const;
administracionRouter.get('/catalogos',requireDemoAuth,asyncHandler(async(_req,res)=>{const [escuelas,modalidades,lineas,roles]=await Promise.all([query('SELECT * FROM escuela WHERE activo=true ORDER BY nombre'),query('SELECT * FROM modalidad_catalogo WHERE activo=true ORDER BY nombre'),query('SELECT * FROM linea_investigacion WHERE activo=true ORDER BY nombre'),query('SELECT codigo,nombre FROM rol ORDER BY nombre')]);res.json({escuelas:escuelas.rows,modalidades:modalidades.rows,lineas:lineas.rows,roles:roles.rows});}));
administracionRouter.use('/admin',requireDemoAuth,(req,res,next)=>{if(req.demoAuth!.role!=='admin'){res.status(403).json({error:'Solo Super Admin puede administrar usuarios, catálogos y rúbricas'});return;}next();});
function reason(body:Record<string,unknown>){const r=String(body.motivo??'').trim();if(!r)throw new HttpError(400,'Registre el motivo para auditoría');return r;}
async function audit(execute:typeof query,user:number,accion:string,entidad:string,id:number|null,motivo:string,datos:unknown){await execute('INSERT INTO auditoria_operacion(id_usuario,accion,entidad,id_entidad,motivo,datos) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[user,accion,entidad,id,motivo,JSON.stringify(datos)]);}
administracionRouter.get('/admin/usuarios',asyncHandler(async(_req,res)=>{res.json((await query(`SELECT u.id_usuario AS id,u.correo_institucional AS correo,u.nombre_completo AS nombre,u.id_escuela AS escuela,u.activo,COALESCE(array_agg(r.codigo) FILTER(WHERE r.codigo IS NOT NULL),'{}') AS roles FROM usuario u LEFT JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario LEFT JOIN rol r ON r.id_rol=ur.id_rol GROUP BY u.id_usuario ORDER BY u.nombre_completo`)).rows);}));
async function saveUser(body:Record<string,unknown>,id:number|null,actor:number){
 return transaction(async execute=>{
  await execute("SELECT pg_advisory_xact_lock(hashtext('vie-admin-usuarios'))");const before=id?(await execute('SELECT id_usuario,nombre_completo,correo_institucional,id_escuela,activo FROM usuario WHERE id_usuario=$1 FOR UPDATE',[id])).rows[0]:null;
  if(id&&!before)throw new HttpError(404,'Usuario no encontrado');
  const roles=body.roles;if(!Array.isArray(roles)||!roles.length||roles.some(r=>typeof r!=='string'))throw new HttpError(400,'Seleccione al menos un rol válido');
  const unique=[...new Set(roles)];if((await execute('SELECT codigo FROM rol WHERE codigo=ANY($1::text[])',[unique])).rowCount!==unique.length)throw new HttpError(400,'Rol no válido');
  const name=String(body.nombre??'').trim(),email=String(body.correo??'').trim().toLowerCase(),school=Number(body.escuela),active=body.activo;
  if(!Number.isSafeInteger(school)||school<1||!name||name.length>150||!/^\S+@\S+\.\S+$/.test(email)||email.length>120||typeof active!=='boolean'||!(await execute('SELECT 1 FROM escuela WHERE id_escuela=$1 AND activo=true',[school])).rowCount)throw new HttpError(400,'Complete nombre, correo, escuela activa y estado');
  if(id===actor&&(!active||!unique.includes('admin')))throw new HttpError(409,'No puede desactivar su propia cuenta ni retirar su rol admin');
  const password=String(body.password??'');if(!id&&!password||password&&password.length<8)throw new HttpError(400,'La contraseña nueva requiere al menos 8 caracteres');
  const salt=randomBytes(16);const hash=password?`scrypt$${salt.toString('hex')}$${scryptSync(password,salt,64).toString('hex')}`:null;
  if(!id)id=(await execute('INSERT INTO usuario(correo_institucional,clave_hash,nombre_completo,id_escuela,activo,fecha_registro) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING id_usuario',[email,hash,name,school,active])).rows[0].id_usuario as number;
  else await execute('UPDATE usuario SET correo_institucional=$2,clave_hash=COALESCE($3,clave_hash),nombre_completo=$4,id_escuela=$5,activo=$6 WHERE id_usuario=$1',[id,email,hash,name,school,active]);
  await execute('DELETE FROM usuario_rol WHERE id_usuario=$1',[id]);await execute('INSERT INTO usuario_rol(id_usuario,id_rol,fecha_asignacion) SELECT $1,id_rol,CURRENT_DATE FROM rol WHERE codigo=ANY($2::text[])',[id,unique]);
  await audit(execute,actor,before?'editar':'crear','usuario',id,reason(body),{antes:before,despues:{nombre:name,correo:email,escuela:school,activo:active,roles:unique}});return {id};
 });
}
administracionRouter.post('/admin/usuarios',asyncHandler(async(req,res)=>{res.status(201).json(await saveUser(req.body,null,req.demoAuth!.userId!));}));
administracionRouter.patch('/admin/usuarios/:id',asyncHandler(async(req,res)=>{res.json(await saveUser(req.body,Number(req.params.id),req.demoAuth!.userId!));}));
administracionRouter.get('/admin/catalogos/:tipo',asyncHandler(async(req,res)=>{const c=Object.hasOwn(catalogs,String(req.params.tipo))?catalogs[req.params.tipo as keyof typeof catalogs]:undefined;if(!c)throw new HttpError(404,'Catálogo no permitido');res.json((await query(`SELECT * FROM ${c.table} ORDER BY nombre`)).rows);}));
for(const method of ['post','patch'] as const)administracionRouter[method]('/admin/catalogos/:tipo'+(method==='patch'?'/:id':''),asyncHandler(async(req,res)=>{
 const c=Object.hasOwn(catalogs,String(req.params.tipo))?catalogs[req.params.tipo as keyof typeof catalogs]:undefined;if(!c)throw new HttpError(404,'Catálogo no permitido');const name=String(req.body.nombre??'').trim();if(!name||name.length>100||typeof req.body.activo!=='boolean')throw new HttpError(400,'Nombre y estado obligatorios');
 const id=req.params.id;const result=await transaction(async execute=>{
  const codigo=String(req.body.codigo??'').trim();let r;
  if(id)r=await execute(`UPDATE ${c.table} SET nombre=$2,activo=$3 WHERE ${c.pk}=$1 RETURNING *`,[id,name,req.body.activo]);
  else if(c.table==='linea_investigacion')r=await execute(`INSERT INTO ${c.table}(nombre,activo) VALUES($1,$2) RETURNING *`,[name,req.body.activo]);
  else {if(!/^[a-zA-Z0-9_-]{1,20}$/.test(codigo))throw new HttpError(400,'Código obligatorio, hasta 20 caracteres');r=await execute(`INSERT INTO ${c.table}(codigo,nombre,activo) VALUES($1,$2,$3) RETURNING *`,[codigo,name,req.body.activo]);}
  if(!r.rowCount)throw new HttpError(404,'Registro no encontrado');await audit(execute,req.demoAuth!.userId!,id?'editar':'crear',c.table,null,reason(req.body),r.rows[0]);return r.rows[0];
 });res.status(id?200:201).json(result);
}));
administracionRouter.get('/admin/rubricas',asyncHandler(async(_req,res)=>{res.json((await query('SELECT id_rubrica AS id,codigo,nombre,modalidad_aplica AS modalidad,version,activa,definicion FROM rubrica ORDER BY id_rubrica DESC')).rows);}));
administracionRouter.post('/admin/rubricas',asyncHandler(async(req,res)=>{
 const sections=req.body.definicion as Section[];const modality=String(req.body.modalidad??'');
 if(!(await query('SELECT 1 FROM modalidad_catalogo WHERE codigo=$1 AND activo=true',[modality])).rowCount||!Array.isArray(sections)||!sections.length)throw new HttpError(400,'Modalidad y definición obligatorias');
 let total=0;const ids=new Set<string>();for(const s of sections){if(typeof s.id!=='string'||!s.id||s.id.length>50||ids.has(s.id)||typeof s.title!=='string'||!s.title||s.title.length>120||!Number.isFinite(s.weight)||s.weight<=0||!Array.isArray(s.criteria)||!s.criteria.length)throw new HttpError(400,'Secciones inválidas');ids.add(s.id);let sum=0;for(const c of s.criteria){if(typeof c.label!=='string'||!c.label||c.label.length>500||(c.requirement!=null&&typeof c.requirement!=='string')||typeof c.required!=='boolean'||!Number.isFinite(c.weight)||c.weight<=0||!c.levels||['0','6','8','10'].some(k=>typeof c.levels[k]!=='string'||!c.levels[k].trim()))throw new HttpError(400,'Criterios, niveles o pesos inválidos');sum+=c.weight;}if(Math.abs(sum-s.weight)>0.001)throw new HttpError(400,'Los pesos de sección no coinciden');total+=sum;}
 if(Math.abs(total-100)>0.001)throw new HttpError(400,'Los pesos deben sumar 100');
 const saved=await transaction(async execute=>{await execute("SELECT pg_advisory_xact_lock(hashtext($1))",['rubrica-'+modality]);const version=Number((await execute('SELECT COALESCE(MAX(version),0)+1 AS n FROM rubrica WHERE modalidad_aplica=$1 AND definicion IS NOT NULL',[modality])).rows[0].n);
  await execute('UPDATE rubrica SET activa=false WHERE modalidad_aplica=$1 AND definicion IS NOT NULL',[modality]);const r=await execute(`INSERT INTO rubrica(codigo,nombre,modalidad_aplica,puntaje_maximo,version,definicion) VALUES($1,$2,$3,100,$4,$5::jsonb) RETURNING id_rubrica AS id`,[`VIE_${modality}_${version}`,String(req.body.nombre??'Rúbrica versionada').slice(0,150),modality,version,JSON.stringify(sections)]);await audit(execute,req.demoAuth!.userId!,'versionar','rubrica',r.rows[0].id as number,reason(req.body),{modalidad:modality,version});return r.rows[0];});res.status(201).json(saved);
}));
administracionRouter.patch('/admin/rubricas/:id',asyncHandler(async(req,res)=>{
 if(req.body.activa!==false)throw new HttpError(400,'Para modificar una rúbrica publique una nueva versión');
 await transaction(async execute=>{const r=await execute('UPDATE rubrica SET activa=false WHERE id_rubrica=$1 AND definicion IS NOT NULL RETURNING id_rubrica',[Number(req.params.id)]);if(!r.rowCount)throw new HttpError(404,'Versión no encontrada');await audit(execute,req.demoAuth!.userId!,'retirar','rubrica',Number(req.params.id),reason(req.body),{activa:false});});res.json({message:'Versión retirada para expedientes nuevos; los existentes la conservan'});
}));
administracionRouter.get('/admin/auditoria',asyncHandler(async(_req,res)=>{res.json((await query('SELECT * FROM auditoria_operacion ORDER BY id_auditoria DESC LIMIT 100')).rows);}));
administracionRouter.patch('/gestion/propuestas/:id/coordinacion',requireDemoAuth,asyncHandler(async(req,res)=>{
 if(!['admin','vie_publicacion'].includes(req.demoAuth!.role!))throw new HttpError(403,'Solo admin o VIE puede cambiar la coordinación');const id=Number(req.params.id);await exigirAlcance(id,req.demoAuth!);
 await transaction(async execute=>{const p=(await execute('SELECT * FROM propuesta WHERE id_propuesta=$1 FOR UPDATE',[id])).rows[0];if(['aprobada','rechazada'].includes(p.estado_actual as string)||Number(p.etapa_flujo)>1)throw new HttpError(409,'La coordinación solo se reasigna antes de iniciar la evaluación, para conservar las decisiones y su ámbito');
 const u=(await execute("SELECT u.* FROM usuario u JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario JOIN rol r ON r.id_rol=ur.id_rol WHERE u.id_usuario=$1 AND u.activo=true AND r.codigo='investigador'",[Number(req.body.idCoordinador)])).rows[0];if(!u?.id_escuela)throw new HttpError(400,'Seleccione una coordinación investigadora activa con escuela');await execute('UPDATE propuesta SET id_coordinador=$2,id_escuela=$3 WHERE id_propuesta=$1',[id,u.id_usuario,u.id_escuela]);await audit(execute,req.demoAuth!.userId!,'reasignar','propuesta',id,reason(req.body),{antes:{coordinador:p.id_coordinador,escuela:p.id_escuela},despues:{coordinador:u.id_usuario,escuela:u.id_escuela}});});res.json({message:'Coordinación y dependencia actualizadas'});
}));
