import type { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";
export async function savePlan(id: number, raw: unknown, execute: typeof query) {
  if (raw === undefined) return;
  if (!Array.isArray(raw)) throw new HttpError(400,"Plan inválido");
  const retained:number[]=[];
  for (const r of raw) {
    if (!String(r.objetivo??'').trim() || !String(r.actividad??'').trim() || !Array.isArray(r.riesgos) || !Array.isArray(r.participantes)) throw new HttpError(400,"Complete objetivo y descripción de cada actividad");
    if (!Number.isInteger(Number(r.inicio)) || Number(r.inicio)<1 || !Number.isFinite(Number(r.duracion)) || Number(r.duracion)<=0) throw new HttpError(400,"Mes de inicio y duración deben ser positivos");
    if(r.asignaciones!==undefined){
      if(!Array.isArray(r.asignaciones)||r.asignaciones.some((a:{idParticipante:number;responsabilidad:string})=>!r.participantes.includes(a.idParticipante)||!['Ejecuta','Supervisa','Participa'].includes(a.responsabilidad))||new Set(r.asignaciones.map((a:{idParticipante:number})=>a.idParticipante)).size!==r.asignaciones.length)throw new HttpError(400,'Asignaciones individuales inválidas');
    }
    let objective = await execute<{ id_objetivo:number }>("SELECT id_objetivo FROM propuesta_objetivo_especifico WHERE id_propuesta=$1 AND descripcion=$2 ORDER BY numero LIMIT 1",[id,r.objetivo.trim()]);
    if (!objective.rowCount) objective=await execute<{ id_objetivo:number }>("INSERT INTO propuesta_objetivo_especifico(id_propuesta,numero,descripcion) SELECT $1,COALESCE(MAX(numero),0)+1,$2 FROM propuesta_objetivo_especifico WHERE id_propuesta=$1 RETURNING id_objetivo",[id,r.objetivo.trim()]);
    const objectiveId=objective.rows[0].id_objetivo;
    // Cada objetivo usa su propio consecutivo; no renumerar IDs ni perder referencias.
    const next=await execute<{ numero:number }>("SELECT COALESCE(MAX(numero),0)+1 AS numero FROM actividad_plan WHERE id_propuesta=$1 AND id_objetivo=$2",[id,objectiveId]);
    let activityId:number;
    if (r.id) {
      const updated=await execute<{id_actividad:number}>("UPDATE actividad_plan SET id_objetivo=$1,descripcion=$2,resultado_esperado=$3,responsabilidad=$4,mes_inicio=$5,duracion_meses=$6,numero=CASE WHEN id_objetivo=$1 THEN numero ELSE $7 END WHERE id_actividad=$8 AND id_propuesta=$9 RETURNING id_actividad",[objectiveId,r.actividad,r.resultado??'',r.responsabilidad??'',r.inicio,r.duracion,next.rows[0].numero,r.id,id]);
      if (!updated.rows[0]) throw new HttpError(400,"Actividad ajena a la propuesta");
      activityId=updated.rows[0].id_actividad;
    } else {
      const inserted=await execute<{id_actividad:number}>("INSERT INTO actividad_plan(id_propuesta,id_objetivo,numero,descripcion,resultado_esperado,responsabilidad,mes_inicio,duracion_meses) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_actividad",[id,objectiveId,next.rows[0].numero,r.actividad,r.resultado??'',r.responsabilidad??'',r.inicio,r.duracion]);
      activityId=inserted.rows[0].id_actividad;
    }
    retained.push(activityId);
    await execute("DELETE FROM actividad_riesgo WHERE id_actividad=$1",[activityId]);
    for (const risk of r.riesgos) await execute("INSERT INTO actividad_riesgo(id_actividad,riesgo_identificado,medida_mitigacion,responsable_gestion) VALUES($1,$2,$3,$4)",[activityId,String(risk.riesgo??''),String(risk.mitigacion??''),String(risk.responsable??'')]);
    await execute("DELETE FROM actividad_participante WHERE id_actividad=$1",[activityId]);
    for (const participant of new Set(r.participantes)) {
      const found=await execute("SELECT 1 FROM propuesta_participante WHERE id_participante=$1 AND id_propuesta=$2",[participant,id]);
      if (!found.rowCount) throw new HttpError(400,"Responsable ajeno al equipo de la propuesta");
      await execute("INSERT INTO actividad_participante(id_actividad,id_participante,responsabilidad) VALUES($1,$2,$3)",[activityId,participant,Array.isArray(r.asignaciones)?r.asignaciones.find((a:{idParticipante:number})=>a.idParticipante===participant)?.responsabilidad??r.responsabilidad??'':r.responsabilidad??'']);
    }
  }
  const removed=await execute<{id_actividad:number}>("SELECT id_actividad FROM actividad_plan WHERE id_propuesta=$1 AND NOT(id_actividad=ANY($2::int[]))",[id,retained]);
  for (const a of removed.rows) {
    await execute("DELETE FROM actividad_riesgo WHERE id_actividad=$1",[a.id_actividad]);
    await execute("DELETE FROM actividad_participante WHERE id_actividad=$1",[a.id_actividad]);
    await execute("DELETE FROM actividad_plan WHERE id_actividad=$1",[a.id_actividad]);
  }
}
export async function loadPlan(id:number,execute:typeof query) {
  const rows=await execute(`SELECT a.id_actividad AS id,o.descripcion AS objetivo,a.descripcion AS actividad,a.resultado_esperado AS resultado,a.responsabilidad,a.mes_inicio AS inicio,a.duracion_meses::float AS duracion,
    COALESCE((SELECT json_agg(json_build_object('idParticipante',ap.id_participante,'responsabilidad',ap.responsabilidad)) FROM actividad_participante ap WHERE ap.id_actividad=a.id_actividad),'[]') AS asignaciones,
    COALESCE((SELECT json_agg(ap.id_participante ORDER BY ap.id_actividad_participante) FROM actividad_participante ap WHERE ap.id_actividad=a.id_actividad),'[]') AS participantes,
    COALESCE((SELECT json_agg(json_build_object('riesgo',r.riesgo_identificado,'mitigacion',r.medida_mitigacion,'responsable',r.responsable_gestion) ORDER BY r.id_riesgo) FROM actividad_riesgo r WHERE r.id_actividad=a.id_actividad),'[]') AS riesgos
    FROM actividad_plan a JOIN propuesta_objetivo_especifico o ON o.id_objetivo=a.id_objetivo WHERE a.id_propuesta=$1 ORDER BY a.id_actividad`,[id]);
  return rows.rows;
}
