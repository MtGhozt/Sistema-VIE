-- ============================================================================
-- Seed demo — Sistema VIE (Fondos VIE, TEC)
-- ============================================================================
--
-- Datos semilla realistas para demostrar:
--   * el módulo Histórico con filtros combinados (escuela, persona
--     investigadora, línea de investigación, estado y año);
--   * la ruta institucional completa (convocatoria → propuesta → oficios).
--
-- Login demo: el backend resuelve el usuario por
--   correo_institucional = <codigo_rol>@tec.ac.cr
-- por lo que hay exactamente un usuario por rol. Las personas investigadoras
-- reales que aparecen en el histórico tienen otro correo y no se ofrecen
-- como opciones de login.
--
-- IMPORTANTE: este script corre SOLO al crear el volumen de Docker.
-- Para reaplicarlo sobre una base existente:
--   docker compose down -v && docker compose up -d
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Dependencias académicas
-- ---------------------------------------------------------------------------
INSERT INTO escuela (codigo, nombre, activo) VALUES
  ('EIC', 'Escuela de Ingeniería en Computación', true),
  ('EIA', 'Escuela de Ingeniería Ambiental', true),
  ('EEM', 'Escuela de Ingeniería Electromecánica', true),
  ('EIF', 'Escuela de Ingeniería Forestal', true),
  ('ECO', 'Escuela de Ingeniería en Construcción', true),
  ('EAG', 'Escuela de Ingeniería Agronómica', true);

-- ---------------------------------------------------------------------------
-- 2. Roles institucionales
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3. Un usuario demo por rol (para el selector de login)
--    clave_hash se deja como marcador 'demo': el prototipo no valida claves.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4. Personas investigadoras coordinadoras (alimentan el histórico)
--    No aparecen en el login demo: su correo no sigue el patrón del rol.
-- ---------------------------------------------------------------------------
INSERT INTO usuario (correo_institucional, clave_hash, nombre_completo, cedula, orcid, id_escuela, activo, fecha_registro)
SELECT
  v.correo,
  'demo',
  v.nombre,
  v.cedula,
  v.orcid,
  (SELECT e.id_escuela FROM escuela e WHERE e.codigo = v.escuela),
  true,
  DATE '2023-01-15'
FROM (VALUES
  ('a.solano@tec.ac.cr',    'Ana Solano Ramírez',       '1-0274-0884', '0000-0002-1825-0097', 'EEM'),
  ('d.mora@tec.ac.cr',      'David Mora Jiménez',       '1-0392-0411', '0000-0001-5578-1234', 'EIF'),
  ('l.vega@tec.ac.cr',      'Laura Vega Soto',          '1-0451-0227', '0000-0003-3311-8842', 'EAG'),
  ('m.rojas@tec.ac.cr',     'Mario Rojas Chávez',       '1-0518-0763', '0000-0002-4417-6620', 'ECO'),
  ('s.vargas@tec.ac.cr',    'Sofía Vargas Núñez',       '1-0633-0908', '0000-0002-7745-1190', 'EIA'),
  ('a.chinchilla@tec.ac.cr','Andrés Chinchilla Mora',   '1-0704-0336', '0000-0001-9923-4405', 'EIA'),
  ('i.nunez@tec.ac.cr',     'Isabel Núñez Brenes',      '1-0829-0175', '0000-0003-1180-5567', 'EAG'),
  ('mrodriguez@tec.ac.cr',  'María Rodríguez Jiménez',  '1-0945-0642', '0000-0002-2298-7734', 'EIC'),
  ('e.jimenez@tec.ac.cr',   'Esteban Jiménez Álvarez', '1-1057-0519', '0000-0001-3347-9981', 'EEM'),
  ('v.castro@tec.ac.cr',    'Valeria Castro Hernández', '1-1163-0284', '0000-0003-8861-2204', 'ECO'),
  ('k.fonseca@tec.ac.cr',   'Karla Fonseca Mora',       '1-1270-0953', '0000-0002-5503-6612', 'EIC'),
  ('r.bermudez@tec.ac.cr',  'Randall Bermúdez Solano',  '1-1381-0728', '0000-0001-6672-3390', 'EIF')
) AS v(correo, nombre, cedula, orcid, escuela);

-- Las personas investigadoras también tienen el rol `investigador`.
-- El patrón '%.%@tec.ac.cr' distingue a las personas reales (nombre.apellido)
-- de los usuarios demo del paso 3, que usan solo el código de rol.
INSERT INTO usuario_rol (id_usuario, id_rol, fecha_asignacion)
SELECT u.id_usuario, r.id_rol, DATE '2023-01-15'
FROM usuario u
JOIN rol r ON r.codigo = 'investigador'
WHERE u.correo_institucional LIKE '%.%@tec.ac.cr';

-- ---------------------------------------------------------------------------
-- 5. Líneas de investigación
-- ---------------------------------------------------------------------------
INSERT INTO linea_investigacion (nombre) VALUES
  ('Ciencia de datos e inteligencia artificial'),
  ('Sostenibilidad y ambiente'),
  ('Energías renovables'),
  ('Biotecnología agrícola'),
  ('Materiales y construcción sostenible'),
  ('Gestión de cuencas y recursos hídricos'),
  ('Salud y bienestar'),
  ('Educación y tecnología');

-- ---------------------------------------------------------------------------
-- 6. Convocatorias 2024–2027 con su cronograma
-- ---------------------------------------------------------------------------
INSERT INTO convocatoria (
  nombre, descripcion, fecha_apertura, fecha_cierre,
  presupuesto_estimado, estado, id_publicada_por, fecha_publicacion
) VALUES
  ('Convocatoria Interna Fondos VIE 2024',
   'Convocatoria demo 2024 para el prototipo académico Sistema VIE.',
   '2024-01-08', '2024-03-29', 120000000, 'cerrada',
   (SELECT id_usuario FROM usuario WHERE correo_institucional = 'vie_publicacion@tec.ac.cr'),
   DATE '2024-01-08'),
  ('Convocatoria Interna Fondos VIE 2025',
   'Convocatoria demo 2025 para el prototipo académico Sistema VIE.',
   '2025-01-13', '2025-04-11', 135000000, 'cerrada',
   (SELECT id_usuario FROM usuario WHERE correo_institucional = 'vie_publicacion@tec.ac.cr'),
   DATE '2025-01-13'),
  ('Convocatoria Interna Fondos VIE 2026',
   'Convocatoria demo 2026 para el prototipo académico Sistema VIE.',
   '2026-01-12', '2026-04-10', 140000000, 'cerrada',
   (SELECT id_usuario FROM usuario WHERE correo_institucional = 'vie_publicacion@tec.ac.cr'),
   DATE '2026-01-12'),
  ('Convocatoria Interna Fondos VIE 2027',
   'Convocatoria demo para el prototipo académico Sistema VIE.',
   '2026-09-01', '2027-03-31', 150000000, 'activa',
   (SELECT id_usuario FROM usuario WHERE correo_institucional = 'vie_publicacion@tec.ac.cr'),
   NOW());

INSERT INTO convocatoria_hito (id_convocatoria, nombre, responsable, fecha_inicio, fecha_fin, orden)
SELECT c.id_convocatoria, h.nombre, h.responsable, h.fecha_inicio::date, h.fecha_fin::date, h.orden
FROM convocatoria c
CROSS JOIN (VALUES
  ('Recepción de propuestas',        'VIE',                '2026-09-01', '2026-11-30', 1),
  ('Evaluación Comité Técnico',      'Comité Técnico',     '2026-12-01', '2027-01-15', 2),
  ('Avales de Escuela',              'Consejo de Escuela', '2027-01-16', '2027-02-15', 3),
  ('Resolución CIE',                 'CIE',                '2027-02-16', '2027-03-15', 4)
) AS h(nombre, responsable, fecha_inicio, fecha_fin, orden)
WHERE c.nombre = 'Convocatoria Interna Fondos VIE 2027';

INSERT INTO convocatoria_hito (id_convocatoria, nombre, responsable, fecha_inicio, fecha_fin, orden)
SELECT c.id_convocatoria, h.nombre, h.responsable, h.fecha_inicio::date, h.fecha_fin::date, h.orden
FROM convocatoria c
CROSS JOIN (VALUES
  ('Recepción de propuestas',        'VIE',                '2025-01-13', '2025-03-14', 1),
  ('Evaluación Comité Técnico',      'Comité Técnico',     '2025-03-17', '2025-05-30', 2),
  ('Avales de Escuela',              'Consejo de Escuela', '2025-06-02', '2025-08-29', 3),
  ('Resolución CIE',                 'CIE',                '2025-09-01', '2025-10-31', 4)
) AS h(nombre, responsable, fecha_inicio, fecha_fin, orden)
WHERE c.nombre = 'Convocatoria Interna Fondos VIE 2025';

INSERT INTO convocatoria_hito (id_convocatoria, nombre, responsable, fecha_inicio, fecha_fin, orden)
SELECT c.id_convocatoria, h.nombre, h.responsable, h.fecha_inicio::date, h.fecha_fin::date, h.orden
FROM convocatoria c
CROSS JOIN (VALUES
  ('Recepción de propuestas',        'VIE',                '2024-01-08', '2024-03-15', 1),
  ('Evaluación Comité Técnico',      'Comité Técnico',     '2024-03-18', '2024-05-31', 2),
  ('Avales de Escuela',              'Consejo de Escuela', '2024-06-03', '2024-08-30', 3),
  ('Resolución CIE',                 'CIE',                '2024-09-02', '2024-10-31', 4)
) AS h(nombre, responsable, fecha_inicio, fecha_fin, orden)
WHERE c.nombre = 'Convocatoria Interna Fondos VIE 2024';

-- ---------------------------------------------------------------------------
-- 7. Propuestas
--
--    estado_actual: borrador | enviada | en_evaluacion | dictaminada |
--                  avalada | aprobada | rechazada
--    etapa_flujo:   0 redacción · 1 envío · 2 comité · 3 consejo ·
--                   4 VIE · 5 CIE · 6 resolución
-- ---------------------------------------------------------------------------
INSERT INTO propuesta (
  codigo, id_convocatoria, id_coordinador, id_escuela, titulo, modalidad,
  fecha_inicio, fecha_finalizacion, fecha_envio, resumen, abstract_en,
  problema, objetivo_general, metodologia, trl_actual, trl_esperado,
  requiere_dictamen_pi, estado_actual, etapa_flujo
)
SELECT
  v.codigo,
  (SELECT c.id_convocatoria FROM convocatoria c WHERE c.nombre = v.convocatoria),
  (SELECT u.id_usuario FROM usuario u WHERE u.correo_institucional = v.coordinador),
  (SELECT e.id_escuela FROM escuela e WHERE e.codigo = v.escuela),
  v.titulo,
  v.modalidad,
  v.fecha_inicio::date,
  v.fecha_finalizacion::date,
  v.fecha_envio::timestamptz,
  v.resumen,
  v.abstract_en,
  v.problema,
  v.objetivo,
  v.metodologia,
  v.trl_actual::smallint,
  v.trl_esperado::smallint,
  v.requiere_pi::boolean,
  v.estado,
  v.etapa::smallint
FROM (VALUES
  ('PROP-2024-011', 'Convocatoria Interna Fondos VIE 2024', 'a.solano@tec.ac.cr', 'EEM',
   'Optimización energética en microredes universitarias', 'desarrollo_tecnologico',
   '2024-02-01', '2025-02-28', '2024-01-19',
   'Optimización del despacho de carga en microredes de campus mediante predicción de demanda y control distribuido.',
   'Optimization of energy dispatch in campus microgrids using demand forecasting and distributed control.',
   'Las microredes de los campus operan con despacho reactivo y sin visibilidad del comportamiento de la demanda.',
   'Desarrollar y validar un esquema de predicción y despacho que reduzca el consumo de red de las microredes universitarias.',
   'Pronóstico de demanda con modelos de series temporales y optimización restringida, validada en dos campus piloto.',
   3, 6, true, 'aprobada', 6),

  ('PROP-2024-018', 'Convocatoria Interna Fondos VIE 2024', 'd.mora@tec.ac.cr', 'EIF',
   'Modelo predictivo de erosión en cuencas del Caribe', 'basica_aplicada',
   '2024-03-01', '2025-08-31', '2024-02-06',
   'Modelo predictivo de erosión costera para cuencas del Caribe construido con información satelital y topográfica.',
   'Predictive coastal erosion model for Caribbean basins built from satellite and topographic data.',
   'La erosión costera en el Caribe avanza sin cuantificación sistemática del riesgo en las cuencas.',
   'Validar un modelo predictivo de erosión costera con datos satelitales y de campo.',
   'Teledetección, modelación numérica y validación con parcelas experimentales.',
   2, 5, false, 'aprobada', 6),

  ('PROP-2024-026', 'Convocatoria Interna Fondos VIE 2024', 'l.vega@tec.ac.cr', 'EAG',
   'Herramienta de apoyo para diagnóstico de enfermedades del café', 'aplicada',
   '2024-04-01', '2025-03-31', '2024-02-26',
   'Aplicación móvil de apoyo al diagnóstico de enfermedades del café por procesamiento de imágenes de hoja.',
   'Mobile decision-support tool for coffee leaf disease diagnosis through image processing.',
   'El diagnóstico de enfermedades del café depende de inspección visual y escasea de especialista en el campo.',
   'Validar en campo una herramienta de diagnóstico asistido para enfermedades del café.',
   'Visión por computador con modelos de aprendizaje profundo y validación agronómica en fincas.',
   4, 7, true, 'rechazada', 6),

  ('PROP-2024-033', 'Convocatoria Interna Fondos VIE 2024', 'm.rojas@tec.ac.cr', 'ECO',
   'Análisis de materiales sostenibles para construcción', 'desarrollo_tecnologico',
   '2024-05-01', '2025-10-31', '2024-03-11',
   'Caracterización de mezclas con agregados reciclados y geopolímeros para elementos prefabricados.',
   'Characterization of recycled-aggregate and geopolymer mixes for prefabricated elements.',
   'La construcción convencional depende de agregados vírgenes con alta huella de carbono.',
   'Desarrollar mezclas de bajo impacto con agregados reciclados y binder geopolimérico.',
   'Ensayo de materiales, caracterización mecánica y de durabilidad, y ensayo en elementos a escala.',
   3, 6, false, 'aprobada', 6),

  ('PROP-2025-007', 'Convocatoria Interna Fondos VIE 2025', 's.vargas@tec.ac.cr', 'EIA',
   'Alerta temprana de crecidas en el Tempisque', 'basica_aplicada',
   '2025-02-01', '2026-01-31', '2025-01-24',
   'Sistema de alerta temprana de crecidas del Tempisque con telemetría de lluvia y radares.',
   'Early warning system for the Tempisque river floods using rain telemetry and radar.',
   'Las comunidades ribereñas carecen de alertas oportunas de crecidas.',
   'Diseñar y operar un sistema de alerta temprana de crecidas con umbral validado.',
   'Modelación hidrológica, telemetría y validación retrospectiva con eventos históricos.',
   2, 5, false, 'rechazada', 6),

  ('PROP-2025-014', 'Convocatoria Interna Fondos VIE 2025', 'v.castro@tec.ac.cr', 'ECO',
   'Detector de fisuras en concreto con visión por computadora', 'desarrollo_tecnologico',
   '2025-03-01', '2026-02-28', '2025-02-11',
   'Detección automática de fisuras en superficies de concreto mediante visión por computadora.',
   'Automatic crack detection on concrete surfaces using computer vision.',
   'La inspección manual de fisuras en infraestructura es lenta, costosa y subjetiva.',
   'Desarrollar un detector de fisuras operable en sitio con precisión mínima de 90 %.',
   'Redes convolucionales entrenadas con imágenes de dron y validación en estructuras reales.',
   3, 6, true, 'aprobada', 6),

  ('PROP-2025-021', 'Convocatoria Interna Fondos VIE 2025', 'a.chinchilla@tec.ac.cr', 'EIA',
   'Calidad del agua en embalses de la región central', 'basica',
   '2025-05-01', '2026-12-31', '2025-03-27',
   'Monitoreo y modelación de la calidad del agua en embalses de la región central.',
   'Monitoring and modeling of water quality in central region reservoirs.',
   'Los embalses carecen de series de monitoreo continuas que permitan anticipar floraciones.',
   'Caracterizar la dinámica de eutrofización y proponer umbrales de gestión.',
   'Monitoreo in situ, analítica de laboratorio y modelación acoplada de calidad de agua.',
   2, 4, false, 'en_evaluacion', 2),

  ('PROP-2025-028', 'Convocatoria Interna Fondos VIE 2025', 'i.nunez@tec.ac.cr', 'EAG',
   'Red de sensores de bajo costo para monitoreo agrícola', 'desarrollo_tecnologico',
   '2025-06-01', '2026-11-30', '2025-04-24',
   'Red de sensores de bajo costo para humedad de suelo y microclima en parcelas agrícolas.',
   'Low-cost sensor network for soil moisture and microclimate in agricultural plots.',
   'Los productores pequeños no tienen acceso a instrumentación de riego de precisión.',
   'Validar una red de sensores de código abierto calibrada para parcelas del trópico húmedo.',
   'Diseño electrónico, calibración de campo y validación contrastada con estaciones meteorológicas.',
   4, 7, false, 'dictaminada', 3),

  ('PROP-2025-036', 'Convocatoria Interna Fondos VIE 2025', 'mrodriguez@tec.ac.cr', 'EIC',
   'Biblioteca de modelos de difusión para sistemas de recomendación', 'basica',
   '2025-07-01', '2026-12-31', '2025-05-15',
   'Modelos de difusión para sistemas de recomendación, con implementación de referencia y evaluación reproducible.',
   'Diffusion models for recommendation systems, with a reference implementation and reproducible evaluation.',
   'Los modelos de difusión no cuentan con implementaciones de referencia comparables en el área.',
   'Construir y evaluar una biblioteca de modelos de difusión para recomendación.',
   'Reproducción de literatura, diseño experimental y evaluación con métricas públicas.',
   2, 4, false, 'enviada', 1),

  ('PROP-2025-042', 'Convocatoria Interna Fondos VIE 2025', 'e.jimenez@tec.ac.cr', 'EEM',
   'Recuperación de metales críticos desde residuos electrónicos', 'desarrollo_tecnologico',
   '2025-08-01', '2027-01-31', '2025-06-05',
   'Proceso electroquímico de recuperación de metales críticos desde placas de circuitos impresos.',
   'Electrochemical recovery of critical metals from printed circuit boards.',
   'Los residuos electrónicos acumulan metales críticos que hoy se exportan sin valor agregado.',
   'Desarrollar un proceso electroquímico viable a escala de laboratorio.',
   'Diseño de celda electroquímica, caracterización y pruebas de lixiviación.',
   5, 7, true, 'rechazada', 6),

  ('PROP-2026-004', 'Convocatoria Interna Fondos VIE 2026', 'k.fonseca@tec.ac.cr', 'EIC',
   'Asistente conversacional para grupos de investigación del TEC', 'desarrollo_tecnologico',
   '2026-02-01', '2027-01-31', '2026-01-23',
   'Asistente conversacional institucional con recuperación de fuentes verificables del repositorio.',
   'Institutional conversational assistant with verifiable source retrieval from the repository.',
   'Los grupos de investigación pierden tiempo buscando en repositorios dispersos.',
   'Desarrollar un asistente conversacional con citas trazables al repositorio institucional.',
   'Ingeniería de instrucciones, recuperación semántica y evaluación con juicio humano.',
   3, 6, true, 'en_evaluacion', 2),

  ('PROP-2026-012', 'Convocatoria Interna Fondos VIE 2026', 'l.vega@tec.ac.cr', 'EAG',
   'Irrigación de precisión con sensores de humedad del suelo', 'aplicada',
   '2026-03-01', '2027-05-31', '2026-02-10',
   'Programación de riego por humedad de suelo para pequeños productores con sensores de bajo costo.',
   'Irrigation scheduling driven by soil moisture sensing for small producers.',
   'El riego por temporizadores desperdicia agua en parcelas pequeñas.',
   'Validar una estrategia de riego basada en sensores de humedad de suelo.',
   'Ensayo de campo con dos tratamientos y medición de consumo de agua y rendimiento.',
   4, 6, false, 'enviada', 1),

  ('PROP-2026-019', 'Convocatoria Interna Fondos VIE 2027', 'a.solano@tec.ac.cr', 'EEM',
   'Auditoría energética de edificios del campus', 'fortalecimiento',
   '2026-04-01', '2027-03-31', NULL,
   'Auditoría energética de edificios del campus y plan de intervenciones de eficiencia.',
   'Campus building energy audit and efficiency intervention plan.',
   'No existe una línea base de consumo energético por edificio.',
   'Levantar la línea base energética y priorizar intervenciones de eficiencia.',
   'Medición con equipo portátil, análisis de consumos y priorización de medidas.',
   2, 4, false, 'borrador', 0),

  ('PROP-2026-023', 'Convocatoria Interna Fondos VIE 2027', 'r.bermudez@tec.ac.cr', 'EIF',
   'Valoración de servicios ecosistémicos en cuencas del país', 'basica_aplicada',
   '2026-04-01', '2027-08-31', NULL,
   'Valoración de servicios ecosistémicos en cuencas del país para el planeamiento local.',
   'Ecosystem services valuation in national watersheds for local planning.',
   'Los planes de desarrollo municipal no incorporan el valor de los servicios ecosistémicos.',
   'Valorar servicios ecosistémicos y traducirlos a insumo para el planeamiento territorial.',
   'Valoración contingente, análisis de usos de suelo y talleres participativos.',
   2, 4, false, 'borrador', 0),

  ('PROP-2026-028', 'Convocatoria Interna Fondos VIE 2026', 'd.mora@tec.ac.cr', 'EIF',
   'Fenómenos de ladera y riesgo de deslizamiento en Pérez Zeledón', 'basica',
   '2026-05-01', '2027-11-30', '2026-04-14',
   'Modelación de susceptibilidad a deslizamientos y mapa de riesgo en el cantón de Pérez Zeledón.',
   'Landslide susceptibility modeling and risk mapping in Pérez Zeledón.',
   'El cantón presenta deslizamientos recurrentes sin cartografía de riesgo actualizada.',
   'Actualizar el mapa de susceptibilidad y priorizar obras de mitigación.',
   'Teledetección, sistemas de información geográfica y validación con registros de eventos.',
   2, 5, false, 'enviada', 1),

  ('PROP-2026-031', 'Convocatoria Interna Fondos VIE 2026', 'mrodriguez@tec.ac.cr', 'EIC',
   'Plataforma de evaluación de modelos de visión por computadora en el contexto local', 'desarrollo_tecnologico',
   '2026-05-01', '2027-12-31', '2026-04-22',
   'Plataforma web de evaluación reproducible de modelos de visión por computadora aplicados a imágenes locales.',
   'Web platform for reproducible evaluation of computer vision models on local imagery.',
   'La evaluación de modelos de visión en el país se hace con scripts dispersos y no reproducibles.',
   'Desarrollar una plataforma de evaluación reproducible con conjuntos de datos institucionales.',
   'Ingeniería de software, diseño de evaluaciones y validación con casos de uso.',
   3, 5, false, 'avalada', 4)
) AS v(
  codigo, convocatoria, coordinador, escuela, titulo, modalidad,
  fecha_inicio, fecha_finalizacion, fecha_envio, resumen, abstract_en,
  problema, objetivo, metodologia, trl_actual, trl_esperado, requiere_pi, estado, etapa
);

-- ---------------------------------------------------------------------------
-- 8. Línea de investigación por propuesta
-- ---------------------------------------------------------------------------
INSERT INTO propuesta_linea (id_propuesta, id_linea_investigacion)
SELECT p.id_propuesta, l.id_linea_investigacion
FROM (VALUES
  ('PROP-2024-011', 'Energías renovables'),
  ('PROP-2024-011', 'Sostenibilidad y ambiente'),
  ('PROP-2024-018', 'Gestión de cuencas y recursos hídricos'),
  ('PROP-2024-018', 'Sostenibilidad y ambiente'),
  ('PROP-2024-026', 'Biotecnología agrícola'),
  ('PROP-2024-033', 'Materiales y construcción sostenible'),
  ('PROP-2025-007', 'Gestión de cuencas y recursos hídricos'),
  ('PROP-2025-014', 'Materiales y construcción sostenible'),
  ('PROP-2025-014', 'Ciencia de datos e inteligencia artificial'),
  ('PROP-2025-021', 'Sostenibilidad y ambiente'),
  ('PROP-2025-021', 'Gestión de cuencas y recursos hídricos'),
  ('PROP-2025-028', 'Biotecnología agrícola'),
  ('PROP-2025-028', 'Energías renovables'),
  ('PROP-2025-036', 'Ciencia de datos e inteligencia artificial'),
  ('PROP-2025-042', 'Materiales y construcción sostenible'),
  ('PROP-2025-042', 'Sostenibilidad y ambiente'),
  ('PROP-2026-004', 'Ciencia de datos e inteligencia artificial'),
  ('PROP-2026-012', 'Biotecnología agrícola'),
  ('PROP-2026-019', 'Energías renovables'),
  ('PROP-2026-023', 'Gestión de cuencas y recursos hídricos'),
  ('PROP-2026-023', 'Salud y bienestar'),
  ('PROP-2026-028', 'Gestión de cuencas y recursos hídricos'),
  ('PROP-2026-031', 'Ciencia de datos e inteligencia artificial')
) AS v(codigo, linea)
JOIN propuesta p ON p.codigo = v.codigo
JOIN linea_investigacion l ON l.nombre = v.linea;

-- ---------------------------------------------------------------------------
-- 9. Palabras clave
-- ---------------------------------------------------------------------------
INSERT INTO propuesta_palabra_clave (id_propuesta, idioma, palabra)
SELECT p.id_propuesta, v.idioma, v.palabra
FROM (VALUES
  ('PROP-2024-011', 'es', 'microredes'),       ('PROP-2024-011', 'es', 'energía'),
  ('PROP-2024-011', 'en', 'microgrids'),       ('PROP-2024-011', 'en', 'energy'),
  ('PROP-2024-018', 'es', 'erosión'),          ('PROP-2024-018', 'es', 'cuencas'),
  ('PROP-2024-018', 'en', 'erosion'),          ('PROP-2024-018', 'en', 'watersheds'),
  ('PROP-2024-026', 'es', 'café'),             ('PROP-2024-026', 'es', 'fitopatología'),
  ('PROP-2024-033', 'es', 'geopolímero'),      ('PROP-2024-033', 'en', 'geopolymer'),
  ('PROP-2025-007', 'es', 'crecidas'),         ('PROP-2025-007', 'en', 'floods'),
  ('PROP-2025-014', 'es', 'fisuras'),          ('PROP-2025-014', 'en', 'crack-detection'),
  ('PROP-2025-021', 'es', 'eutrofización'),    ('PROP-2025-021', 'en', 'eutrophication'),
  ('PROP-2025-028', 'es', 'riego'),            ('PROP-2025-028', 'en', 'irrigation'),
  ('PROP-2025-036', 'es', 'difusión'),         ('PROP-2025-036', 'en', 'diffusion-models'),
  ('PROP-2025-042', 'es', 'metales críticos'), ('PROP-2025-042', 'en', 'critical-metals'),
  ('PROP-2026-004', 'es', 'asistente'),        ('PROP-2026-004', 'en', 'assistants'),
  ('PROP-2026-012', 'es', 'humedad de suelo'), ('PROP-2026-012', 'en', 'soil-moisture'),
  ('PROP-2026-019', 'es', 'auditoría energética'), ('PROP-2026-019', 'en', 'energy-audit'),
  ('PROP-2026-023', 'es', 'servicios ecosistémicos'), ('PROP-2026-023', 'en', 'ecosystem-services'),
  ('PROP-2026-028', 'es', 'deslizamientos'),   ('PROP-2026-028', 'en', 'landslides'),
  ('PROP-2026-031', 'es', 'visión por computadora'), ('PROP-2026-031', 'en', 'computer-vision')
) AS v(codigo, idioma, palabra)
JOIN propuesta p ON p.codigo = v.codigo;

-- ---------------------------------------------------------------------------
-- 10. Historial de estados (ruta institucional)
-- ---------------------------------------------------------------------------
INSERT INTO propuesta_historial_estado (
  id_propuesta, estado_anterior, estado_nuevo, id_usuario, fecha_hora, observacion
)
SELECT p.id_propuesta, v.anterior, v.nuevo, u.id_usuario, v.fecha::timestamptz, v.observacion
FROM (VALUES
  ('PROP-2024-011', NULL,           'enviada',       'a.solano@tec.ac.cr',        '2024-01-19 09:12', 'Envío inicial'),
  ('PROP-2024-011', 'enviada',      'en_evaluacion', 'vinculacion@tec.ac.cr',    '2024-02-05 14:40', 'Dictamen PI emitido y expediente completo'),
  ('PROP-2024-011', 'en_evaluacion','avalada',       'consejo@tec.ac.cr',       '2024-05-20 10:05', 'Aval del Consejo de Escuela'),
  ('PROP-2024-011', 'avalada',      'aprobada',      'cie@tec.ac.cr',           '2024-09-18 11:30', 'Resolución CIE favorable'),
  ('PROP-2024-018', NULL,           'enviada',       'd.mora@tec.ac.cr',        '2024-02-06 08:55', 'Envío inicial'),
  ('PROP-2024-018', 'enviada',      'en_evaluacion', 'comite_evaluador@tec.ac.cr', '2024-03-01 16:20', 'Evaluación técnica en curso'),
  ('PROP-2024-018', 'en_evaluacion','aprobada',      'cie@tec.ac.cr',           '2024-09-30 09:45', 'Resolución CIE favorable'),
  ('PROP-2024-026', NULL,           'enviada',       'l.vega@tec.ac.cr',        '2024-02-26 11:20', 'Envío inicial'),
  ('PROP-2024-026', 'enviada',      'rechazada',     'cie@tec.ac.cr',           '2024-10-08 15:00', 'Resolución CIE desfavorable: requisitos mínimos no cumplidos'),
  ('PROP-2024-033', NULL,           'enviada',       'm.rojas@tec.ac.cr',       '2024-03-11 13:40', 'Envío inicial'),
  ('PROP-2024-033', 'enviada',      'aprobada',      'cie@tec.ac.cr',           '2024-10-22 10:15', 'Resolución CIE favorable'),
  ('PROP-2025-007', NULL,           'enviada',       's.vargas@tec.ac.cr',      '2025-01-24 09:30', 'Envío inicial'),
  ('PROP-2025-007', 'enviada',      'rechazada',     'cie@tec.ac.cr',           '2025-11-04 09:00', 'Resolución CIE desfavorable: el alcance no se ajusta a la convocatoria'),
  ('PROP-2025-014', NULL,           'enviada',       'v.castro@tec.ac.cr',      '2025-02-11 10:10', 'Envío inicial'),
  ('PROP-2025-014', 'enviada',      'aprobada',      'cie@tec.ac.cr',           '2025-11-18 11:45', 'Resolución CIE favorable'),
  ('PROP-2025-021', NULL,           'enviada',       'a.chinchilla@tec.ac.cr',  '2025-03-27 14:05', 'Envío inicial'),
  ('PROP-2025-021', 'enviada',      'en_evaluacion', 'comite_evaluador@tec.ac.cr', '2025-05-06 09:50', 'Ingreso al Comité Técnico'),
  ('PROP-2025-028', NULL,           'enviada',       'i.nunez@tec.ac.cr',       '2025-04-24 15:35', 'Envío inicial'),
  ('PROP-2025-028', 'enviada',      'dictaminada',   'consejo@tec.ac.cr',       '2025-08-14 11:20', 'Aval favorable en sesión de Consejo'),
  ('PROP-2025-036', NULL,           'enviada',       'mrodriguez@tec.ac.cr',   '2025-05-15 08:45', 'Envío inicial'),
  ('PROP-2025-042', NULL,           'enviada',       'e.jimenez@tec.ac.cr',     '2025-06-05 10:25', 'Envío inicial'),
  ('PROP-2025-042', 'enviada',      'rechazada',     'cie@tec.ac.cr',           '2025-12-01 09:40', 'Resolución CIE desfavorable: no se acredita el aporte institucional'),
  ('PROP-2026-004', NULL,           'enviada',       'k.fonseca@tec.ac.cr',     '2026-01-23 11:00', 'Envío inicial'),
  ('PROP-2026-004', 'enviada',      'en_evaluacion', 'comite_evaluador@tec.ac.cr', '2026-03-09 10:30', 'Ingreso al Comité Técnico'),
  ('PROP-2026-012', NULL,           'enviada',       'l.vega@tec.ac.cr',        '2026-02-10 16:15', 'Envío inicial'),
  ('PROP-2026-028', NULL,           'enviada',       'd.mora@tec.ac.cr',        '2026-04-14 09:20', 'Envío inicial'),
  ('PROP-2026-031', NULL,           'enviada',       'mrodriguez@tec.ac.cr',   '2026-04-22 13:50', 'Envío inicial'),
  ('PROP-2026-031', 'enviada',      'avalada',       'direccion_escuela@tec.ac.cr', '2026-05-06 10:10', 'Aval de la Dirección de Escuela comunicado al CIE')
) AS v(codigo, anterior, nuevo, correo, fecha, observacion)
JOIN propuesta p ON p.codigo = v.codigo
JOIN usuario u ON u.correo_institucional = v.correo;

-- ---------------------------------------------------------------------------
-- 11. Sesiones de Consejo de Escuela
-- ---------------------------------------------------------------------------
INSERT INTO sesion_consejo (id_escuela, numero_sesion, tipo, fecha_sesion)
SELECT e.id_escuela, v.numero, v.tipo, v.fecha::date
FROM (VALUES
  ('EEM', 'SES-EEM-2024-11', 'ordinaria',      '2024-05-14'),
  ('EIF', 'SES-EIF-2024-07', 'ordinaria',      '2024-05-21'),
  ('EAG', 'SES-EAG-2024-09', 'extraordinaria', '2024-06-04'),
  ('ECO', 'SES-ECO-2024-12', 'ordinaria',      '2024-06-11'),
  ('EIA', 'SES-EIA-2025-14', 'ordinaria',      '2025-08-05'),
  ('ECO', 'SES-ECO-2025-03', 'ordinaria',      '2025-08-12'),
  ('EEM', 'SES-EEM-2025-08', 'ordinaria',      '2025-08-19'),
  ('EAG', 'SES-EAG-2025-11', 'ordinaria',      '2025-08-26')
) AS v(escuela, numero, tipo, fecha)
JOIN escuela e ON e.codigo = v.escuela;

-- ---------------------------------------------------------------------------
-- 12. Dictámenes de Propiedad Intelectual
-- ---------------------------------------------------------------------------
INSERT INTO dictamen_pi (
  id_propuesta, id_emisor, potencial_proteccion, es_innovador,
  activo_identificable, mecanismo_pi, numero_oficio, fecha_dictamen, estado
)
SELECT
  p.id_propuesta,
  (SELECT u.id_usuario FROM usuario u WHERE u.correo_institucional = 'vinculacion@tec.ac.cr'),
  v.potencial::boolean,
  v.innovador::boolean,
  v.activo,
  v.mecanismo,
  v.numero,
  v.fecha::date,
  v.estado
FROM (VALUES
  ('PROP-2024-011', true,  true,  'Algoritmo de despacho distribuido y esquema de predicción de demanda',
   'Software — secreto industrial', 'CV-023-2024', '2024-02-05', 'emitido'),
  ('PROP-2024-026', false, false, 'Aplicación móvil de diagnóstico por imagen',
   'Software — derecho de autor',    'CV-034-2024', '2024-03-12', 'emitido'),
  ('PROP-2025-014', true,  true,  'Modelo de detección de fisuras en concreto',
   'Software — secreto industrial',  'CV-041-2025', '2025-03-04', 'emitido'),
  ('PROP-2025-042', true,  true,  'Celda electroquímica de recuperación de metales',
   'Know-how industrial',            'CV-058-2025', '2025-06-17', 'emitido'),
  ('PROP-2026-004', true,  true,  'Pipeline de recuperación semántica con citas trazables',
   'Software — secreto industrial',  'CV-007-2026', '2026-02-16', 'emitido')
) AS v(codigo, potencial, innovador, activo, mecanismo, numero, fecha, estado)
JOIN propuesta p ON p.codigo = v.codigo;

-- ---------------------------------------------------------------------------
-- 13. Dictámenes del Comité Técnico
--     Umbral de recomendación: calificación >= 70.
-- ---------------------------------------------------------------------------
INSERT INTO resultado_comite (
  id_propuesta, recomendacion, calificacion_promedio, numero_oficio,
  fundamento, fecha_dictamen, id_coordinador_comite
)
SELECT
  p.id_propuesta,
  v.recomendacion,
  v.calificacion::numeric(6,2),
  v.numero,
  v.fundamento,
  v.fecha::date,
  (SELECT u.id_usuario FROM usuario u WHERE u.correo_institucional = 'comite_evaluador@tec.ac.cr')
FROM (VALUES
  ('PROP-2024-011', 'recomienda',    87.5, 'CT-041-2024',
   'Equipo con experiencia en optimización y validación en dos campus piloto.', '2024-04-30'),
  ('PROP-2024-018', 'recomienda',    82.0, 'CT-052-2024',
   'Metodología sólida y validación con parcelas experimentales en el Caribe.', '2024-05-21'),
  ('PROP-2024-026', 'no_recomienda', 54.0, 'CT-066-2024',
   'No se acredita cobertura disciplinar completa ni validación en campo suficiente.', '2024-06-25'),
  ('PROP-2024-033', 'recomienda',    90.0, 'CT-071-2024',
   'Aporte a la construcción de bajo impacto con caracterización completa de materiales.', '2024-07-09'),
  ('PROP-2025-007', 'no_recomienda', 61.5, 'CT-018-2025',
   'El alcance declarado excede el periodo de la convocatoria y la disponibilidad de fuentes.', '2025-05-13'),
  ('PROP-2025-014', 'recomienda',    88.0, 'CT-026-2025',
   'Precisión reportada superior al objetivo y validación en estructuras reales.', '2025-06-10'),
  ('PROP-2025-042', 'no_recomienda', 58.0, 'CT-039-2025',
   'No se acredita aporte institucional ni viabilidad económica del proceso.', '2025-07-22'),
  ('PROP-2026-031', 'recomienda',    84.0, 'CT-004-2026',
   'Reproducibilidad y validación con casos de uso institucionales planteados.', '2026-04-06')
) AS v(codigo, recomendacion, calificacion, numero, fundamento, fecha)
JOIN propuesta p ON p.codigo = v.codigo;

-- ---------------------------------------------------------------------------
-- 14. Avales del Consejo de Escuela
-- ---------------------------------------------------------------------------
INSERT INTO aval_consejo (
  id_propuesta, id_sesion, id_aprobador, resultado, articulo,
  numero_oficio, observaciones, fecha_aval
)
SELECT
  p.id_propuesta,
  (SELECT s.id_sesion FROM sesion_consejo s WHERE s.numero_sesion = v.sesion),
  (SELECT u.id_usuario FROM usuario u WHERE u.correo_institucional = 'direccion_escuela@tec.ac.cr'),
  v.resultado,
  v.articulo,
  v.numero,
  v.observaciones,
  v.fecha::date
FROM (VALUES
  ('PROP-2024-011', 'SES-EEM-2024-11', 'aprueba', 'Art. 12 del Reglamento', 'ESC-EEM-2024-088',
   'Aval unánime con 30 horas semanales distribuir.', '2024-05-14'),
  ('PROP-2024-018', 'SES-EIF-2024-07', 'aprueba', 'Art. 12 del Reglamento', 'ESC-EIF-2024-061',
   'Aval unánime con 20 horas semanales distribuir.', '2024-05-21'),
  ('PROP-2024-026', 'SES-EAG-2024-09', 'rechaza', 'Art. 14 del Reglamento', 'ESC-EAG-2024-043',
   'No se alcanza el mínimo de participación estudiantil en la modalidad propuesta.', '2024-06-04'),
  ('PROP-2024-033', 'SES-ECO-2024-12', 'aprueba', 'Art. 12 del Reglamento', 'ESC-ECO-2024-102',
   'Aval unánime con 25 horas semanales distribuir.', '2024-06-11'),
  ('PROP-2025-007', 'SES-EIA-2025-14', 'rechaza', 'Art. 15 del Reglamento', 'ESC-EIA-2025-019',
   'El alcance no se ajusta al periodo de ejecución de la convocatoria.', '2025-08-05'),
  ('PROP-2025-014', 'SES-ECO-2025-03', 'aprueba', 'Art. 12 del Reglamento', 'ESC-ECO-2025-117',
   'Aval unánime con 35 horas semanales distribuir.', '2025-08-12'),
  ('PROP-2025-028', 'SES-EAG-2025-11', 'aprueba', 'Art. 12 del Reglamento', 'ESC-EAG-2025-052',
   'Aval unánime con 18 horas semanales distribuir.', '2025-08-26'),
  ('PROP-2025-042', 'SES-EEM-2025-08', 'rechaza', 'Art. 15 del Reglamento', 'ESC-EEM-2025-028',
   'No se acredita contrapartida ni aporte institucional.', '2025-08-19')
) AS v(codigo, sesion, resultado, articulo, numero, observaciones, fecha)
JOIN propuesta p ON p.codigo = v.codigo;

-- ---------------------------------------------------------------------------
-- 15. Resoluciones del CIE (estado final)
-- ---------------------------------------------------------------------------
INSERT INTO resolucion_cie (
  id_propuesta, id_responsable, resultado, numero_resolucion, fundamento, fecha_resolucion
)
SELECT
  p.id_propuesta,
  (SELECT u.id_usuario FROM usuario u WHERE u.correo_institucional = 'cie@tec.ac.cr'),
  v.resultado,
  v.numero,
  v.fundamento,
  v.fecha::date
FROM (VALUES
  ('PROP-2024-011', 'aprobada',  'CIE-RES-084-2024',
   'Cumplimiento de requisitos mínimos y calificación superior al umbral de recomendación.', '2024-09-18'),
  ('PROP-2024-018', 'aprobada',  'CIE-RES-091-2024',
   'Dictamen favorable del Comité Técnico y aval del Consejo de Escuela.', '2024-09-30'),
  ('PROP-2024-026', 'rechazada', 'CIE-RES-103-2024',
   'Incumplimiento de requisitos mínimos obligatorios en participación estudiantil.', '2024-10-08'),
  ('PROP-2024-033', 'aprobada',  'CIE-RES-097-2024',
   'Dictamen favorable y aporte verificable a la sostenibilidad de la construcción.', '2024-10-22'),
  ('PROP-2025-007', 'rechazada', 'CIE-RES-012-2025',
   'El alcance propuesto no se ajusta al periodo de la convocatoria 2025.', '2025-11-04'),
  ('PROP-2025-014', 'aprobada',  'CIE-RES-021-2025',
   'Cumplimiento de requisitos mínimos y validación en infraestructura real.', '2025-11-18'),
  ('PROP-2025-042', 'rechazada', 'CIE-RES-028-2025',
   'No se acredita aporte institucional ni contrapartida declarada.', '2025-12-01')
) AS v(codigo, resultado, numero, fundamento, fecha)
JOIN propuesta p ON p.codigo = v.codigo;

COMMIT;
