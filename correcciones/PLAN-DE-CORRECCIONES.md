# Plan de implementación y validación · Sistema VIE

> **Fecha:** 29 de octubre de 2026  
> **Base revisada:** `b526885` (`master` según historial consultado; comprobar la rama al ejecutar).  
> **Alcance:** los 33 identificadores de [correcciones.md](correcciones.md), organizados en **32 commits de implementación y verificación**.  
> **Estado:** plan preparado. Los commits de la tabla son propuestos; no se han ejecutado estas correcciones ni creado esos commits.

## Navegación

- [Revisión del estado actual](#revisión-del-estado-actual)
- [Reglas de ejecución](#reglas-de-ejecución)
- [Decisiones para validar con el usuario](#decisiones-para-validar-con-el-usuario)
- [Secuencia de 32 commits](#secuencia-de-32-commits)
- [Flujo institucional que debe demostrarse](#flujo-institucional-que-debe-demostrarse)
- [Pausas de validación del usuario](#pausas-de-validación-del-usuario)
- [Verificación técnica y cierre](#verificación-técnica-y-cierre)

## Revisión del estado actual

Se releyeron los puntos concretos de frontend, backend, SQL y scripts que sustentan los hallazgos. **No se encontró una corrección integral de los defectos principales.** Hay piezas funcionales que se deben ampliar, no rehacer. Una ruta o tabla existente no prueba que el flujo completo esté resuelto.

### Comprobaciones ejecutadas en esta revisión

| Comprobación | Resultado observado | Consecuencia |
| --- | --- | --- |
| `git status --short`, antes de escribir este plan | Sin cambios locales. | La revisión parte de una base limpia. |
| `pnpm build` | Backend compila; frontend falla con **TS2741** en `frontend/src/data/evalProposal.ts:11`: falta `teamTec`, obligatorio en `DemoProposal`. | Resolver primero y volver a compilar; no atribuir un problema de compilación a un fallo visual. |
| `pnpm --filter sistema-vie-frontend lint` | Salida 0, con **12 advertencias**: exportaciones/Fast Refresh y actualizaciones de estado desde efectos. | Registrar la deuda; no declarar lint sin advertencias ni mezclar una refactorización general en estas correcciones. |
| Consulta de `http://localhost:3000/api/health` | Sin conexión a la API local. | No se ejecutaron pruebas funcionales contra BD. No es evidencia de un defecto del endpoint. |
| Revisión de `scripts/smoke-e2e.mjs` | Existe `pnpm smoke`; crea convocatoria/borrador, consulta histórico y bandeja, prueba algunos logins. | Reutilizarlo, pero **no cubre envío, decisiones, devoluciones, rúbricas, notificación ni navegador**. |
| Herramienta de navegador | No se encontró navegador ejecutable en las rutas comprobadas ni herramienta de navegador conectada. | Las superposiciones y el recorrido visual permanecen pendientes de reproducción. |

La compilación y el lint necesitaron ejecutarse fuera del sandbox por el bloqueo del almacén de pnpm; sus resultados anteriores corresponden a esas ejecuciones. No se modificó código de aplicación para preparar este plan.

### Matriz de trazabilidad: ¿ya está hecho?

**Pendiente:** sigue presente el defecto en código. **Parcial:** existe parte de la solución. **Por reproducir:** el síntoma visual o intermitente aún no está demostrado. **Decisión:** necesita acordar alcance o política; no se debe implementar una regla inventada.

| ID del informe | Estado actual y evidencia concreta | Commits previstos |
| --- | --- | --- |
| GEN-01 | **Decisión + pendiente.** `historico.ts` no limita por rol/persona/dependencia; el acceso universal a consulta sí está documentado. | C03, C07, C30 |
| GEN-02 | **Parcial / por reproducir.** Hay capa a11y, pero subsisten textos de 9–12 px y estados sin traducir. | C28, C29, C32 |
| GEN-03 | **Pendiente.** `NotificationsContext` sigue consumiendo `NOTIFICACIONES`; las lecturas solo se conservan en `localStorage`. | C24, C25 |
| GEN-04 | **Pendiente.** Se conserva nombre/alt text; no hay carga de binarios ni enlaces de documentos reales. | C18, C19, C26 |
| INV-01 | **Pendiente.** Paso Equipo muestra `rich.teamTec`; no hay CRUD ni editor de externos. | C11, C12 |
| INV-02 | **Parcial.** `onSave()` sí llama a create/patch; `draftPayload()` sigue incompleto y `patch()` anuncia autoguardado sin persistencia. | C08, C09, C10, C13–C17 |
| INV-03 | **Pendiente.** Estado del arte, planes, presupuesto, productos, resguardo, divulgación, ética y hoja de ruta continúan fijos. | C10, C13–C17 |
| INV-04 | **Pendiente.** No hay validación del resumen de 500 palabras ni de 4–6 términos clave. | C10 |
| INV-05 | **Parcial.** Resumen/abstract y keywords ES tienen API; el wizard sigue enviando `keywordsEn: ""`. | C09, C10 |
| INV-06 | **Derivado.** Comparte las carencias GEN-02 y GEN-04. | C18, C19, C28, C29 |
| FLU-01 | **Pendiente.** Las acciones validan rol y no-borrador, pero no toda la transición y sus requisitos. | C03, C05, C06, C20–C27 |
| VIN-01 | **Parcial / por reproducir.** `pi` escribe `dictamen_pi`; falta recuperación completa y confirmar la causa del fallo intermitente. | C02, C20 |
| CTA-01 | **Por reproducir.** `SimpleModal` sigue dentro del panel; no hay evidencia de navegador para declarar corregida la superposición. | C02, C28 |
| CTA-02 | **Pendiente.** La devolución vuelve a `enviada`/etapa 1 y la edición solo admite borradores. | C06, C08, C21 |
| CTE-01 | **Pendiente.** `save-rubric` solo responde con mensaje; el consolidado no conserva los criterios. | C22, C23 |
| CON-01 | **Parcial.** Aprobar/rechazar aval ya persiste; falta proteger la secuencia y ajustar acciones posteriores. | C05, C06, C26 |
| DIR-01 | **Parcial.** Comunicar aval inserta registro; falta exigir aval anterior y la vista previa no tiene manejador. | C05, C26 |
| VIE-01 | **Parcial.** Se inserta `observacion`, pero no se recupera en el detalle ni aparece como aviso real. | C09, C21, C24, C25, C27 |
| VIE-02 | **Pendiente.** El checklist VIE sigue siendo estático, sin revisión persistida. | C27 |
| CIE-01 | **Pendiente.** Rechazo envía `motivo`; el controlador de UI requiere `texto` y el backend `texto` o `fundamento`. | C04, C05 |
| CIE-02 | **Parcial / por reproducir.** Aprobación puede registrar fundamento genérico; guardado no persiste; superposición pendiente. | C04, C22, C23, C28 |
| CIE-03 | **Parcial.** `notify-resolution` inserta comunicación/aviso; la UI no consulta avisos ni recupera `notificada`. | C24, C25, C26 |
| ADM-01 | **Decisión + pendiente.** Administración sigue informativa y con pestañas deshabilitadas. | C03, C31 |
| ADM-02 | **Parcial.** Operación transversal ya existe; el backend aún permite saltar requisitos de propuestas enviadas. | C05, C07 |
| ADI-01 | **Pendiente.** Detalle real sigue usando plantilla `PROP-2027-014`. | C09 |
| ADI-02 | **Pendiente.** `viewRole` cambia la UI; `syncDemoAuth()` conserva `admin` y la bandeja no filtra esa vista. | C07 |
| ADI-03 | **Pendiente.** `App.tsx` protege sesión, sin guardia de autorización por ruta. | C07 |
| ADI-04 | **Pendiente.** `committee-score` escribe siempre `recomienda` y admite promedio por defecto. | C23 |
| ADI-05 | **Pendiente.** `declaracion` inicia en `true`; envío desde detalle no comparte una validación integral del servidor. | C08, C17 |
| ADI-06 | **Pendiente.** Inicio mezcla cifras fijas y API; progreso se calcula con constantes. | C30 |
| ADI-07 | **Parcial.** Convocatorias ya crea/publica/cierra; falta editor completo de datos e hitos. | C30 |
| ADI-08 | **Pendiente.** Paneles siguen con estado inicial derivado de una propuesta, sin reinicio por expediente. | C06, C20, C22 |
| ADI-09 | **Pendiente.** Devolución actualiza ciclo 1 en lugar de conservar nuevos ciclos. | C21 |

**Bloqueo adicional de esta revisión:** `evalProposal.ts` no satisface el contrato `DemoProposal`. Se atiende en C01 sin copiar integrantes de una propuesta demo para silenciar TypeScript.

## Reglas de ejecución

**Regla del usuario (30 de octubre de 2026):** cada cambio funcional debe identificar el hallazgo y la fuente documental o decisión explícita que lo justifica. Si falta sustento, existe ambigüedad o contradice lo establecido, abrir discusión y esperar respuesta antes de implementar esa parte. No modificar campos, límites, permisos ni transiciones basándose solo en una preferencia técnica. Registrar la justificación y su validación en la bitácora de implementación.

1. Ejecutar primero la **validación de línea base** de [VALIDACION-DEL-FLUJO.md](VALIDACION-DEL-FLUJO.md). Intentar todas las ramas; registrar fallos, bloqueos y pantallas no alcanzables. No marcar como aprobada una pantalla que solo se revisó en código.
2. Antes de cada commit, revisar si otra persona ya implementó la corrección: comparar código, ejecutar la prueba de aceptación y registrar el SHA que la resolvió. Una implementación parcial no permite cerrar el hallazgo.
3. Mantener **al menos 20 commits sustantivos**, con objetivo verificable. Este plan propone 32. No crear commits vacíos ni dividir cambios artificialmente; si algo ya está resuelto, reasignar el trabajo pendiente y actualizar el plan sin volver a introducirlo.
4. Cada commit debe compilar y contener la verificación adecuada a su cambio. Las pruebas de integridad y persistencia acompañan al cambio; las mejoras de textos o estilos se validan visualmente, sin pruebas que solo repitan la implementación.
5. Trabajar sobre una rama de correcciones y una **BD de prueba separada**, con datos identificables por ejecución. `pnpm smoke` escribe registros; no ejecutarlo sobre una BD compartida sin preparar el aislamiento.
6. Usar migraciones incrementales para instalaciones existentes. Editar únicamente el SQL de inicialización no actualiza volúmenes ya creados. No usar `docker compose down -v` como mecanismo de migración.
7. Hacer persistencia y cambio de estado en una transacción; comprobar requisitos dentro de ella y controlar decisiones concurrentes. No simular éxito si se revierte la escritura.
8. Separar demostración local y operación API de forma visible. Una bandeja vacía debe poder permanecer vacía; una caída de la API no debe aparentar expedientes de trabajo reales.
9. En cada pausa, entregar SHA/rango, pasos, datos de prueba y evidencia **antes** de pedir validación. Esperar la respuesta explícita del usuario antes de comenzar el bloque siguiente. El silencio no significa aprobación.
10. No cerrar un hallazgo solo porque está escrito el código: requerir resultado técnico y validación del usuario cuando corresponda. No publicar, fusionar ni desplegar como parte implícita de este plan.

## Decisiones para validar con el usuario

Se presentan en V0 junto con alternativas concretas. La recomendación orienta la implementación, pero no se considera aprobada.

| Decisión | Propuesta para revisar | Implicación |
| --- | --- | --- |
| Histórico y permisos | Investigadora: propios; instancias: enviados según dependencia/asignación; admin: transversal; excluir borradores ajenos. | Acordar alcance de consulta y aplicarlo a listado, filtros, detalle y descarga. El análisis de personas permite consulta a todos los roles, no define esta restricción exacta. |
| Devoluciones | Estado explícito de subsanación, edición por responsable y ciclos conservados; suspender avance hasta respuesta y nueva revisión. | Definir qué campos se reabren y a qué instancia regresa cada corrección. |
| PI | Exigir dictamen si corresponde; permitir «no requerido» con fundamento verificable. | No pedir un dictamen a todas las modalidades de forma indiscriminada. |
| Comité | Mantener notas individuales de cinco integrantes y consolidar cuando estén completas según composición documentada. | Acordar identidades demo, reemplazos y política de consolidación; no fijar reglas de unanimidad inventadas. |
| Rúbrica y decisión | Utilizar pesos y requisitos oficiales; el servidor calcula la nota. Mantener sugerencia IA editable y claramente simulada. | Acordar si una recomendación negativa permite remisión para conocimiento o bloquea un paso concreto; no confundir recomendación con resolución. |
| Documentos | Carga y consulta real local en el prototipo; validar formato/tamaño y conservar versiones. | Definir tipos y límites concretos antes de C18; no incorporar un servicio externo de almacenamiento sin necesidad. |
| Administración | Catálogos y usuarios con operaciones acotadas; formularios/rúbricas versionados, sin motor genérico de formularios. | Confirmar si se implementan estas operaciones o si se documenta su exclusión de esta entrega. C31 no cuenta como corrección de un CRUD si solo documenta exclusiones. |
| Super Administrador | Acceso transversal con las mismas precondiciones de negocio. | Cualquier excepción futura necesita motivo y auditoría; no se asume una excepción automática. |

## Secuencia de 32 commits

Los mensajes son sugeridos. La numeración representa orden de ejecución; las dependencias indican requisitos técnicos adicionales. **Todos están pendientes.** Los commits de preparación se distinguen de la línea base que se debe intentar y registrar antes de modificar el producto.

### Bloque A · Base reproducible y decisiones · C01–C03

| Commit propuesto | Cambio concreto y archivos principales | Dependencia | Validación exigida |
| --- | --- | --- | --- |
| **C01** `fix(frontend): completar contrato del expediente de evaluacion` | Corregir `frontend/src/data/evalProposal.ts` con datos reales o lista vacía explícita; no insertar equipo demo. | Registrar primero el fallo de compilación actual. | `pnpm build`; detalle sin equipo no rompe y no muestra personas ajenas. |
| **C02** `test(flujo): preparar escenarios y registro reproducible` | Ampliar infraestructura de `scripts/smoke-e2e.mjs` o scripts auxiliares: BD aislada, fixtures por rol, resultados por caso, fallos sin abortar todo el reporte. Preparar herramienta de navegador y ubicación de capturas. | C01. | Ejecutar línea base completa; conservar fallos conocidos, IDs y salidas. El smoke actual no basta como certificación. |
| **C03** `docs(flujo): fijar permisos transiciones y alcance acordados` | Documentar decisiones de V0 en `correcciones/`, con estado anterior/siguiente, responsable, evidencia y política de cierre. | C02 y respuestas de V0. | Tabla revisada contra fuentes oficiales y contra cada acción de API; sin reglas abiertas que condicionen el bloque B. |

**Pausa V0:** presentar línea base, errores actuales y propuestas de política; esperar validación antes de C03 si depende de decisiones y antes de cualquier implementación del bloque B.

### Bloque B · Decisiones, permisos y aislamiento · C04–C07

| Commit propuesto | Cambio concreto y archivos principales | Dependencia | Validación exigida |
| --- | --- | --- | --- |
| **C04** `fix(cie): conservar fundamento y confirmar tras persistencia` | Unificar contrato tipado de aprobar/rechazar entre API, `EvaluacionesPage` y `EvaluationRolePanels`; esperar resultado, conservar texto ante error y bloquear doble envío. | C03. | Rechazo y aprobación conservan fundamento; vacío se rechaza; un error mantiene modal y texto. |
| **C05** `fix(flujo): validar transiciones y requisitos en transaccion` | Extraer reglas de `backend/src/routes/evaluaciones.ts` a servicio de dominio; validar rol, ámbito, estado, etapa y evidencias. Controlar cierre, concurrencia y operaciones repetidas sin reescribir resoluciones. | C03, C04. | Pruebas API positivas y negativas por acción; saltos, expediente cerrado y solicitudes simultáneas no alteran datos indebidamente. |
| **C06** `fix(evaluaciones): sincronizar bandejas y acciones por etapa` | Ajustar filtros y refresco; separar demo explícita de bandeja vacía/error; reiniciar estado de panel al cambiar expediente y deshabilitar acciones no válidas. | C05. | Completar tarea retira el pendiente o lo deja solo lectura; A→B no arrastra texto/checks; API vacía no inventa trabajo. |
| **C07** `fix(permisos): aplicar ambito y filtrar vista administrativa` | Guardias de ruta en `App.tsx`, ámbito de histórico/detalle/evaluaciones y filtro de vista admin. Conservar `admin` como identidad autorizada; validar en servidor cualquier filtro solicitado. | C03, C05, C06. | URL directa y peticiones manuales no eluden permisos; admin cambia vista sin perder identidad; histórico y descarga no amplían acceso. |

**Pausa V1:** revisar rechazo CIE, rutas, bandejas y pruebas de saltos. Las pruebas con expedientes precondicionados no sustituyen el recorrido completo final.

### Bloque C · Formulación completa y guardado · C08–C17

| Commit propuesto | Cambio concreto y archivos principales | Dependencia | Validación exigida |
| --- | --- | --- | --- |
| **C08** `feat(propuestas): persistir campos generales y aceptar declaracion` | Migración incremental si falta soporte para declaración/versionado; ampliar DTO y create/patch/read en `propuestas.ts`; persistir fechas, preguntas y PI/TRL. Centralizar permisos de edición y validación de envío. | C03, C05, C07. | Guardado parcial permitido; envío incompleto rechazado tanto desde wizard como detalle; declaración no aceptada por defecto; rollback integral. |
| **C09** `fix(propuestas): recuperar expediente sin plantilla demo` | Completar consulta y adaptadores de detalle, objetivos, observaciones e historial; retirar plantilla `PROP-2027-014` y mensajes ficticios de autoguardado. Mantener un único ID tras guardar. | C08. | Guardar/reabrir compara campos; valores vacíos no se reemplazan; no se duplican propuestas; error deja cambios identificados como pendientes. |
| **C10** `feat(formulario): editar textos y validar resumen y keywords` | Editores para estado del arte, referencias y objetivo general/específicos; captura ES/EN y persistencia; resumen máximo 500 palabras y 4–6 términos según regla acordada. | C08, C09. | 500/501 palabras y 3/4/6/7 términos; Unicode, espacios y separadores; inglés se conserva; borrador incompleto no se confunde con envío válido. |
| **C11** `feat(equipo): gestionar participantes internos y horas` | CRUD de `propuesta_participante` y horas, selector de personas TEC, rol, ORCID y periodo; edición del paso Equipo. | C08–C10. | Alta/edición/baja persiste; validar horas y tipos según reglas oficiales; impedir duplicados y cambios ajenos. |
| **C12** `feat(equipo): gestionar colaboradores externos y respaldos` | Captura externa y entidad, vínculo con documentos de compromiso; contratos listos para adjuntos de C18. | C11. | Externos no aparecen si no se ingresaron; conservar cambios tras recarga; validación de respaldo al envío una vez conectado C18. |
| **C13** `feat(plan): editar objetivos actividades y cronograma` | CRUD de objetivos/actividades/participantes responsables; sustituir tabla fija en wizard. | C10–C12. | Persistir y reordenar objetivos/actividades; referencias válidas al equipo; fechas y duración coherentes. |
| **C14** `feat(riesgos): registrar mitigaciones por actividad` | CRUD de riesgos, medidas y responsables en tablas existentes; enlazar a actividades. | C13. | Al menos un riesgo por actividad al enviar; edición y borrado sin referencias huérfanas; relectura exacta. |
| **C15** `feat(presupuesto): editar montos y fuentes por anio` | Presupuesto anual, duraderos, contrapartidas, cofinanciamiento y oficios; validar y calcular totales en servidor. | C08, C11. | Montos no negativos y suma exacta; bienes duraderos en primer año; F5 conserva desglose; límites oficiales aplicables. |
| **C16** `feat(productos): registrar compromisos y resguardo` | Captura de productos por modalidad/carga y activos PI; persistir estrategia de resguardo con migración si falta entidad/campo. | C11, C12, C15. | Productos y horas coherentes con la fuente oficial; faltantes bloquean envío cuando corresponda; resguardo permanece tras recarga. |
| **C17** `feat(formulario): completar etica divulgacion y revision final` | Ética, permisos/exenciones, divulgación y hoja de ruta; revisar los 17 pasos, su completitud real y ambas acciones Guardar. Integrar validación definitiva de envío con los bloques anteriores. | C10–C16. | Matriz de los 17 pasos con guardar/F5/reabrir; ética condicional; guardar sin salir conserva ID; «Guardar y salir» y enviar funcionan sin pérdidas. |

**Pausa V2:** el usuario completa y vuelve a abrir un expediente propio; revisar equipo, presupuesto, riesgos, límites y secciones antes de integrar la revisión institucional.

### Bloque D · Documentación y revisión previa · C18–C21

| Commit propuesto | Cambio concreto y archivos principales | Dependencia | Validación exigida |
| --- | --- | --- | --- |
| **C18** `feat(documentos): almacenar adjuntos y metadatos versionados` | Rutas de carga/consulta, almacenamiento local configurable y persistente, metadatos, tipo/tamaño permitidos y alt text. Usar `propuesta_documento`; migrar campos faltantes. | C07, C08, C12 y decisión documental V0. | Carga real, reinicio y recuperación; rechazo de formato/tamaño inválido; nombre seguro; rollback sin archivos huérfanos; permisos por expediente. |
| **C19** `feat(expediente): abrir descargar y sustituir documentos` | Integrar wizard, detalle y `CaseFile`; consulta autenticada, versiones, estados reales de documentos y recursos con descripciones. | C18. | Abrir y descargar archivo correcto desde investigador/evaluador autorizado; otro usuario no accede; reemplazo conserva versión y alt text. |
| **C20** `feat(vinculacion): recuperar y emitir dictamen de PI` | Cargar todos los campos persistidos, separar edición/emisión según política, resolver «no requerido» y reinicio del panel. | C05, C06, C17, C19. | PI requerida/no requerida; emitir y reabrir; error no pierde datos; no omitir oficio obligatorio ni reemitir un expediente cerrado. |
| **C21** `feat(revision): completar devoluciones respuestas y ciclos` | Checklist de asistente, observaciones/respuestas, ciclos consecutivos, edición en subsanación, reenvío a instancia correcta y detalle actualizado. | C05, C08, C19, C20. | Dos devoluciones y dos respuestas conservan historia; no evaluar mientras haya bloqueo; el investigador corrige y el asistente vuelve a revisar. |

**Pausa V3:** validar documentos reales, dictamen y devolución/subsanación antes de avanzar a evaluación formal.

### Bloque E · Rúbricas, avisos y cierre institucional · C22–C27

| Commit propuesto | Cambio concreto y archivos principales | Dependencia | Validación exigida |
| --- | --- | --- | --- |
| **C22** `feat(rubricas): persistir valoraciones individuales por criterio` | Mapear rúbrica/criterios/niveles oficiales a BD; guardar y recuperar `evaluacion`/`evaluacion_puntaje` por propuesta, instancia y evaluador. Evitar puntajes compartidos entre expedientes. | C05, C20, C21. | Guardar/F5/otra sesión recupera notas y motivos; dos evaluadores no se pisan; conservar borrador de evaluación sin consolidar. |
| **C23** `fix(comite): consolidar notas y recomendacion reales` | Calcular ponderación en servidor y consolidar según composición acordada; quitar promedio 80 por defecto y `recomienda` fijo; validar cierre de evaluaciones. | C22. | Notas límite, pesos, obligatorio deficiente y recomendación negativa; no consolidar sin integrantes requeridos; IA no confirma decisiones humanas. |
| **C24** `feat(notificaciones): consultar y marcar avisos por destinatario` | Router y cliente de notificaciones, lectura paginada si procede y marcas en BD; registrar en `backend/src/app.ts`; evitar leer/escribir avisos ajenos. | C07. | Solo destinatario ve y marca sus avisos; F5 conserva leído; identidad distinta no accede por ID. |
| **C25** `feat(avisos): conectar eventos y bandeja con datos reales` | Sustituir `NOTIFICACIONES` en contexto/campana/página; generar avisos de envío, devolución, respuesta, PI, evaluación, aval, remisión y resolución conforme a matriz. | C21, C23, C24. | Un evento crea destinatarios correctos; reintento no duplica; otra sesión recibe el aviso; API caída se muestra como error. |
| **C26** `feat(avales): completar consejo comunicacion y resolucion` | Recuperar justificación del aval, sesión y oficios; proteger remisión del asistente de Consejo y comunicación de Dirección; vista previa verificable de memorando/resolución sin prometer PDF inexistente; recuperar `notificada`. | C04, C05, C19, C23–C25. | Consejo aprueba/rechaza; Dirección comunica solo con aval; CIE resuelve con fundamento; Dirección de Investigación notifica una vez y el estado persiste. |
| **C27** `feat(vie): persistir verificacion y resolver observaciones` | Checklist VIE basado en evidencias y confirmaciones persistidas; comentarios, respuesta/subsanación y bloqueo de remisión si faltan requisitos. | C21, C25, C26. | Guardar revisión y F5; observación llega y se muestra; respuesta no borra historial; no enviar al CIE sin completar revisión. |

**Pausa V4:** ejecutar aprobación completa, rechazo de Consejo y rechazo CIE; comprobar avisos desde la cuenta destinataria y recuperar registros en BD.

### Bloque F · Presentación, soporte y aceptación integral · C28–C32

| Commit propuesto | Cambio concreto y archivos principales | Dependencia | Validación exigida |
| --- | --- | --- | --- |
| **C28** `fix(modales): resolver superposiciones reproducidas y foco` | Reproducir en navegador devolución, aval y CIE; corregir contexto de apilamiento, portal o scroll solo según evidencia; conservar foco/Escape y error. | C04, C21, C26, C27. | Capturas antes/después con viewport/zoom; todos los controles visibles, foco contenido y restaurado; diálogo largo y petición fallida. |
| **C29** `style(interfaz): mejorar lectura textos y adaptacion` | Escala tipográfica y etiquetas en capa de overrides; revisar todas las rutas, los 17 pasos, estados traducidos y consistencia institucional. | C17, C19, C27, C28. | 100/200 % de zoom; escritorio, tableta y móvil; alto contraste, teclado, lector de pantalla según checklist. |
| **C30** `feat(consulta): completar convocatorias historico e indicadores` | Editor de datos/hitos de CU1; filtros históricos dentro del ámbito acordado; indicadores y progreso reales o marcados como simulados. | C07, C17, C25, C26. | CRUD de hitos, publicar/cerrar; todos los filtros combinados sobre fixtures conocidos; conteos coinciden con API; ficha histórica correcta. |
| **C31** `feat(administracion): completar operaciones del alcance acordado` | Operaciones de usuarios/catálogos/roles y versionado de formularios/rúbricas si V0 lo aprueba; proteger referencias en uso. Si se excluyen, registrar decisión y reasignar este commit a trabajo funcional pendiente. | C03, C07, C22, C30. | Admin autorizado conserva cambios tras F5; no-admin recibe rechazo; no borrar relaciones en uso; no prometer motor genérico de formularios. |
| **C32** `test(aceptacion): cubrir flujo integral y registrar validacion` | Consolidar pruebas API/navegador, resultados, capturas, trazabilidad y actualización de continuidad/README/informe. Completar [VALIDACION-DEL-FLUJO.md](VALIDACION-DEL-FLUJO.md). | C01–C31 y V0–V5 aprobados. | Todos los escenarios, ambas resoluciones, rechazo de aval, subsanación, persistencia y revisión visual; salida sin fallos bloqueantes y V6 explícita. |

**Pausa V5:** revisar presentación y alcance administrativo antes de congelar candidato. **Pausa V6:** aceptación final del flujo completo; cualquier rechazo reabre el hallazgo y exige nueva evidencia antes de cerrar.

## Flujo institucional que debe demostrarse

La matriz acordada en V0/C03 manda sobre la numeración de etapas heredada. Los enteros actuales agrupan tareas diferentes; no basta con incrementar `etapa_flujo` para probarlas.

| Orden | Responsable y tarea | Evidencia de salida | Alternativa obligatoria |
| --- | --- | --- | --- |
| 1 | VIE Publicación crea/edita hitos y publica convocatoria. | Convocatoria activa y cronograma recuperables. | Sin permiso o convocatoria cerrada. |
| 2 | Investigadora crea, completa y guarda propuesta. | Mismo ID; campos, equipo, riesgos, presupuesto y archivos propios. | Borrador parcial; límites inválidos. |
| 3 | Investigadora declara y envía. | Fecha, estado, evento de historial y destinatarios correctos. | Enviar incompleta desde wizard y desde detalle. |
| 4 | Vinculación evalúa PI cuando aplica. | Dictamen y oficio recuperables, o no requerido justificado. | No continuar sin dictamen obligatorio. |
| 5 | Asistente Comité revisa completitud. | Checklist y envío al cuerpo evaluador. | Devolución → corrección → respuesta → nueva revisión; dos ciclos. |
| 6 | Integrantes del Comité evalúan y consolidan. | Notas independientes, justificaciones y consolidado real. | Nota insuficiente, requisito obligatorio deficiente y evaluación incompleta. |
| 7 | Asistente Consejo prepara sesión y remite. | Sesión y expediente con nota/oficio reales. | No remitir sin consolidado. |
| 8 | Consejo emite aval o rechazo. | Justificación y oficio; resultado no sobrescribible indebidamente. | Rechazo de aval, sin continuar por la rama aprobatoria. |
| 9 | Dirección de Escuela comunica aval. | Comunicación registrada y visible. | Intento sin aval. |
| 10 | Gestora VIE verifica y observa o remite. | Checklist persistido y observaciones resueltas cuando bloqueen. | Subsanación y reintento; impedir remisión incompleta. |
| 11 | CIE evalúa y emite aprobación o rechazo. | Rúbrica y fundamento originales, número y fecha de resolución. | Ambas decisiones en expedientes distintos; texto vacío y fallo de API. |
| 12 | Dirección de Investigación notifica. | Comunicación, aviso al coordinador y estado notificada. | Doble clic/reintento sin notificación duplicada. |
| 13 | Investigadora y roles autorizados consultan. | Aviso real, expediente e histórico con filtros y documentos correctos. | Otra persona/dependencia sin acceso. |
| Transversal | Super Administrador opera vistas autorizadas. | Identidad admin conservada, filtro de vista correcto y auditoría. | Mismos intentos de saltos, cierre y duplicación rechazados. |

**Antes de corregir:** intentar el recorrido y registrar dónde se corta. **Después de cada bloque:** repetir sus escenarios afectados y el tramo previo necesario. **Antes de cerrar:** ejecutar otra vez todo el recorrido con datos nuevos, sin usar la demostración local como sustituto de PostgreSQL.

## Pausas de validación del usuario

Los formularios editables y los resultados por caso están en [VALIDACION-DEL-FLUJO.md](VALIDACION-DEL-FLUJO.md). Estas pausas forman parte de la ejecución solicitada y deben respetarse.

| Pausa | Momento | Material que debe recibir el usuario | Qué decide |
| --- | --- | --- | --- |
| **V0** | Línea base registrada, antes de fijar políticas e implementar bloque B. | Reporte inicial, build, fallos reproducidos, propuestas de permisos/flujo/alcance. | Reglas institucionales, documentos y administración. |
| **V1** | Tras C07. | Demo de CIE, bandejas, acceso directo y pruebas negativas. | Si las decisiones y permisos permiten continuar. |
| **V2** | Tras C17. | Propuesta editable propia, los 17 pasos y comparación antes/después de F5. | Captura, legibilidad inicial y guardado. |
| **V3** | Tras C21. | Archivos reales, dictamen y dos ciclos de devolución. | Documentación y subsanación. |
| **V4** | Tras C27. | Rúbricas individuales, Consejo, Dirección, VIE, CIE y recepción de avisos. | Influencia real de cada instancia y cierre institucional. |
| **V5** | Tras C31. | Capturas, navegador, teclado/zoom, consultas y administración acordada. | Presentación y alcance final. |
| **V6** | Candidato C32, antes de cerrar. | Reporte completo con SHA, casos, capturas, resultados y pendientes. | Aceptación final o reapertura de correcciones. |

## Verificación técnica y cierre

Comandos existentes que deben ejecutarse en el entorno preparado:

```bash
pnpm build
pnpm --filter sistema-vie-frontend lint
pnpm --filter sistema-vie-backend typecheck
pnpm smoke
```

`pnpm smoke` requiere API/BD y escribe datos. Los comandos nuevos para pruebas de reglas, integración y navegador deben quedar definidos y documentados en C02/C32; **todavía no existen como parte de este plan**. No confundir compilación satisfactoria con flujo validado.

Para cada ejecución registrar SHA, fecha/hora de Costa Rica, entorno y BD de prueba, rol, vista, propuesta, caso, esperado, observado y evidencia. Los errores de preparación se marcan **bloqueados**, no aprobados ni defectos funcionales confirmados.

Criterio de cierre:

- [ ] Al menos 20 commits sustantivos y revisables; plan actualizado con sus SHA reales.
- [ ] Los 33 identificadores tienen resultado: corregido y probado, descartado con evidencia o exclusión explícitamente aceptada. Una exclusión no equivale a corrección.
- [ ] Compilación y typecheck satisfactorios; lint sin nuevas advertencias respecto a la línea base o cambios justificados.
- [ ] Recorrido completo de CU1–CU5 y todos los roles, ramas y casos negativos aprobado.
- [ ] Datos y archivos sobreviven a recarga, nueva sesión y reinicio de servicios.
- [ ] No quedan P0/P1 abiertos en el alcance aceptado; incidencias restantes documentadas y aceptadas.
- [ ] V0–V6 registrados por el usuario; ningún campo de aprobación se autocompleta.
- [ ] Documentación final refleja el código comprobado y diferencia datos reales de simulación.

## Avance registrado · 30 de octubre de 2026

- C01: `6ab3371`, bloqueo de compilación corregido y comprobado.
- C02: preparación `1c86c33`; [ejecución con PostgreSQL](evidencias/C02-ejecucion-postgres.md) completó tres ramas API, con las limitaciones descritas. Navegador y aceptación V0 pendientes.
- Nuevo **INC-01**: consecutivos derivados del ID chocan con códigos semilla; error no controlado termina la API y deja una creación parcial. Se incorpora como dependencia adicional antes de pruebas de múltiples propuestas; no se considera resuelto por repetir con otros IDs. Confirmar política de consecutivo antes de cambiar la estrategia, preservando formato y unicidad.
- No se comenzaron C03 ni cambios funcionales sujetos a discusión. La regla de justificación documental continúa vigente.

## Avance visual · 30 de octubre de 2026

C02 dispone ahora de [evidencia en Chromium](evidencias/C02-validacion-visual.md): 12 logins por rol, 17 pasos, vistas principales y reproducción de superposición en devolución y rechazo CIE. Se mantiene V0 pendiente; no se modificaron reglas de formularios, numeración, permisos ni transiciones. Las condiciones originalmente no reproducidas ya tienen evidencia parcial concreta, sin certificar toda la matriz visual/accesible.

## Ajuste de ejecución solicitado por el usuario

Corregir todos los defectos comprobados y sustentados; trasladar ambigüedades a [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md). La ejecución de esas correcciones ya está autorizada y no queda retenida por V0. Las decisiones ambiguas y las casillas de aceptación del usuario permanecen pendientes; no se consideran aprobadas por continuar la implementación. Se mantiene separación de commits, justificación y pruebas.


## Pausa y punto de reanudación

El usuario solicitó detener la implementación y continuar más adelante. Estado, estimación, verificaciones reales y pendientes en [CHECKPOINT.md](CHECKPOINT.md). No continuar automáticamente ni marcar aceptación final.


## Reanudación y revisión · 31 de octubre de 2026

Ver [ESTADO-DE-REVISION.md](ESTADO-DE-REVISION.md) para trazabilidad actual de los 33 hallazgos. Se ejecutaron regresiones sobre las correcciones y los scripts de instalación/desinstalación solicitados al final; README principal actualizado. Las casillas de validación humana y decisiones del equipo permanecen abiertas.
