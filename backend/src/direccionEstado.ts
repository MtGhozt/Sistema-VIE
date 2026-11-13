export const AVAL_APROBADO_SQL="EXISTS(SELECT 1 FROM aval_consejo avc WHERE avc.id_propuesta=p.id_propuesta AND avc.resultado IN ('aprueba','aprobado'))";
export const AVAL_COMUNICADO_SQL=`${AVAL_APROBADO_SQL} AND EXISTS(SELECT 1 FROM comunicacion_institucional ci WHERE ci.id_propuesta=p.id_propuesta AND ci.tipo='aval_consejo' AND ci.fecha_envio>=COALESCE((SELECT MAX(ra.fecha_autorizacion) FROM reconsideracion_aval ra WHERE ra.id_propuesta=p.id_propuesta),'epoch'::timestamptz))`;
export const DIRECCION_FILTROS:Record<string,string>={
 por_comunicar:`${AVAL_APROBADO_SQL} AND p.estado_actual='avalada' AND p.etapa_flujo=4 AND NOT (${AVAL_COMUNICADO_SQL})`,
 comunicados:AVAL_COMUNICADO_SQL,
 en_vie:`${AVAL_COMUNICADO_SQL} AND p.estado_actual='avalada' AND p.etapa_flujo=4`,
 aval_rechazado:"p.estado_actual='rechazo_aval' AND EXISTS(SELECT 1 FROM aval_consejo avc WHERE avc.id_propuesta=p.id_propuesta AND avc.resultado IN ('rechaza','rechazado'))",
};
