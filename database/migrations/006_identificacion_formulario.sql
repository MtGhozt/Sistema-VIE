-- Disposiciones 2.6: identificar a la persona titular de las horas CONS.
ALTER TABLE propuesta_participante ADD COLUMN IF NOT EXISTS titular_cons varchar(150);
