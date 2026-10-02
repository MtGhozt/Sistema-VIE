-- Seed mínimo Sistema VIE (demo)
-- Password demo: no usamos hash real; login es por selección de rol (D13).
-- clave_hash se deja como marcador 'demo'.

BEGIN;

INSERT INTO escuela (codigo, nombre, activo) VALUES
  ('EIC', 'Escuela de Ingeniería en Computación', true),
  ('EIA', 'Escuela de Ingeniería Ambiental', true);

INSERT INTO rol (codigo, nombre, descripcion) VALUES
  ('vie_publicacion', 'VIE — Publicación', 'Publica convocatorias'),
  ('investigador', 'Persona Investigadora Coordinadora', 'Redacta y envía propuestas'),
  ('vinculacion', 'Centro de Vinculación', 'Dictamen de PI'),
  ('comite_asistente', 'Asistente del Comité Técnico', 'Completitud'),
  ('comite_evaluador', 'Cuerpo Evaluador del Comité Técnico', 'Rúbrica Comité'),
  ('consejo_asistente', 'Asistente del Consejo de Escuela', 'Prepara sesión'),
  ('consejo', 'Consejo de Profesores', 'Aval'),
  ('direccion_escuela', 'Dirección de Escuela', 'Comunica aval'),
  ('gestora_vie', 'Persona Gestora VIE', 'Verificación VIE'),
  ('cie', 'CIE', 'Resolución CIE'),
  ('direccion_investigacion', 'Dirección de Investigación', 'Notifica resolución'),
  ('admin', 'Super Administrador', 'Acceso total demo');

-- Un usuario demo por rol (correo = codigo@tec.ac.cr)
INSERT INTO usuario (correo_institucional, clave_hash, nombre_completo, cedula, id_escuela, activo, fecha_registro)
SELECT
  r.codigo || '@tec.ac.cr',
  'demo',
  'Demo ' || r.nombre,
  NULL,
  (SELECT id_escuela FROM escuela WHERE codigo = 'EIC'),
  true,
  NOW()
FROM rol r;

INSERT INTO usuario_rol (id_usuario, id_rol, fecha_asignacion)
SELECT u.id_usuario, r.id_rol, CURRENT_DATE
FROM usuario u
JOIN rol r ON u.correo_institucional = r.codigo || '@tec.ac.cr';

INSERT INTO convocatoria (
  nombre, descripcion, fecha_apertura, fecha_cierre,
  presupuesto_estimado, estado, id_publicada_por, fecha_publicacion
) VALUES (
  'Convocatoria Interna Fondos VIE 2027',
  'Convocatoria demo para el prototipo académico Sistema VIE.',
  '2026-09-01',
  '2027-03-31',
  150000000,
  'activa',
  (SELECT id_usuario FROM usuario WHERE correo_institucional = 'vie_publicacion@tec.ac.cr'),
  NOW()
);

INSERT INTO convocatoria_hito (id_convocatoria, nombre, responsable, fecha_inicio, fecha_fin, orden)
SELECT c.id_convocatoria, h.nombre, h.responsable, h.fecha_inicio::date, h.fecha_fin::date, h.orden
FROM convocatoria c
CROSS JOIN (VALUES
  ('Recepción de propuestas', 'VIE', '2026-09-01', '2026-11-30', 1),
  ('Evaluación Comité Técnico', 'Comité Técnico', '2026-12-01', '2027-01-15', 2),
  ('Avales de Escuela', 'Consejo de Escuela', '2027-01-16', '2027-02-15', 3),
  ('Resolución CIE', 'CIE', '2027-02-16', '2027-03-15', 4)
) AS h(nombre, responsable, fecha_inicio, fecha_fin, orden)
WHERE c.nombre = 'Convocatoria Interna Fondos VIE 2027';

INSERT INTO linea_investigacion (nombre) VALUES
  ('Ciencia de datos e IA'),
  ('Sostenibilidad y ambiente');

COMMIT;
