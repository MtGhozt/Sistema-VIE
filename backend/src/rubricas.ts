import textLimits from "../../shared/comite-text-limits.json" with {type:"json"};
import { readFileSync } from "node:fs";
import type { PoolClient } from "pg";
import { HttpError } from "./middleware/HttpError.js";
export type Criterion={label:string;weight:number;required:boolean;aiScore:number;aiReason:string;levels:Record<string,string>;requirement?:string|null};
export type Section={id:string;title:string;weight:number;criteria:Criterion[]};
const official=JSON.parse(readFileSync(new URL('../../shared/rubricas-oficiales.json',import.meta.url),'utf8')) as {general:Section[];desarrollo:Section[];fortalecimiento:Section[]};
export function rubricSections(modality:string){return modality==='desarrollo_tecnologico'?official.desarrollo:modality==='fortalecimiento'?official.fortalecimiento:official.general;}
export function rubricCriteria(modality:string,sections=rubricSections(modality)){return sections.flatMap(s=>s.criteria.map((c,i)=>({...c,key:`${s.id}-${i}`,section:s.id,sectionTitle:s.title})));}
type DB={query:PoolClient['query']};
export async function proposalRubric(client:DB,id:number,modality:string){
 let r=await client.query<{id_rubrica:number;definicion:Section[];codigo:string}>(`SELECT r.* FROM propuesta p JOIN rubrica r ON r.id_rubrica=p.id_rubrica_actual WHERE p.id_propuesta=$1`,[id]);
 if(!r.rowCount){
  r=await client.query(`SELECT * FROM rubrica WHERE modalidad_aplica=$1 AND definicion IS NOT NULL AND activa=true ORDER BY version DESC,id_rubrica DESC LIMIT 1`,[modality]);
  if(!r.rowCount&&(await client.query('SELECT 1 FROM rubrica WHERE modalidad_aplica=$1 AND definicion IS NOT NULL',[modality])).rowCount)throw new HttpError(409,'No hay versión activa para nuevos expedientes; admin debe publicar otra');
  if(!r.rowCount&&!['basica','aplicada','basica_aplicada','desarrollo_tecnologico','fortalecimiento'].includes(modality))throw new HttpError(409,'Admin debe publicar una rúbrica para esta modalidad');
  if(!r.rowCount)r=await client.query(`INSERT INTO rubrica(codigo,nombre,modalidad_aplica,puntaje_maximo,definicion) VALUES($1,'Rúbrica oficial Fondos VIE 2027',$2,100,$3::jsonb) ON CONFLICT(codigo) DO UPDATE SET codigo=EXCLUDED.codigo RETURNING *`,[`OFICIAL_${modality}_V1`,modality,JSON.stringify(rubricSections(modality))]);
  await client.query('UPDATE propuesta SET id_rubrica_actual=$2 WHERE id_propuesta=$1 AND id_rubrica_actual IS NULL',[id,r.rows[0].id_rubrica]);
  r=await client.query(`SELECT r.* FROM propuesta p JOIN rubrica r ON r.id_rubrica=p.id_rubrica_actual WHERE p.id_propuesta=$1`,[id]);
 }
 return r.rows[0];
}
export async function productRequirements(client:DB,id:number,modality:string){
 const r=await client.query(`SELECT COALESCE((SELECT SUM(h.cantidad_horas) FROM propuesta_participante pp JOIN propuesta_participante_hora h ON h.id_participante=pp.id_participante WHERE pp.id_propuesta=$1),0) AS horas,COALESCE(SUM(cantidad),0) AS cantidad,COALESCE(SUM(cantidad) FILTER(WHERE ambito='activo_pi'),0) AS industriales,COALESCE(SUM(cantidad) FILTER(WHERE ambito<>'activo_pi'),0) AS academicos FROM propuesta_producto WHERE id_propuesta=$1`,[id]);
 const d=r.rows[0],minAcademicos=Math.max(1,Math.ceil(Number(d.horas)/10)),minPI=modality==='desarrollo_tecnologico'?1:0;
 return {horas:Number(d.horas),academicos:Number(d.academicos),activosPI:Number(d.industriales),minAcademicos,minPI,cumple:minPI?Number(d.industriales)>=1&&Number(d.academicos)>=minAcademicos:Number(d.cantidad)>=minAcademicos};
}
export async function saveRubric(client:PoolClient,id:number,userId:number,instance:string,modality:string,payload:Record<string,unknown>,complete=false){
 const rubric=await proposalRubric(client,id,modality);const criteria=rubricCriteria(modality,rubric.definicion);
 if(instance==='comite'&&!(await client.query('SELECT 1 FROM comite_miembro WHERE id_propuesta=$1 AND id_usuario=$2',[id,userId])).rowCount)throw new HttpError(403,'No está asignado como evaluador de este Comité');
 const cycle=Number((await client.query('SELECT ciclo_evaluacion FROM propuesta WHERE id_propuesta=$1',[id])).rows[0].ciclo_evaluacion);
 if(!Number.isSafeInteger(payload.ciclo)||Number(payload.ciclo)!==cycle)throw new HttpError(409,'El ciclo cambió; recargue la evaluación antes de guardar');
 const existing=await client.query('SELECT * FROM evaluacion WHERE id_propuesta=$1 AND id_evaluador=$2 AND instancia=$3 AND id_rubrica=$4 AND ciclo=$5 ORDER BY id_evaluacion DESC LIMIT 1',[id,userId,instance,rubric.id_rubrica,cycle]);
 if(existing.rows[0]?.estado==='completada')throw new HttpError(409,'La evaluación individual ya fue entregada');
 const scores=payload.scores as Record<string,{score:unknown;reason:unknown}>;
 if(!scores||typeof scores!=='object'||Array.isArray(scores)||Object.keys(scores).some(k=>!criteria.some(c=>c.key===k)))throw new HttpError(400,'Criterios inválidos para la versión del expediente');
 for(const c of criteria){const reason=scores[c.key]?.reason;if(typeof reason==='string'&&reason.length>textLimits.justificacion)throw new HttpError(400,`La justificación del criterio «${c.label}» admite como máximo ${textLimits.justificacion} caracteres`);}
 let total=0,failed=false;
 for(const c of criteria){const row=scores[c.key];if(!row||![0,6,8,10].includes(Number(row.score))||typeof row.reason!=='string'||complete&&!row.reason.trim())throw new HttpError(400,'Valore y justifique todos los criterios antes de entregar');total+=c.weight*Number(row.score)/10;if(c.required&&Number(row.score)<=6)failed=true;}
 const structure=await productRequirements(client,id,modality);
 const verified=payload.productosCumplen===true,complies=verified&&structure.cumple;
 total=Math.round(total*100)/100;
 let evaluationId=existing.rows[0]?.id_evaluacion;
 if(evaluationId)await client.query('UPDATE evaluacion SET puntaje_total=$2,estado=$3,fecha_envio=$4,productos_cumplen=$5,productos_verificados=$6 WHERE id_evaluacion=$1',[evaluationId,total,complete?'completada':'en_progreso',complete?new Date():null,complies,verified]);
 else evaluationId=(await client.query('INSERT INTO evaluacion(id_propuesta,id_rubrica,id_evaluador,instancia,puntaje_total,estado,fecha_envio,productos_cumplen,ciclo,productos_verificados) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id_evaluacion',[id,rubric.id_rubrica,userId,instance,total,complete?'completada':'en_progreso',complete?new Date():null,complies,cycle,verified])).rows[0].id_evaluacion;
 for(const [index,c] of criteria.entries()){
  const criterion=await client.query(`INSERT INTO rubrica_criterio(id_rubrica,seccion,numero,nombre,peso,puntaje_maximo,es_obligatorio) VALUES($1,$2,$3,$4,$5,10,$6) ON CONFLICT(id_rubrica,numero) DO UPDATE SET numero=EXCLUDED.numero RETURNING id_criterio`,[rubric.id_rubrica,c.section,index+1,c.label.slice(0,200),c.weight,c.required]);
  await client.query(`INSERT INTO evaluacion_puntaje(id_evaluacion,id_criterio,puntaje,justificacion) VALUES($1,$2,$3,$4) ON CONFLICT(id_evaluacion,id_criterio) DO UPDATE SET puntaje=EXCLUDED.puntaje,justificacion=EXCLUDED.justificacion`,[evaluationId,criterion.rows[0].id_criterio,Number(scores[c.key].score),scores[c.key].reason]);
 }
 return {total,recommendation:total>=70&&!failed&&complies?'recomienda':'no_recomienda'};
}
export async function loadRubric(client:DB,id:number,userId:number,instance:string,modality:string,cycle?:number){
 const rubric=await proposalRubric(client,id,modality);const criteria=rubricCriteria(modality,rubric.definicion);
 const rows=await client.query(`SELECT c.numero,p.puntaje,p.justificacion FROM evaluacion e JOIN evaluacion_puntaje p ON p.id_evaluacion=e.id_evaluacion JOIN rubrica_criterio c ON c.id_criterio=p.id_criterio WHERE e.id_propuesta=$1 AND e.id_evaluador=$2 AND e.instancia=$3 AND e.id_rubrica=$4 AND e.ciclo=COALESCE($5::integer,(SELECT ciclo_evaluacion FROM propuesta WHERE id_propuesta=$1))`,[id,userId,instance,rubric.id_rubrica,cycle??null]);
 return Object.fromEntries(rows.rows.filter(r=>criteria[r.numero-1]).map(r=>[criteria[r.numero-1].key,{score:Number(r.puntaje),reason:r.justificacion??''}]));
}
export async function committeeStatus(client:DB,id:number){return (await client.query(`SELECT u.id_usuario,u.nombre_completo,u.activo,e.estado,e.puntaje_total,e.productos_cumplen FROM comite_miembro m JOIN usuario u ON u.id_usuario=m.id_usuario JOIN propuesta p ON p.id_propuesta=m.id_propuesta LEFT JOIN evaluacion e ON e.id_propuesta=m.id_propuesta AND e.id_evaluador=m.id_usuario AND e.instancia='comite' AND e.id_rubrica=p.id_rubrica_actual AND e.ciclo=p.ciclo_evaluacion WHERE m.id_propuesta=$1 ORDER BY u.id_usuario`,[id])).rows;}
export async function assignCommittee(client:DB,id:number,school:number){
 if((await client.query('SELECT 1 FROM comite_miembro WHERE id_propuesta=$1',[id])).rowCount)return;
 const users=await client.query(`SELECT u.id_usuario FROM usuario u JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario JOIN rol r ON r.id_rol=ur.id_rol WHERE r.codigo='comite_evaluador' AND u.activo=true AND u.id_escuela=$1 ORDER BY u.id_usuario LIMIT 3`,[school]);
 if(users.rowCount!==3)throw new HttpError(409,'Configure tres evaluadores activos de la escuela antes de enviar al Comité');
 for(const u of users.rows)await client.query('INSERT INTO comite_miembro VALUES($1,$2)',[id,u.id_usuario]);
}
