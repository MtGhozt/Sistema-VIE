-- Sugerencia de evaluación generada por IA para revisión del Comité Técnico.
-- Es un insumo separado de la nota humana: nunca modifica evaluacion ni su puntaje.
CREATE TABLE evaluacion_ia (
  id_evaluacion_ia bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_propuesta int NOT NULL REFERENCES propuesta(id_propuesta) ON DELETE CASCADE,
  id_rubrica int NOT NULL REFERENCES rubrica(id_rubrica),
  ciclo int NOT NULL CHECK (ciclo > 0),
  proveedor varchar(40) NOT NULL,
  modelo varchar(160) NOT NULL,
  resultado jsonb NOT NULL,
  puntaje_total numeric(5,2) NOT NULL CHECK (puntaje_total BETWEEN 0 AND 100),
  recomendacion varchar(20) NOT NULL CHECK (recomendacion IN ('RECOMIENDA', 'NO RECOMIENDA')),
  resumen text NOT NULL,
  generado_por int NOT NULL REFERENCES usuario(id_usuario),
  fecha_generacion timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (id_propuesta, id_rubrica, ciclo)
);

COMMENT ON TABLE evaluacion_ia IS 'Sugerencia automatizada no vinculante; la evaluación oficial sigue siendo la humana registrada en evaluacion/evaluacion_puntaje.';
