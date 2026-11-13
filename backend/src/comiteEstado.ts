/** La última revisión formal distingue recepción de evaluación, sin confundirla con PI. */
export const COMITE_ENVIADO_SQL="COALESCE((SELECT rv.resultado FROM revision_expediente rv WHERE rv.id_propuesta=p.id_propuesta AND rv.etapa='comite' ORDER BY rv.ciclo DESC,rv.id_revision DESC LIMIT 1),'')='completo'";
