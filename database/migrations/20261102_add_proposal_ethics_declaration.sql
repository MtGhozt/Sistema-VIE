ALTER TABLE propuesta
  ADD COLUMN IF NOT EXISTS aspectos_eticos jsonb,
  ADD COLUMN IF NOT EXISTS declaracion_jurada jsonb,
  ADD COLUMN IF NOT EXISTS resguardo_productos jsonb;
