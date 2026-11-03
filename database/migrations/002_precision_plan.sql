-- El formulario oficial incluye actividades de 0,07 meses; no redondearlas a 0,1.
ALTER TABLE actividad_plan ALTER COLUMN duracion_meses TYPE numeric(8,2);
