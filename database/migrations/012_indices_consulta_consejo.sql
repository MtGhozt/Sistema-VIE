-- Índices para ámbito, remisiones, reconsideraciones y lectura de adjuntos.
CREATE INDEX IF NOT EXISTS comunicacion_expediente_tipo_fecha ON comunicacion_institucional(id_propuesta,tipo,fecha_envio DESC) WHERE confirmada;
CREATE INDEX IF NOT EXISTS reconsideracion_expediente_fecha ON reconsideracion_aval(id_propuesta,fecha_autorizacion DESC);
CREATE INDEX IF NOT EXISTS asignacion_usuario_rol_expediente ON propuesta_asignacion(id_usuario,rol,id_propuesta);
CREATE INDEX IF NOT EXISTS documento_expediente_version ON propuesta_documento(id_propuesta,nombre,numero_version DESC);
-- Evita planes de gran volumen basados en estimaciones antiguas después de una carga demo.
ANALYZE propuesta;
ANALYZE comunicacion_institucional;
ANALYZE reconsideracion_aval;
ANALYZE resultado_comite;
ANALYZE aval_consejo;
ANALYZE propuesta_asignacion;
ANALYZE revision_expediente;
ANALYZE propuesta_linea;
ANALYZE propuesta_documento;
