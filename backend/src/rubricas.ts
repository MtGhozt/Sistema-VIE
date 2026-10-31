import { readFileSync } from "node:fs";
import type { PoolClient } from "pg";
import { HttpError } from "./middleware/HttpError.js";
type Criterion = { label:string; weight:number; required:boolean; aiScore:number };
type Section = { id:string; title:string; criteria:Criterion[] };
const prototypes = JSON.parse(readFileSync(new URL("../../shared/rubricas-prototipo.json",import.meta.url),'utf8')) as { version:number; general:Section[]; desarrollo:Section[] };
export function rubricCriteria(modality:string) {
  const sections=modality==='desarrollo_tecnologico'?prototypes.desarrollo:prototypes.general;
  return sections.flatMap(s=>s.criteria.map((c,i)=>({...c,key:`${s.id}-${i}`,section:s.id,sectionTitle:s.title})));
}
export async function saveRubric(client:PoolClient,id:number,userId:number,instance:string,modality:string,payload:Record<string,unknown>,complete=false) {
  const criteria=rubricCriteria(modality);
  const raw=payload.scores;
  if(!raw || typeof raw!=='object' || Array.isArray(raw))throw new HttpError(400,"Envíe los criterios de la evaluación; no se guardó una nota por defecto");
  const scores=raw as Record<string,{score:unknown;reason:unknown}>;
  if(Object.keys(scores).some(key=>!criteria.some(c=>c.key===key)))throw new HttpError(400,"Criterio ajeno a esta versión de la rúbrica");
  let total=0;
  for(const c of criteria){
    const row=scores[c.key];
    if(!row || ![0,6,8,10].includes(Number(row.score)) || typeof row.reason!=='string')throw new HttpError(400,"Puntaje o justificación inválidos");
    if(complete&&!row.reason.trim())throw new HttpError(400,"Justifique todos los criterios antes de completar la evaluación");
    total+=c.weight*Number(row.score)/10;
  }
  total=Math.round(total*10)/10;
  const code=`DEMO_${modality.toUpperCase()}_V${prototypes.version}`;
  const rubric=await client.query<{id_rubrica:number}>(`INSERT INTO rubrica(codigo,nombre,modalidad_aplica,puntaje_maximo) VALUES($1,$2,$3,$4) ON CONFLICT(codigo) DO UPDATE SET codigo=EXCLUDED.codigo RETURNING id_rubrica`,[code,'Subconjunto de demostración (pendiente rúbrica oficial completa)',modality,criteria.reduce((n,c)=>n+c.weight,0)]);
  const rubricId=rubric.rows[0].id_rubrica;
  const existing=await client.query<{id_evaluacion:number}>("SELECT id_evaluacion FROM evaluacion WHERE id_propuesta=$1 AND id_evaluador=$2 AND instancia=$3 AND id_rubrica=$4 ORDER BY id_evaluacion DESC LIMIT 1",[id,userId,instance,rubricId]);
  let evaluationId=existing.rows[0]?.id_evaluacion;
  if(evaluationId){await client.query("UPDATE evaluacion SET puntaje_total=$1,estado=$2,fecha_envio=COALESCE($4::timestamptz,fecha_envio) WHERE id_evaluacion=$3",[total,complete?'completada':'en_progreso',evaluationId,complete?new Date():null]);}
  else {const e=await client.query<{id_evaluacion:number}>("INSERT INTO evaluacion(id_propuesta,id_rubrica,id_evaluador,instancia,puntaje_total,estado,fecha_envio) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id_evaluacion",[id,rubricId,userId,instance,total,complete?'completada':'en_progreso',complete?new Date():null]);evaluationId=e.rows[0].id_evaluacion;}
  for(const [index,c] of criteria.entries()){
    const criterion=await client.query<{id_criterio:number}>(`INSERT INTO rubrica_criterio(id_rubrica,seccion,numero,nombre,peso,puntaje_maximo,es_obligatorio) VALUES($1,$2,$3,$4,$5,10,$6) ON CONFLICT(id_rubrica,numero) DO UPDATE SET numero=EXCLUDED.numero RETURNING id_criterio`,[rubricId,c.section,index+1,c.label,c.weight,c.required]);
    await client.query(`INSERT INTO evaluacion_puntaje(id_evaluacion,id_criterio,puntaje,puntaje_sugerido_ia,justificacion) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id_evaluacion,id_criterio) DO UPDATE SET puntaje=EXCLUDED.puntaje,justificacion=EXCLUDED.justificacion`,[evaluationId,criterion.rows[0].id_criterio,Number(scores[c.key].score),c.aiScore,scores[c.key].reason]);
  }
  const recommendation=total>=70&&!criteria.some(c=>c.required&&Number(scores[c.key].score)<6)?'recomienda':'no_recomienda';
  return {total,recommendation};
}
export async function loadRubric(client: {query: PoolClient['query']},id:number,userId:number,instance:string,modality:string){
  const criteria=rubricCriteria(modality);
  const rows=await client.query<{numero:number;puntaje:string;justificacion:string}>(`SELECT c.numero,p.puntaje,p.justificacion FROM evaluacion e JOIN rubrica r ON r.id_rubrica=e.id_rubrica JOIN evaluacion_puntaje p ON p.id_evaluacion=e.id_evaluacion JOIN rubrica_criterio c ON c.id_criterio=p.id_criterio WHERE e.id_evaluacion=(SELECT e2.id_evaluacion FROM evaluacion e2 JOIN rubrica r2 ON r2.id_rubrica=e2.id_rubrica WHERE e2.id_propuesta=$1 AND e2.id_evaluador=$2 AND e2.instancia=$3 AND r2.codigo=$4 ORDER BY e2.id_evaluacion DESC LIMIT 1)`,[id,userId,instance,`DEMO_${modality.toUpperCase()}_V${prototypes.version}`]);
  return Object.fromEntries(rows.rows.filter(r=>criteria[r.numero-1]).map(r=>[criteria[r.numero-1].key,{score:Number(r.puntaje),reason:r.justificacion??''}]));
}
