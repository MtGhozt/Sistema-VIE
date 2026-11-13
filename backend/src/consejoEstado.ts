export const CONSEJO_RECIBIDO_SQL="EXISTS(SELECT 1 FROM resultado_comite rc WHERE rc.id_propuesta=p.id_propuesta)";
export const CONSEJO_ENVIADO_SQL="EXISTS(SELECT 1 FROM comunicacion_institucional ci WHERE ci.id_propuesta=p.id_propuesta AND ci.tipo='expediente_consejo' AND ci.confirmada AND ci.fecha_envio>=COALESCE((SELECT MAX(ra.fecha_autorizacion) FROM reconsideracion_aval ra WHERE ra.id_propuesta=p.id_propuesta),'epoch'::timestamptz))";
export const CONSEJO_PENDIENTE_SQL=`${CONSEJO_RECIBIDO_SQL} AND p.estado_actual='dictaminada' AND p.etapa_flujo=3 AND NOT (${CONSEJO_ENVIADO_SQL})`;
export const CONSEJO_ESPERA_SQL=`${CONSEJO_RECIBIDO_SQL} AND p.estado_actual='dictaminada' AND p.etapa_flujo=3 AND ${CONSEJO_ENVIADO_SQL}`;
export const CONSEJO_FILTROS:Record<string,string>={recibidos:CONSEJO_RECIBIDO_SQL,pendientes:CONSEJO_PENDIENTE_SQL,en_consejo:CONSEJO_ESPERA_SQL,enviados:CONSEJO_ENVIADO_SQL};
