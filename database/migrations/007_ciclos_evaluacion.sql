-- Una subsanación abre otro ciclo de evaluación; nunca modifica notas entregadas.
ALTER TABLE propuesta ADD COLUMN ciclo_evaluacion integer NOT NULL DEFAULT 1 CHECK(ciclo_evaluacion>0);
ALTER TABLE evaluacion ADD COLUMN ciclo integer NOT NULL DEFAULT 1 CHECK(ciclo>0);
CREATE INDEX evaluacion_ciclo_actual ON evaluacion(id_propuesta,id_rubrica,instancia,ciclo,id_evaluador);
ALTER TABLE evaluacion ADD COLUMN productos_verificados boolean NOT NULL DEFAULT false;
-- Un cumplimiento calculado verdadero en la versión anterior implicaba confirmación humana explícita.
UPDATE evaluacion SET productos_verificados=true WHERE productos_cumplen=true;
