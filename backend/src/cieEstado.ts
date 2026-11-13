/** La cola CIE exige remisión formal; el aval académico por sí solo no la habilita. */
export const CIE_PENDIENTE_SQL=`p.etapa_flujo=5 AND p.estado_actual='avalada' AND EXISTS(SELECT 1 FROM propuesta_historial_estado h WHERE h.id_propuesta=p.id_propuesta AND h.observacion='Expediente remitido al CIE')`;
export const CIE_FILTROS:Record<string,string>={
 pendientes:CIE_PENDIENTE_SQL,
 en_evaluacion:`(${CIE_PENDIENTE_SQL}) AND EXISTS(SELECT 1 FROM evaluacion ev WHERE ev.id_propuesta=p.id_propuesta AND ev.instancia='cie' AND ev.estado='en_progreso' AND ev.ciclo=p.ciclo_evaluacion AND ev.id_rubrica=p.id_rubrica_actual)`,
 aprobadas:"EXISTS(SELECT 1 FROM resolucion_cie res WHERE res.id_propuesta=p.id_propuesta AND res.resultado='aprobada')",
 rechazadas:"EXISTS(SELECT 1 FROM resolucion_cie res WHERE res.id_propuesta=p.id_propuesta AND res.resultado='rechazada')",
};
