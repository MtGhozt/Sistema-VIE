# 4. Análisis de Personas — Prototipo Fondos VIE (TEC)

## 4.1 Objetivo

- Identificar usuarios prototípicos del proceso Fondos VIE.
- Identificar necesidades por usuario.
- Clasificar usuarios internos / externos.
- Identificar roles para derivar permisos y contenidos del prototipo.

El AP responde a: quién usa el sistema en cada etapa (publicar, proponer, dictaminar PI, evaluar, avalar, resolver) y qué necesita en los tres módulos (redacción, evaluación, consulta histórica).

## 4.2 Metodología empleada

Se combinó revisión documental con entrevistas no formales realizadas en clase y la corrección del profesor sobre el desglose de actores:

| Fuente | Qué se extrajo |
|--------|----------------|
| Entrevistas no formales en clase con el profesor | Explicación de los procesos institucionales, el funcionamiento del flujo Fondos VIE, qué se espera que tenga la aplicación web y aclaración de dudas (ver Anexos) |
| Corrección del profesor (desglose de actores) | Seis instancias del flujo, con subdivisiones a) b) c) en Comité Técnico, Consejo de Escuela y VIE/CIE |
| Contexto del proyecto (1.1–1.6) | Módulos, actores, alcance, filtros históricos |
| Apuntes de clase | Flujo VIE → investigadores → Vinculación → Comité → Consejo → VIE/CIE, documentos (formulario, plan, presupuesto), IA con rúbrica + revisión humana |
| Diagrama de contexto actual | Qué envía / recibe cada actor, base para roles y contenidos |

> Las entrevistas corresponden a las sesiones de clase con el profesor. No se aplicaron cuestionarios ni grupos focales en esta etapa; estos se citan solo como referencia teórica del curso.

## 4.3 Flujo de usuarios considerado

1. **VIE** publica convocatoria y cronograma.
2. **Profesores** elaboran propuesta (formulario + plan + presupuesto).
3. **Vinculación** emite dictamen de PI.
4. **Comité Técnico** evalúa con rúbrica CIE y emite oficio.
   - a) Asistente: recibe y revisa completitud del contenido.
   - b) Cuerpo evaluador (Coordinador, Director de Escuela y 3 profesores): evalúan la propuesta con rúbrica y asignan nota independiente.
5. **Consejo de Escuela** otorga aval mediante oficio (recibe la calificación del Comité Técnico por propuesta y genera un aval para la VIE).
   - a) Asistente: recibe la calificación del Comité Técnico y la envía al consejo de profesores.
   - b) Consejo de profesores: aprueba o rechaza y genera el aval.
   - c) Dirección: comunica el aval a la VIE.
6. **VIE** verifica, dictamina y resuelve (CIE).
   - a) Persona gestora: revisa contenidos, completitud y comentarios a las personas investigadoras.
   - b) CIE: recibe propuestas, evalúa con su rúbrica, pone observaciones y determina si se aprueba o rechaza.
   - c) Dirección de Investigación: recibe los dictámenes del CIE y notifica aprobación o rechazo.
7. **Super Administrador** puede ver y editar todo el flujo sin cerrar sesión ni volver a iniciar sesión para cambiar de rol.

## 4.4 Clasificación internos / externos

| Tipo | Usuarios |
|------|----------|
| Internos | VIE (publicación), profesores / equipo investigador, Vinculación, Comité Técnico (asistente y cuerpo evaluador), Consejo de Escuela (asistente, consejo de profesores, dirección), VIE/CIE (gestora, CIE, Dirección de Investigación), Super Administrador |
| Externos / indirectos | Entes financiadores, sistema Orión (referencia, sin integración en esta etapa) |

Todos los roles del prototipo son internos.

## 4.5 Usuarios prototípicos identificados

Se presentan **6 personas** según las instancias del flujo, con subdivisiones a) b) c) donde el profesor las indicó, más el **Super Administrador** transversal.

### P1 — VIE (publicación de convocatoria)

- **Objetivo:** Publicar la convocatoria Fondos VIE y su cronograma para que las escuelas e investigadores puedan presentar propuestas.
- **Tareas:** Crea y publica la convocatoria, define fechas de apertura y cierre, comunica el calendario.
- **Necesita:** Editor de convocatoria y cronograma, visibilidad del estado de publicación, consulta de convocatorias vigentes e históricas.

### P2 — Profesores / Persona investigadora coordinadora

- **Objetivo:** Formular y presentar una propuesta completa (formulario + plan + presupuesto) y dar seguimiento a su estado.
- **Tareas:** Crea y completa la propuesta, sube plan y presupuesto, envía a revisión, atiende observaciones.
- **Necesita:** Formulario por secciones con guardado parcial, checklist de documentos, estado y observaciones visibles, consulta histórica.

### P3 — Vinculación

- **Objetivo:** Emitir el dictamen de propiedad intelectual de la propuesta.
- **Tareas:** Revisa aspectos de PI, emite dictamen y lo devuelve al flujo para que la propuesta continúe.
- **Necesita:** Bandeja de propuestas pendientes de PI, vista de la propuesta + plantilla de dictamen, registro del oficio de PI.

### P4 — Comité Técnico

Evalúa con rúbrica CIE y emite oficio. Se divide en dos perfiles (a por aparte; b, c y d unidos):

**a) Asistente**

- **Objetivo:** Recibir la propuesta y verificar que el contenido esté completo antes de evaluarla.
- **Tareas:** Recibe la propuesta, revisa completitud del contenido (formulario, plan, presupuesto y adjuntos) y la pasa al cuerpo evaluador o la devuelve con observaciones de forma.
- **Necesita:** Checklist de completitud, bandeja de entrada, opción de devolver por documentos faltantes.

**b) Cuerpo evaluador** — Coordinador, Director de Escuela y 3 profesores (unidos)

- **Objetivo:** Evaluar la propuesta con la rúbrica CIE y asignar una nota independiente.
- **Tareas:** Cada integrante evalúa con rúbrica, registra nota independiente; se consolida el oficio del Comité Técnico.
- **Necesita:** Rúbrica digital CIE, pre-calificación IA editable con justificación, notas independientes por evaluador, generación de oficio.

### P5 — Consejo de Escuela

Otorga aval mediante oficio. Recibe la calificación del Comité Técnico por cada propuesta y genera un aval para la VIE.

**a) Asistente**

- **Objetivo:** Recibir la calificación del Comité Técnico y hacerla llegar al consejo de profesores.
- **Tareas:** Recibe la nota/oficio del Comité, arma el expediente para sesión y lo envía al consejo de profesores.
- **Necesita:** Bandeja de calificaciones recibidas, expediente listo para sesión, envío al consejo.

**b) Consejo de profesores**

- **Objetivo:** Aprobar o rechazar el aval de la propuesta.
- **Tareas:** Revisa expediente y calificación del Comité, aprueba o rechaza, genera el aval.
- **Necesita:** Expediente consolidado, calificación del Comité visible, acciones aprobar / rechazar con oficio de aval.

**c) Dirección**

- **Objetivo:** Comunicar el aval a la VIE.
- **Tareas:** Toma el aval generado por el consejo y lo notifica / envía a la VIE.
- **Necesita:** Oficio de aval listo para envío, confirmación de comunicación a la VIE.

### P6 — VIE / CIE (verificación, dictamen y resolución)

Verifica, dictamina y resuelve.

**a) Persona gestora**

- **Objetivo:** Revisar contenidos, completitud y comentarios hacia las personas investigadoras.
- **Tareas:** Verifica que el expediente llegue completo (incluida la ruta previa), registra comentarios y los comunica a investigadoras.
- **Necesita:** Checklist de completitud del expediente, bandeja de observaciones, canal de comentarios al equipo investigador.

**b) CIE**

- **Objetivo:** Evaluar la propuesta respecto a su rúbrica, observar y determinar aprobación o rechazo.
- **Tareas:** Recibe propuestas, evalúa con rúbrica CIE, pone observaciones, aprueba o rechaza.
- **Necesita:** Rúbrica CIE, expediente completo (Comité + avales + PI), registro de observaciones, resolución aprueba / rechaza.

**c) Dirección de Investigación**

- **Objetivo:** Recibir los dictámenes del CIE y notificar la aprobación o el rechazo.
- **Tareas:** Recibe el dictamen del CIE y notifica el resultado a las instancias e investigadoras.
- **Necesita:** Bandeja de dictámenes CIE, notificación formal de resolución, consulta histórica del resultado.

### Super Administrador (transversal)

- **Objetivo:** Operar todo el sistema sin cerrar sesión ni volver a iniciar sesión para cambiar de rol. Ve todo y edita todo.
- **Tareas:** Puede ejecutar cualquier acción de P1 a P6 (publicar, redactar, dictaminar PI, revisar completitud, evaluar, avalar, resolver, notificar) y además gestionar usuarios, convocatorias, formularios y rúbricas.
- **Necesita:** Acceso total a todos los módulos y bandejas, capacidad de edición en cualquier etapa, vista unificada para demostrar el flujo completo en una sola sesión.

## 4.6 Roles identificados

| Rol | Agrupado en | Responsabilidad general |
|-----|-------------|-------------------------|
| VIE — publicación | P1 | Publicar convocatoria y cronograma |
| Investigador coordinador / equipo | P2 | Crear, enviar y corregir propuesta (formulario + plan + presupuesto) |
| Vinculación | P3 | Dictamen de PI |
| Asistente del Comité Técnico | P4-a | Recibir y revisar completitud del contenido |
| Cuerpo evaluador del Comité (Coordinador, Director de Escuela, 3 profesores) | P4-b | Evaluar con rúbrica CIE, nota independiente y oficio |
| Asistente del Consejo de Escuela | P5-a | Recibir calificación del Comité y enviarla al consejo de profesores |
| Consejo de profesores | P5-b | Aprobar o rechazar y generar el aval |
| Dirección de Escuela | P5-c | Comunicar el aval a la VIE |
| Persona gestora VIE | P6-a | Revisar contenidos, completitud y comentarios a investigadoras |
| CIE | P6-b | Evaluar con rúbrica, observar, aprobar o rechazar |
| Dirección de Investigación | P6-c | Recibir dictámenes del CIE y notificar resolución |
| Super Administrador | — | Ver y editar todo; operar cualquier rol sin cerrar sesión |

## 4.7 Matriz de necesidades

A = alta, M = media. ● = la persona tiene esa necesidad. El Super Administrador tiene **todas** las casillas marcadas porque puede hacerlo todo.

| Necesidad | P1 | P2 | P3 | P4 | P5 | P6 | Super Admin | Prioridad |
|-----------|:--:|:--:|:--:|:--:|:--:|:--:|:-----------:|:---------:|
| Publicar convocatoria y cronograma | ● | | | | | | ● | A |
| Propuesta por secciones + checklist (formulario, plan, presupuesto) | | ● | | ● | | ● | ● | A |
| Dictamen de PI | | | ● | | | | ● | A |
| Completitud de contenido (asistente) | | | | ● | ● | ● | ● | A |
| Rúbrica CIE + IA editable con justificación + nota independiente | | | | ● | | ● | ● | A |
| Expediente consolidado + avalar/observar con oficio | | | | ● | ● | ● | ● | A |
| Comunicar aval / notificar resolución | | | | | ● | ● | ● | A |
| Trazabilidad y bandeja por etapa + notificaciones | ● | ● | ● | ● | ● | ● | ● | A |
| Consulta histórica (escuela, investigador, temática, estado) | ● | ● | ● | ● | ● | ● | ● | A |
| Gestión de formularios, rúbricas, usuarios y catálogos | | | | | | | ● | M |

### Matriz de permisos del prototipo

Todas las casillas del Super Administrador quedan marcadas: puede verlo y editarlo todo, sin logout / login entre roles.

| Acción | P1 | P2 | P3 | P4-a | P4-b | P5-a | P5-b | P5-c | P6-a | P6-b | P6-c | Super Admin |
|--------|:--:|:--:|:--:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:-----------:|
| Ver convocatoria / cronograma | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Publicar / editar convocatoria | ● | | | | | | | | | | | ● |
| Crear / editar / enviar propuesta | | ● | | | | | | | | | | ● |
| Emitir dictamen de PI | | | ● | | | | | | | | | ● |
| Revisar completitud (Comité) | | | | ● | | | | | | | | ● |
| Evaluar con rúbrica y poner nota | | | | | ● | | | | | | | ● |
| Recibir nota del Comité y pasarla al consejo | | | | | | ● | | | | | | ● |
| Aprobar / rechazar y generar aval | | | | | | | ● | | | | | ● |
| Comunicar aval a la VIE | | | | | | | | ● | | | | ● |
| Revisar contenidos y comentar a investigadoras | | | | | | | | | ● | | | ● |
| Evaluar CIE y aprobar / rechazar | | | | | | | | | | ● | | ● |
| Notificar resolución final | | | | | | | | | | | ● | ● |
| Consulta histórica | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Editar cualquier registro / etapa | | | | | | | | | | | | ● |

## 4.8 Contenidos requeridos del portal

**Redacción:** convocatoria y cronogramas, formulario por secciones, carga de plan y presupuesto, estados de la propuesta.

**Evaluación:** bandejas por etapa, checklist de completitud (asistentes), rúbrica CIE con IA editable y notas independientes, plantillas de dictamen PI y oficios, aval del Consejo, dictamen CIE y notificación de resolución.

**Consulta histórica:** buscador con filtros combinados (escuela, investigador, temática, estado) y ficha resumen por propuesta.

**Transversal:** línea de tiempo por propuesta, gestión de roles y sesión de Super Administrador con acceso total. Base solo SQL (Postgres).

## 4.9 Implicaciones de diseño

1. Mostrar en qué etapa está cada propuesta (VIE convocatoria → Profesores → Vinculación → Comité → Consejo → VIE/CIE).
2. Mismo expediente, vista recortada según rol (asistente ve completitud; evaluador ve rúbrica; consejo ve aval; CIE ve resolución).
3. IA y rúbrica siempre juntas y editables, con registro de revisión humana y nota independiente por evaluador del Comité.
4. Cada dictamen / aval genera un oficio visible.
5. El Super Administrador entra una sola vez y puede ejecutar todas las acciones del flujo, para no tener que cerrar e iniciar sesión al cambiar de rol.

---

## Anexos

### Anexo A — Fotografías de clase (entrevistas no formales con el profesor)

[Insertar fotografía 1 — explicación de los procesos institucionales Fondos VIE]

[Insertar fotografía 2 — explicación del funcionamiento del flujo y los roles]

### Anexo B — Fotografías de clase (qué se espera de la aplicación web)

[Insertar fotografía 3 — explicación de módulos, formularios y contenidos esperados de la aplicación web]

[Insertar fotografía 4 — aclaración de dudas y detalles adicionales explicados en clase]
