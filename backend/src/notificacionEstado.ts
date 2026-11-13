export const RESOLUCION_NOTIFICADA_SQL="EXISTS(SELECT 1 FROM comunicacion_institucional cn WHERE cn.id_propuesta=p.id_propuesta AND cn.tipo='resolucion_cie' AND cn.confirmada=true)";
export const RESOLUCION_VIGENTE_SQL="p.estado_actual IN ('aprobada','rechazada') AND EXISTS(SELECT 1 FROM resolucion_cie rn WHERE rn.id_propuesta=p.id_propuesta AND rn.resultado=p.estado_actual)";
export const NOTIFICACION_FILTROS:Record<string,string>={
 pendientes:`(${RESOLUCION_VIGENTE_SQL}) AND NOT (${RESOLUCION_NOTIFICADA_SQL})`,
 notificadas:`(${RESOLUCION_VIGENTE_SQL}) AND (${RESOLUCION_NOTIFICADA_SQL})`,
 aprobaciones:"EXISTS(SELECT 1 FROM resolucion_cie rn WHERE rn.id_propuesta=p.id_propuesta AND rn.resultado='aprobada')",
 rechazos:"EXISTS(SELECT 1 FROM resolucion_cie rn WHERE rn.id_propuesta=p.id_propuesta AND rn.resultado='rechazada')",
};
