ALTER TABLE dictamen_pi ADD COLUMN IF NOT EXISTS emitido_en timestamptz;
COMMENT ON COLUMN dictamen_pi.emitido_en IS 'Instante de emisión asignado por el servidor. NULL en históricos cuya hora se desconoce.';
