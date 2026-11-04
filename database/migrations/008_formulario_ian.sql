-- Complementos del formulario de Ian. Las tablas normalizadas siguen siendo
-- la fuente de equipo, horas, plan, productos, presupuesto y decisiones.
ALTER TABLE propuesta ADD COLUMN IF NOT EXISTS formulario_detalle jsonb NOT NULL DEFAULT '{}'::jsonb;
