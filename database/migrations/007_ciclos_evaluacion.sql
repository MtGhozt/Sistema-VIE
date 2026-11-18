-- Una subsanación abre otro ciclo de evaluación; nunca modifica notas entregadas.
ALTER TABLE propuesta ADD COLUMN IF NOT EXISTS ciclo_evaluacion integer NOT NULL DEFAULT 1;
ALTER TABLE evaluacion ADD COLUMN IF NOT EXISTS ciclo integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS evaluacion_ciclo_actual ON evaluacion(id_propuesta,id_rubrica,instancia,ciclo,id_evaluador);
ALTER TABLE evaluacion ADD COLUMN IF NOT EXISTS productos_verificados boolean NOT NULL DEFAULT false;
-- Un cumplimiento calculado verdadero en la versión anterior implicaba confirmación humana explícita.
UPDATE evaluacion SET productos_verificados=true WHERE productos_cumplen=true AND productos_verificados=false;
