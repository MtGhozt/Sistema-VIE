-- D05/D07: versión inmutable de rúbrica por expediente y evaluadores independientes.
ALTER TABLE rubrica ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE rubrica ADD COLUMN definicion jsonb;
ALTER TABLE rubrica ADD COLUMN activa boolean NOT NULL DEFAULT true;
ALTER TABLE propuesta ADD COLUMN id_rubrica_actual int REFERENCES rubrica(id_rubrica);
CREATE TABLE comite_miembro (
 id_propuesta int REFERENCES propuesta(id_propuesta),
 id_usuario int REFERENCES usuario(id_usuario),
 PRIMARY KEY(id_propuesta,id_usuario)
);
ALTER TABLE evaluacion ADD COLUMN productos_cumplen boolean NOT NULL DEFAULT false;
CREATE TABLE auditoria_operacion (
 id_auditoria bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 id_usuario int NOT NULL REFERENCES usuario(id_usuario),
 accion text NOT NULL, entidad text NOT NULL, id_entidad int,
 motivo text NOT NULL, datos jsonb NOT NULL DEFAULT '{}', fecha timestamptz NOT NULL DEFAULT NOW()
);
-- Dos cuentas adicionales; la cuenta original sigue siendo el primer evaluador.
INSERT INTO usuario(correo_institucional,clave_hash,nombre_completo,id_escuela,activo,fecha_registro)
SELECT 'comite_evaluador'||n||'@tec.ac.cr',clave_hash,'Demo Evaluador Comité '||n,id_escuela,true,NOW()
FROM usuario CROSS JOIN generate_series(2,3) n WHERE correo_institucional='comite_evaluador@tec.ac.cr'
ON CONFLICT(correo_institucional) DO NOTHING;
INSERT INTO usuario_rol(id_usuario,id_rol,fecha_asignacion)
SELECT u.id_usuario,r.id_rol,CURRENT_DATE FROM usuario u CROSS JOIN rol r
WHERE u.correo_institucional IN ('comite_evaluador2@tec.ac.cr','comite_evaluador3@tec.ac.cr') AND r.codigo='comite_evaluador'
ON CONFLICT DO NOTHING;
-- D06: los documentos sembrados sin binario conservan sus metadatos, no se inventan archivos.
ALTER TABLE propuesta_documento ADD COLUMN bytes bigint;
ALTER TABLE propuesta_documento ADD COLUMN sha256 varchar(64);
ALTER TABLE propuesta_documento ADD COLUMN id_cargada_por int REFERENCES usuario(id_usuario);
ALTER TABLE propuesta_documento ADD COLUMN retirada boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX documento_version_real ON propuesta_documento(id_propuesta,nombre,numero_version) WHERE sha256 IS NOT NULL;
-- D07/D10: catálogos reales con baja lógica.
ALTER TABLE linea_investigacion ADD COLUMN activo boolean NOT NULL DEFAULT true;
CREATE TABLE modalidad_catalogo(codigo varchar(40) PRIMARY KEY,nombre text NOT NULL,activo boolean NOT NULL DEFAULT true);
INSERT INTO modalidad_catalogo VALUES ('basica','Investigación básica',true),('aplicada','Investigación aplicada',true),('basica_aplicada','Investigación básica y aplicada',true),('desarrollo_tecnologico','Desarrollo tecnológico',true),('fortalecimiento','Fortalecimiento',true);
-- D11: solicitudes y conservación íntegra de las decisiones de ciclos anteriores.
CREATE TABLE reconsideracion_aval (
 id_reconsideracion int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 id_propuesta int NOT NULL REFERENCES propuesta(id_propuesta),
 id_solicitante int NOT NULL REFERENCES usuario(id_usuario),
 motivo text NOT NULL CHECK(length(trim(motivo))>0),
 fecha_solicitud timestamptz NOT NULL DEFAULT NOW(),
 id_autorizador int REFERENCES usuario(id_usuario), fundamento text, fecha_autorizacion timestamptz
);
CREATE UNIQUE INDEX reconsideracion_pendiente ON reconsideracion_aval(id_propuesta) WHERE fecha_autorizacion IS NULL;
-- Rechazo de aval histórico se distingue de una resolución final CIE.
UPDATE propuesta p SET estado_actual='rechazo_aval',etapa_flujo=3
WHERE estado_actual='rechazada' AND EXISTS(SELECT 1 FROM aval_consejo a WHERE a.id_propuesta=p.id_propuesta AND a.resultado IN ('rechaza','rechazado'))
AND NOT EXISTS(SELECT 1 FROM resolucion_cie r WHERE r.id_propuesta=p.id_propuesta);
