import type { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";
export async function saveHitos(id:number,raw:unknown,execute:typeof query){
  if(raw===undefined)return;
  if(!Array.isArray(raw))throw new HttpError(400,"Cronograma inválido");
  const retained:number[]=[];
  for(const[index,r]of raw.entries()){
    if(!r||typeof r!=="object"||Array.isArray(r))throw new HttpError(400,"Actividad inválida");
    if(r.id&&retained.includes(Number(r.id)))throw new HttpError(400,"Actividad repetida");
    const validDate=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
    if(!String(r.nombre??'').trim()||!validDate(r.fechaInicio)||!validDate(r.fechaFin)||r.fechaFin<r.fechaInicio)throw new HttpError(400,"Indique nombre y fechas coherentes para cada hito");
    const values=[r.nombre.trim(),String(r.responsable??'VIE').trim()||'VIE',r.fechaInicio,r.fechaFin,index+1];
    if(r.id){
      const saved=await execute<{id_hito:number}>("UPDATE convocatoria_hito SET nombre=$1,responsable=$2,fecha_inicio=$3,fecha_fin=$4,orden=$5 WHERE id_hito=$6 AND id_convocatoria=$7 RETURNING id_hito",[...values,r.id,id]);
      if(!saved.rows[0])throw new HttpError(400,"Hito ajeno a la convocatoria");retained.push(saved.rows[0].id_hito);
    }else{
      const saved=await execute<{id_hito:number}>("INSERT INTO convocatoria_hito(nombre,responsable,fecha_inicio,fecha_fin,orden,id_convocatoria) VALUES($1,$2,$3,$4,$5,$6) RETURNING id_hito",[...values,id]);retained.push(saved.rows[0].id_hito);
    }
  }
  await execute("DELETE FROM convocatoria_hito WHERE id_convocatoria=$1 AND NOT(id_hito=ANY($2::int[]))",[id,retained]);
}
