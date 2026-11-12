/** Estado documental de PI: independiente del estado académico de la propuesta. */
export const ESTADO_PI_SQL=`CASE
 WHEN NOT p.requiere_dictamen_pi AND EXISTS(SELECT 1 FROM pi_certificacion_no_requerido pc WHERE pc.id_propuesta=p.id_propuesta) THEN 'no_requerido'
 WHEN p.requiere_dictamen_pi AND dpi.estado='emitido' AND dpi.fecha_dictamen IS NOT NULL THEN 'emitido'
 WHEN EXISTS(SELECT 1 FROM revision_expediente rv WHERE rv.id_propuesta=p.id_propuesta AND rv.etapa='pi' AND rv.resultado='en_revision') THEN 'en_revision'
 ELSE 'pendiente' END`;
export const ESTADOS_PI={pendiente:'Pendiente de dictamen',en_revision:'En revisión de PI',emitido:'Dictamen emitido',no_requerido:'PI no requerido certificado'};
