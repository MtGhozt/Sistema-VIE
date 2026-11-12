import {validarTextosPropuesta,horizonteProyecto} from "./propuestaLimites.js";
import {camposComplementarios,validarComplemento} from "./formularioComplementos.js";
import { saveProductos } from "./propuestaProductos.js";
import { savePlan } from "./propuestaPlan.js";
import { saveEtica } from "./propuestaEtica.js";
import { savePresupuesto } from "./propuestaPresupuesto.js";
import { saveEquipo, loadEquipo } from "./propuestaEquipo.js";
import { HttpError } from "./middleware/HttpError.js";
import type { query } from "./db.js";

async function enSeccion<T>(name:string,work:()=>Promise<T>):Promise<T>{
  try{return await work();}catch(error){if(error instanceof HttpError)throw new HttpError(error.status,`${name}: ${error.message}`);throw error;}
}

// Campos ya definidos en el modelo y en el formulario oficial (sin nuevas secciones).
export const CAMPOS_TEXTO = {
  estadoArte: "estado_arte", hojaRuta: "hoja_ruta", referencias: "referencias", divulgacion: "divulgacion",
} as const;
export async function savePropuestaCampos(id: number, body: Record<string, unknown>, execute: typeof query) {
  validarTextosPropuesta(body);
  await enSeccion("Compromisos de productos",()=>saveProductos(id, body.compromisos, execute));
  await enSeccion("Aspectos éticos",()=>saveEtica(id, body, execute));
  await enSeccion("Presupuesto y financiamiento",()=>savePresupuesto(id, body, execute));
  for(const name of Object.keys(camposComplementarios))if(body[name]!==undefined)validarComplemento(name,body[name]);
  if(body.formularioObjetivos!==undefined){
    const raw=body.formularioObjetivos as {objetivosEspecificos?:{descripcion:unknown}[]};
    if(raw?.objetivosEspecificos!==undefined){
      if(!Array.isArray(raw.objetivosEspecificos)||raw.objetivosEspecificos.length>50)throw new HttpError(400,'Objetivos específicos inválidos');
      for(const [i,o] of raw.objetivosEspecificos.entries()){
        if(!o||typeof o.descripcion!=='string')throw new HttpError(400,'Objetivo específico inválido');
        const old=await execute<{id_objetivo:number}>('SELECT id_objetivo FROM propuesta_objetivo_especifico WHERE id_propuesta=$1 AND numero=$2',[id,i+1]);
        if(old.rows[0])await execute('UPDATE propuesta_objetivo_especifico SET descripcion=$2 WHERE id_objetivo=$1',[old.rows[0].id_objetivo,o.descripcion]);
        else if(o.descripcion.trim())await execute('INSERT INTO propuesta_objetivo_especifico(id_propuesta,numero,descripcion) VALUES($1,$2,$3)',[id,i+1,o.descripcion]);
      }
    }
  }
  const memberIds=await enSeccion("Equipo de investigación",()=>saveEquipo(id, body.equipo, execute));
  if(Array.isArray(body.equipo)){
    const requested=body.formularioEquipo as {teamTec?:Record<string,unknown>[];teamExternal?:Record<string,unknown>[]} | undefined;
    const snapshots=[...(Array.isArray(requested?.teamTec)?requested.teamTec:[]),...(Array.isArray(requested?.teamExternal)?requested.teamExternal:[])];
    const persisted=await loadEquipo(id,execute);
    const saved=persisted.map(p=>{
      const raw=(body.equipo as Record<string,unknown>[]).find(r=>Number(r.id)===p.id||memberIds.get(String(r.clienteId))===p.id);
      const snapshot=snapshots.find(m=>Number(m.participantId)===p.id||memberIds.get(String(m.id))===p.id||m.id===`participante-${p.id}`);
      return {...snapshot,id:`participante-${p.id}`,participantId:p.id,nombre:p.nombre,periodo:p.periodo??'',iniciales:String(raw?.iniciales??snapshot?.iniciales??p.iniciales??'')};
    });
    body.formularioEquipo={...requested,teamTec:saved.filter(m=>persisted.find(p=>p.id===m.participantId)?.tipo==='funcionario_tec'),teamExternal:saved.filter(m=>persisted.find(p=>p.id===m.participantId)?.tipo==='externo')};
  }
  const resolveId=(key:unknown)=>typeof key==='string'?memberIds.get(key)??Number(key):key;
  const plan=Array.isArray(body.actividades)?body.actividades.map(a=>({...a,participantes:Array.isArray(a.participantes)?a.participantes.map(resolveId):a.participantes,asignaciones:Array.isArray(a.asignaciones)?a.asignaciones.map((p:{idParticipante:unknown;responsabilidad:string})=>({...p,idParticipante:resolveId(p.idParticipante)})):undefined})):body.actividades;
  await enSeccion("Plan de acción y riesgos",()=>savePlan(id, plan, execute));
  const extraNames=Object.keys(camposComplementarios);
  for(const name of extraNames){
    const value=body[name];if(value===undefined)continue;
    await execute("UPDATE propuesta SET formulario_detalle=jsonb_set(formulario_detalle,ARRAY[$2]::text[],$3::jsonb) WHERE id_propuesta=$1",[id,name,JSON.stringify(value)]);
  }
  const fields: string[] = [], values: unknown[] = [];
  for (const [api, column] of Object.entries(CAMPOS_TEXTO)) {
    if (body[api] !== undefined) { values.push(body[api] == null ? null : String(body[api]).trim()); fields.push(`${column}=$${values.length}`); }
  }
  for (const [api, column] of [["fechaInicio", "fecha_inicio"], ["fechaFin", "fecha_finalizacion"]]) {
    if(body[api]&&(!/^\d{4}-\d{2}-\d{2}$/.test(String(body[api]))||!Number.isFinite(Date.parse(String(body[api])))||new Date(String(body[api])).toISOString().slice(0,10)!==String(body[api])||String(body[api])<'2000-01-01'||String(body[api])>'2100-12-31'))throw new HttpError(400,`${api}: indique una fecha real con año entre 2000 y 2100.`);
    if (body[api] !== undefined) { values.push(body[api] || null); fields.push(`${column}=$${values.length}`); }
  }
  for (const [api,column] of [["declaracion", "declaracion_aceptada"], ["resguardoRepositorio", "resguardo_repositorio"], ["resguardoTecnico", "resguardo_tecnico"]]) {
    if (body[api] !== undefined) {
      if (typeof body[api] !== "boolean") throw new HttpError(400, "La aceptación debe ser explícita");
      values.push(body[api]); fields.push(`${column}=$${values.length}`);
    }
  }
  if (body.requiereDictamenPi !== undefined) {
    if (typeof body.requiereDictamenPi !== "boolean") throw new HttpError(400, "requiereDictamenPi debe ser booleano");
    values.push(body.requiereDictamenPi); fields.push(`requiere_dictamen_pi=$${values.length}`);
  }
  for(const [api,col] of [['trlActual','trl_actual'],['trlEsperado','trl_esperado']]){
    if(body[api]!==undefined){const n=body[api]===null||body[api]===''?null:Number(body[api]);if(n!==null&&(!Number.isInteger(n)||n<1||n>9))throw new HttpError(400,'TRL debe ser un entero de 1 a 9');values.push(n);fields.push(`${col}=$${values.length}`);}
  }
  if(body.lineas!==undefined){if(!Array.isArray(body.lineas)||body.lineas.some(n=>!Number.isSafeInteger(n)))throw new HttpError(400,'Líneas inválidas');const ids=[...new Set(body.lineas)];if((await execute('SELECT 1 FROM linea_investigacion WHERE id_linea_investigacion=ANY($1::int[]) AND (activo=true OR id_linea_investigacion IN (SELECT id_linea_investigacion FROM propuesta_linea WHERE id_propuesta=$2))',[ids,id])).rowCount!==ids.length)throw new HttpError(400,'Seleccione líneas activas');await execute('DELETE FROM propuesta_linea WHERE id_propuesta=$1',[id]);for(const n of ids)await execute('INSERT INTO propuesta_linea VALUES($1,$2)',[id,n]);}
  if (fields.length) { values.push(id); await execute(`UPDATE propuesta SET ${fields.join(',')} WHERE id_propuesta=$${values.length}`, values); }
  if (body.preguntasGenerales !== undefined) {
    const answers = body.preguntasGenerales;
    if (!Array.isArray(answers)) throw new HttpError(400, "Formato inválido de preguntas generales");
    for (const raw of answers) {
      const n = Number(raw?.numero);
      if (!Number.isInteger(n) || n < 1 || n > 8 || typeof raw?.respuesta !== "string") throw new HttpError(400, "Pregunta general inválida");
      await execute(`INSERT INTO propuesta_pregunta_general(id_propuesta,numero_pregunta,codigo_pregunta,respuesta,detalle)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT(id_propuesta,codigo_pregunta) DO UPDATE SET respuesta=EXCLUDED.respuesta, detalle=EXCLUDED.detalle`,
        [id,n,`q${n}`,raw.respuesta, raw.detalle == null ? null : String(raw.detalle)]);
    }
  }
  const dates=await execute<{inicio:Date|string|null;fin:Date|string|null}>('SELECT fecha_inicio AS inicio,fecha_finalizacion AS fin FROM propuesta WHERE id_propuesta=$1',[id]);
  const iso=(v:Date|string)=>v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);
  const d=dates.rows[0];if(d?.inicio&&d.fin){
    const start=iso(d.inicio),end=iso(d.fin),horizon=horizonteProyecto(start,end);
    if(!horizon)throw new HttpError(400,'Fechas del proyecto: la finalización no puede ser anterior al inicio.');
    const outside=await execute('SELECT 1 FROM actividad_plan WHERE id_propuesta=$1 AND mes_inicio+duracion_meses-1>$2::numeric LIMIT 1',[id,horizon]);
    if(outside.rowCount)throw new HttpError(400,'Plan de acción: una actividad excede la duración real del proyecto; para actividades diarias use días ÷ 30.');
  }

}
