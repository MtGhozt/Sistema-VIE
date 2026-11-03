-- D01: contador anual independiente del PK. Los códigos históricos se conservan.
CREATE TABLE propuesta_consecutivo_anual (
  anio integer PRIMARY KEY CHECK (anio BETWEEN 1900 AND 9999),
  ultimo bigint NOT NULL CHECK (ultimo >= 0)
);
INSERT INTO propuesta_consecutivo_anual(anio,ultimo)
SELECT substring(codigo from 6 for 4)::int, MAX(substring(codigo from 11)::bigint)
FROM propuesta WHERE codigo ~ '^PROP-[0-9]{4}-[0-9]+$'
GROUP BY substring(codigo from 6 for 4)::int;

-- D02: asignaciones expresas; no se presume ámbito transversal por el nombre del rol.
CREATE TABLE propuesta_asignacion (
  id_propuesta int NOT NULL REFERENCES propuesta(id_propuesta) ON DELETE CASCADE,
  id_usuario int NOT NULL REFERENCES usuario(id_usuario),
  rol varchar(40) NOT NULL REFERENCES rol(codigo),
  PRIMARY KEY(id_propuesta,id_usuario,rol)
);

-- D03: cada devolución mantiene destino, alcance autorizado y evidencia de atención.
CREATE TABLE propuesta_subsanacion (
  id_subsanacion int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_propuesta int NOT NULL REFERENCES propuesta(id_propuesta) ON DELETE CASCADE,
  instancia varchar(20) NOT NULL,
  rol_destino varchar(40) NOT NULL REFERENCES rol(codigo),
  estado_retorno varchar(40) NOT NULL,
  etapa_retorno smallint NOT NULL,
  secciones text[] NOT NULL CHECK (cardinality(secciones)>0),
  campos_atendidos text[] NOT NULL DEFAULT '{}',
  motivo text NOT NULL CHECK (length(trim(motivo))>0),
  id_devuelta_por int NOT NULL REFERENCES usuario(id_usuario),
  fecha_devolucion timestamptz NOT NULL DEFAULT NOW(),
  fecha_reenvio timestamptz,
  respuesta text
);
CREATE UNIQUE INDEX propuesta_subsanacion_activa ON propuesta_subsanacion(id_propuesta) WHERE fecha_reenvio IS NULL;

-- D04: no se inventan certificaciones para datos anteriores.
ALTER TABLE dictamen_pi ADD COLUMN fundamento_no_requerido text;

-- Los registros anteriores carecen de instancia inequívoca; no se les atribuye una inventada.
ALTER TABLE propuesta_historial_estado ADD COLUMN etapa_evento smallint CHECK (etapa_evento BETWEEN 0 AND 6);
