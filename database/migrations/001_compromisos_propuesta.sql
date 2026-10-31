-- Formulario oficial: declaración jurada y dos compromisos de resguardo.
-- DEFAULT false evita atribuir aceptación a propuestas existentes.
ALTER TABLE propuesta ADD COLUMN IF NOT EXISTS declaracion_aceptada boolean NOT NULL DEFAULT false;
ALTER TABLE propuesta ADD COLUMN IF NOT EXISTS resguardo_repositorio boolean NOT NULL DEFAULT false;
ALTER TABLE propuesta ADD COLUMN IF NOT EXISTS resguardo_tecnico boolean NOT NULL DEFAULT false;
