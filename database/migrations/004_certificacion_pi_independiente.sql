-- Una certificación de no requerimiento no modifica ni reabre un dictamen existente.
-- Permite acreditar expedientes históricos cuyo flag era falso aunque tenían dictamen.
CREATE TABLE pi_certificacion_no_requerido (
  id_propuesta int PRIMARY KEY REFERENCES propuesta(id_propuesta) ON DELETE CASCADE,
  id_certificador int NOT NULL REFERENCES usuario(id_usuario),
  fundamento text NOT NULL CHECK (length(trim(fundamento))>0),
  fecha_certificacion timestamptz NOT NULL DEFAULT NOW()
);
-- Solo traslada certificaciones explícitas; nunca inventa motivos o responsables.
INSERT INTO pi_certificacion_no_requerido(id_propuesta,id_certificador,fundamento,fecha_certificacion)
SELECT id_propuesta,id_emisor,fundamento_no_requerido,fecha_dictamen::timestamptz
FROM dictamen_pi WHERE estado='no_requerido' AND length(trim(fundamento_no_requerido))>0 AND fecha_dictamen IS NOT NULL;
