import {AVAL_COMUNICADO_SQL} from './direccionEstado.js';
export const REVISION_VIE_SQL="(SELECT rv.resultado FROM revision_expediente rv WHERE rv.id_propuesta=p.id_propuesta AND rv.etapa='vie' ORDER BY rv.ciclo DESC LIMIT 1)";
export const VIE_PENDIENTE_SQL=`p.etapa_flujo=4 AND p.estado_actual='avalada' AND (${AVAL_COMUNICADO_SQL})`;
export const VIE_FILTROS:Record<string,string>={
 pendientes:VIE_PENDIENTE_SQL,
 listos:`(${VIE_PENDIENTE_SQL}) AND ${REVISION_VIE_SQL}='completo'`,
 devueltos:"p.etapa_flujo=4 AND p.estado_actual='en_subsanacion' AND EXISTS(SELECT 1 FROM propuesta_subsanacion ps WHERE ps.id_propuesta=p.id_propuesta AND ps.instancia='vie' AND ps.fecha_reenvio IS NULL)",
 remitidos:"EXISTS(SELECT 1 FROM propuesta_historial_estado h WHERE h.id_propuesta=p.id_propuesta AND h.etapa_evento=4 AND h.observacion='Expediente remitido al CIE')",
};
