-- Integridad de evaluaciones individuales y índices de consulta frecuentes.
-- Deduplica filas huérfanas antes de imponer UNIQUE (propuesta, evaluador, instancia, rúbrica, ciclo).

WITH ranked AS (
  SELECT id_evaluacion,
         ROW_NUMBER() OVER (
           PARTITION BY id_propuesta, id_evaluador, instancia, id_rubrica, ciclo
           ORDER BY
             CASE WHEN estado = 'completada' THEN 0 ELSE 1 END,
             fecha_envio DESC NULLS LAST,
             id_evaluacion DESC
         ) AS rn
  FROM evaluacion
)
DELETE FROM evaluacion_puntaje
WHERE id_evaluacion IN (SELECT id_evaluacion FROM ranked WHERE rn > 1);

WITH ranked AS (
  SELECT id_evaluacion,
         ROW_NUMBER() OVER (
           PARTITION BY id_propuesta, id_evaluador, instancia, id_rubrica, ciclo
           ORDER BY
             CASE WHEN estado = 'completada' THEN 0 ELSE 1 END,
             fecha_envio DESC NULLS LAST,
             id_evaluacion DESC
         ) AS rn
  FROM evaluacion
)
DELETE FROM evaluacion
WHERE id_evaluacion IN (SELECT id_evaluacion FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS evaluacion_unica_ciclo
  ON evaluacion (id_propuesta, id_evaluador, instancia, id_rubrica, ciclo);

CREATE INDEX IF NOT EXISTS propuesta_escuela_estado_envio_idx
  ON propuesta (id_escuela, estado_actual, fecha_envio DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS propuesta_convocatoria_idx
  ON propuesta (id_convocatoria);

CREATE INDEX IF NOT EXISTS propuesta_coordinador_idx
  ON propuesta (id_coordinador);

CREATE INDEX IF NOT EXISTS propuesta_historial_propuesta_fecha_idx
  ON propuesta_historial_estado (id_propuesta, fecha_hora DESC);

CREATE INDEX IF NOT EXISTS propuesta_linea_linea_idx
  ON propuesta_linea (id_linea_investigacion);
