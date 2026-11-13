/** La última revisión formal distingue recepción de evaluación, sin confundirla con PI. */
export const COMITE_ENVIADO_SQL="COALESCE((SELECT rv.resultado FROM revision_expediente rv WHERE rv.id_propuesta=p.id_propuesta AND rv.etapa='comite' ORDER BY rv.ciclo DESC,rv.id_revision DESC LIMIT 1),'')='completo'";

export const COMITE_DEVUELTA_SQL="p.estado_actual='en_subsanacion' AND EXISTS(SELECT 1 FROM propuesta_subsanacion ps WHERE ps.id_propuesta=p.id_propuesta AND ps.instancia='comite' AND ps.fecha_reenvio IS NULL)";
export const COMITE_RECEPCION_SQL=`p.estado_actual IN ('enviada','en_evaluacion') AND p.etapa_flujo BETWEEN 1 AND 2 AND NOT (${COMITE_ENVIADO_SQL})`;
export const COMITE_REENVIADA_SQL=`${COMITE_RECEPCION_SQL} AND EXISTS(SELECT 1 FROM propuesta_subsanacion ps WHERE ps.id_propuesta=p.id_propuesta AND ps.instancia='comite' AND ps.fecha_reenvio IS NOT NULL)`;
