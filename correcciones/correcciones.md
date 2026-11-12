# Revisión de correcciones · Sistema VIE · Steadman Murillo

> **Seguimiento:** este es el informe de hallazgos inicial. El código posterior y sus verificaciones se resumen en [ESTADO-DE-REVISION.md](ESTADO-DE-REVISION.md).


> **Fecha:** 29 de octubre de 2026  
> **Estado:** revisión documental y estática del código; validación visual en navegador pendiente.  
> **Propósito:** conservar las observaciones originales, precisar su sustento y convertirlas en correcciones verificables para una siguiente iteración.

## Contenido

- [Criterios de revisión](#criterios-de-revisión)
- [Hallazgos principales](#hallazgos-principales)
- [Correcciones transversales](#correcciones-transversales)
- [Persona investigadora coordinadora](#persona-investigadora-coordinadora)
- [Evaluación y decisiones por rol](#evaluación-y-decisiones-por-rol)
- [Super Administrador](#super-administrador)
- [Hallazgos adicionales](#hallazgos-adicionales)
- [Orden de atención y comprobación](#orden-de-atención-y-comprobación)
- [Cobertura y fuentes](#cobertura-y-fuentes)

## Criterios de revisión

Las notas originales describen experiencias de uso. Se contrastaron con la implementación actual, los casos de uso, el análisis de personas y los documentos oficiales disponibles en el repositorio. Las instrucciones y los prompts incluidos en esos documentos se trataron como material de referencia, no como órdenes para modificar la aplicación.

| Dictamen | Significado |
| --- | --- |
| **Confirmado en código** | Existe una implementación concreta que explica el problema. No implica que se haya ejecutado una prueba de extremo a extremo. |
| **Parcialmente sustentado** | Hay un problema real, pero la afirmación original necesita acotarse. |
| **Mejora propuesta** | Es razonable como diseño; la documentación no establece exactamente esa regla. |
| **Pendiente de reproducción** | Falta evidencia en ejecución para confirmar el síntoma o su causa. |
| **Reformulado** | La afirmación mezcla una responsabilidad legítima del rol con un defecto diferente. |

**Prioridad:** **P0** bloquea una decisión esencial o permite saltarse requisitos; **P1** compromete datos, trazabilidad o tareas principales; **P2** mejora claridad, legibilidad o funciones secundarias. Es una propuesta de priorización para este proyecto.

### Distinción indispensable: API y demostración local

[EvaluacionesPage.tsx](../frontend/src/pages/EvaluacionesPage.tsx) utiliza PostgreSQL cuando la bandeja devuelve expedientes. Si la respuesta está vacía o falla, muestra propuestas de demostración local y advierte que las acciones no persisten.

Esto puede explicar resultados distintos entre roles y pérdidas al recargar. Una bandeja vacía, una caída de la API y una acción guardada son situaciones diferentes y deben registrarse por separado al probar.

## Hallazgos principales

| Prioridad | Hallazgo | Sustento |
| --- | --- | --- |
| **P0** | El rechazo del CIE envía la justificación como `motivo`, pero se valida como `texto`. | Incompatibilidad directa entre el panel y `onAction`; el backend espera `texto` o `fundamento`. |
| **P0** | Las acciones comprueban el rol y excluyen borradores, pero no exigen toda la ruta previa. | Se puede solicitar una transición sin verificar dictamen PI cuando aplica, completitud, aval o comunicación anterior. |
| **P1** | «Guardar evaluación» devuelve éxito sin guardar la rúbrica. | El caso `save-rubric` del backend solo asigna un mensaje. |
| **P1** | El formulario permite guardar únicamente un subconjunto de lo que presenta. | `draftPayload()` omite fechas, preguntas generales, referencias, declaración y recursos, entre otros datos. |
| **P1** | La bandeja de notificaciones no consume las notificaciones registradas en BD. | El contexto renderiza el mismo arreglo `NOTIFICACIONES` para todas las personas. |
| **P1** | El detalle de propuestas reales incorpora contenido de una propuesta de ejemplo. | `apiToDetailModel()` recibe una plantilla demo y reutiliza equipo, presupuesto, productos y otros bloques. |

## Correcciones transversales

### GEN-01 · Histórico y visibilidad según rol

**Dictamen:** parcialmente sustentado / mejora propuesta · **P1**.

La observación original es correcta en cuanto a que el histórico comparte consulta y lógica entre roles: [HistoricoPage.tsx](../frontend/src/pages/HistoricoPage.tsx) no adapta sus datos al rol y [historico.ts](../backend/src/routes/historico.ts) exige sesión, pero no restringe los resultados por persona, dependencia o etapa.

Sin embargo, el análisis de personas concede consulta histórica a todos los roles. No se encontró una regla explícita que prohíba al Comité consultar cualquier borrador. El [CU5](../docs/casos-de-uso/CASOS-DE-USO.md) exige filtros combinables y roles autorizados, sin definir una matriz detallada de visibilidad.

**Corrección propuesta:** definir qué expedientes puede consultar cada rol y qué diferencia al histórico de la bandeja de trabajo. Considerar excluir borradores ajenos de las vistas institucionales; aplicar la política también en la API.

**Aceptación:** la consulta y el acceso directo al expediente respetan la matriz acordada; los filtros no permiten ampliar permisos.

### GEN-02 · Legibilidad y revisión de textos

**Dictamen:** parcialmente sustentado · **P2**.

Hay tamaños reducidos en los estilos: por ejemplo, la campana utiliza textos de 10–12 px en [brand-overrides.css](../frontend/src/styles/brand-overrides.css), y la rúbrica contiene metadatos de 9 px en [prototipo.css](../frontend/src/styles/prototipo.css). También existen ajustes posteriores que amplían partes del formulario: no sería preciso afirmar que toda la aplicación tiene el mismo problema.

El [informe de accesibilidad](../docs/a11y/INFORME-WCAG.md) registra mejoras de contraste y teclado; eso no demuestra por sí mismo comodidad de lectura, adaptación a zoom o ausencia de superposiciones. Las faltas del borrador original tampoco prueban faltas en la interfaz.

**Corrección propuesta:** revisar textos, jerarquía tipográfica y tamaños efectivos en todas las rutas. Unificar denominaciones como «Consejo de Escuela / Consejo de Profesores» y traducir estados técnicos visibles (`en_evaluacion`, por ejemplo).

**Aceptación:** inventario de errores con pantalla y texto exactos; recorrido a 100 % y 200 % de zoom, teclado y anchos de escritorio y móvil sin pérdida de contenido. No establecer un tamaño arbitrario como prueba automática de cumplimiento de accesibilidad.

### GEN-03 · Notificaciones idénticas y destinatarios incorrectos

**Dictamen:** confirmado en código · **P1**.

[NotificationsContext.tsx](../frontend/src/notifications/NotificationsContext.tsx) muestra `NOTIFICACIONES` sin filtrar por rol ni destinatario. Solo conserva las marcas de lectura por `userId` en `localStorage`.

Por ello, que el CIE vea avisos de ejemplo destinados a otras instancias tiene una explicación concreta. No debe generalizarse a «el CIE no puede recibir notificaciones de VIE»: sí podría recibir una remisión legítima.

**Aceptación:** la campana y la página consultan avisos del destinatario autenticado; los eventos nuevos aparecen tras cambiar de sesión y recargar; el estado leído persiste en el almacenamiento definido para el producto.

### GEN-04 · Archivos y documentos sin acceso real

**Dictamen:** confirmado en código; limitación declarada del prototipo · **P1**.

**Estado 2026-11-09:** la carga real de PDF/DOCX/XLSX quedó implementada (D05–D11). El detalle vivo es el wizard en solo lectura (`PropuestaDetallePage`); el expediente de evaluación es [CaseFile.tsx](../frontend/src/components/evaluation/CaseFile.tsx) con descarga autorizada. `ProposalDetailView` se retiró.

**Aceptación:** verificar apertura/descarga desde investigador y evaluador autorizado; otro usuario no accede. Imágenes/videos y PDF automático de oficios siguen fuera de alcance.

## Persona investigadora coordinadora

### INV-01 · Equipo interno y colaboradores externos

**Dictamen:** confirmado en código · **P1**.

El paso 3 del [formulario](../frontend/src/components/FormWizardStepContent.tsx) muestra `rich.teamTec` como tabla fija. No ofrece selección, ingreso, edición o eliminación de integrantes ni de colaboradores externos. El detalle sí puede mostrar colaboradores externos provenientes de la plantilla demo.

**Sustento:** CU2; formulario oficial, cuadros de participantes; Disposiciones §2.6 y §2.7. Se requieren participantes, horas, tipos de carga, periodos y respaldos según corresponda.

**Aceptación:** agregar, editar y quitar integrantes; distinguir personal TEC y externo; persistir las relaciones y los datos exigidos; volver a abrir la misma propuesta sin integrantes de ejemplo ajenos.

### INV-02 · «Guardar borrador» y «Guardar y salir»

**Dictamen:** parcialmente sustentado; no se confirma una inoperancia total · **P1**.

Ambos botones llaman `onSave()` en [PropuestaNuevaPage.tsx](../frontend/src/pages/PropuestaNuevaPage.tsx), que utiliza `createPropuesta()` o `patchPropuesta()`. Hay implementación de persistencia; su éxito efectivo requiere API y BD operativas.

El defecto confirmado es el **guardado incompleto**: el payload incluye título, modalidad, resumen, abstract, problema, objetivo general, metodología y palabras clave; no incluye todos los campos editables. Además, `patch()` anuncia «Guardado automáticamente» aunque solo actualiza estado React: no hay una operación de autoguardado asociada.

**Aceptación:** guardar, recargar y reabrir conserva cada campo anunciado como editable. El mensaje de guardado solo aparece tras confirmación real del almacenamiento; los errores se muestran sin prometer éxito.

### INV-03 · Secciones sin controles de edición

**Dictamen:** confirmado en código · **P1**.

| Paso visible | Sección | Implementación encontrada |
| --- | --- | --- |
| 5 | Estado del arte | Párrafo orientativo; no hay campo para redactar. No está literalmente vacío. |
| 7 | Plan de acción y riesgos | Tabla de ejemplo sin controles de edición. |
| 8 | Presupuesto y financiamiento | Montos de ejemplo; no hay captura del desglose ni del financiamiento. |
| 9 | Compromisos de productos | Lista fija. |
| 10 | Resguardo de productos | Texto derivado del ejemplo. |
| 11 | Divulgación y socialización | Párrafo fijo. |
| 12 | Aspectos éticos | Texto del ejemplo. |
| 13 | Hoja de ruta | Párrafo fijo. |

**Sustento:** secciones correspondientes del [formulario oficial](<../docs/oficiales-vie/markdown/4- Formulario Proyecto Investigacion Fondos VIE 2027.md>), CU2 y las plantillas de plan/riesgos y presupuesto.

**Aceptación:** cada sección permite capturar datos propios y recuperarlos después de guardar. Para los apartados que oficialmente se completan en Excel, definir captura estructurada o adjunto real con consulta posterior; la normativa no exige por sí sola convertir toda plantilla en un editor web.

### INV-04 · Límites de extensión

**Dictamen:** confirmado para el resumen; reformulado respecto a caracteres · **P1**.

El formulario oficial exige **máximo 500 palabras en el resumen** y **entre 4 y 6 términos clave**. El wizard no incluye contador ni validación de esas restricciones. No equivale a 500 caracteres ni permite asumir que todas las secciones tienen el mismo límite.

**Aceptación:** verificar 500 y 501 palabras, y 3, 4, 6 y 7 términos clave; explicar el límite junto al campo y comprobarlo también en el servidor. Revisar las demás restricciones individualmente contra su fuente.

### INV-05 · Resumen, abstract y palabras clave en inglés

**Dictamen:** parcialmente sustentado · **P1**.

Resumen y abstract sí están en el payload de guardado. El problema adicional está en las palabras clave: se envía `keywordsEn: ""`, no existe un control específico para capturarlas y el detalle puede suplir valores vacíos con datos de ejemplo.

El inglés no es un error por sí mismo: el formulario oficial incluye Abstract y el CU2 contempla palabras clave ES/EN. Deben distinguirse los idiomas y evitar mostrar términos que la persona no ingresó.

**Aceptación:** resumen, abstract y términos de cada idioma se recuperan exactamente como fueron guardados; un campo vacío permanece vacío; la edición no elimina datos en inglés inadvertidamente.

### INV-06 · Lectura y consulta de documentos

Las observaciones originales sobre letras pequeñas y documentos no visibles quedan recogidas en **GEN-02** y **GEN-04**, con el mismo alcance para formular y consultar propuestas.

## Evaluación y decisiones por rol

### FLU-01 · Posibilidad de ignorar instancias anteriores

**Dictamen:** confirmado en código · **P0**.

Agrupa las observaciones sobre Vinculación, asistente del Comité, Consejo, Dirección de Escuela, VIE y Super Administrador.

[evaluaciones.ts](../backend/src/routes/evaluaciones.ts) valida la acción por rol y rechaza propuestas en borrador, pero no verifica para cada acción la etapa exacta, los requisitos previos ni el cierre definitivo del expediente. Filtrar la bandeja no sustituye esa validación. Varias acciones utilizan `Math.max()` para avanzar y pueden cambiar el estado sin acreditar toda la ruta anterior.

Las bandejas también se solapan: asistente y evaluador del Comité comparten etapas; asistente del Consejo, Consejo y Dirección de Escuela comparten otro rango. Tras una acción, la UI reemplaza el expediente en la lista sin retirarlo necesariamente de la bandeja actual.

**Sustento:** Disposiciones §2.7 — avales obligatorios; §2.10.3.3 — dictamen PI cuando corresponde; §2.11 — evaluación, dictamen y resolución; análisis de personas y CU3/CU4.

**Aceptación:** una matriz explícita define transición, responsable y requisitos. El backend bloquea saltos de etapa, repetición indebida de decisiones y cambios posteriores al cierre. El dictamen PI se exige **cuando aplica**, con una ruta explícita para «no requerido».

### VIN-01 · Emisión y guardado del dictamen de Vinculación

**Dictamen:** parcialmente sustentado / fallo intermitente pendiente de reproducción · **P1**.

[VinculacionPanel](../frontend/src/components/evaluation/EvaluationRolePanels.tsx) sí envía `pi` con los campos del formulario. La API inserta o actualiza `dictamen_pi` y avanza el expediente. No se encontró un botón de guardado parcial independiente.

La afirmación «de repente no puede emitir» necesita propuesta, rol, modo API/demo y respuesta de red. En demostración local no existe persistencia. El dictamen puede registrarse en BD sin que todos sus campos se recuperen para volver a mostrarlos en el panel.

**Aceptación:** emitir, recargar y consultar el mismo dictamen recupera su contenido real; distinguir borrador de dictamen y emisión definitiva si se añade guardado parcial. La posibilidad de omitir un dictamen requerido se atiende en **FLU-01**.

### CTA-01 · Superposición al devolver con observaciones

**Dictamen:** pendiente de reproducción visual · **P2**.

La devolución usa [SimpleModal.tsx](../frontend/src/components/evaluation/SimpleModal.tsx), con overlay fijo y `z-index: 100`. El modal se monta dentro de un panel `sticky`; es un aspecto que conviene examinar, pero no prueba por sí solo la superposición reportada.

**Aceptación:** registrar captura, tamaño de ventana, zoom, desplazamiento y elemento que tapa el diálogo; comprobar que título, observación, confirmación y cancelación quedan visibles y accesibles con teclado. Evaluar un portal al documento si la reproducción demuestra un conflicto de apilamiento.

### CTA-02 · Devolución, permanencia en bandeja y acciones posteriores

**Dictamen:** confirmado en código, con precisión de alcance · **P1**.

`return` deja el estado en `enviada` y la etapa en 1; la bandeja del asistente incluye esa combinación. La UI tampoco bloquea sistemáticamente las acciones siguientes. Además, la edición de la persona investigadora solo se permite en `borrador`, por lo que la devolución no abre un camino claro de subsanación.

El asistente no tiene un botón de aprobación final: su acción es **Enviar a evaluación**. Debe conservarse esa distinción al reportar el problema.

**Aceptación:** una devolución permite corregir y reenviar según una regla acordada; suspende el avance mientras existan faltantes; la consulta posterior puede mantenerse en modo lectura y con trazabilidad.

### CTE-01 · Guardar evaluación y recuperar puntajes

**Dictamen:** confirmado en código · **P1**.

El panel envía `scores`, promedio y recomendación. El caso `save-rubric` de la API **no ejecuta escritura**. `committee-score` conserva el consolidado en `resultado_comite`, pero no los puntajes y justificaciones individuales de la rúbrica.

**Sustento:** CU4 y modelo de tablas `evaluacion` / `evaluacion_puntaje`. La continuidad reconoce este pendiente.

**Aceptación:** guardar y recargar recupera notas y justificaciones por criterio, propuesta y evaluador; ningún mensaje de éxito aparece sin persistencia.

### CON-01 · Función del Consejo y permanencia tras avalar

**Dictamen:** reformulado · **P1** por integridad del flujo.

El Consejo sí tiene una responsabilidad sustantiva: **aprobar o rechazar el aval**, con justificación y oficio. Disposiciones §2.7 establece que los acuerdos son requisito de admisibilidad y eventual aprobación. Su función no se mide por la cantidad de botones.

La falla sustentada es que su decisión puede omitirse por falta de validación de etapas (**FLU-01**). Seguir consultando una propuesta avalada no es un error por sí mismo; el filtro actual lo permite expresamente. El riesgo es conservar decisiones activas cuando ya no corresponden.

**Aceptación:** el aval condiciona la siguiente transición; después de decidir, consulta y acciones disponibles reflejan el estado real del expediente.

### DIR-01 · Dirección de Escuela con una sola acción

**Dictamen:** reformulado · **P1** en la validación del flujo.

Comunicar el aval a VIE es precisamente la tarea definida para este rol. No hace falta añadir acciones solo para aumentar su participación. Sí debe verificarse que exista un aval y que se registre su comunicación antes de continuar cuando el flujo acordado lo exija.

El botón «Vista previa del memorando (IC-467)» no tiene manejador. La comunicación registra datos, pero no genera un PDF real.

**Aceptación:** impedir comunicar avales inexistentes; recuperar el registro de comunicación; implementar o identificar claramente la vista previa pendiente. Mantener consulta posterior es válido, con acciones acordes al estado.

### VIE-01 · Observaciones que no se ven registradas

**Dictamen:** parcialmente sustentado · **P1**.

`vie-observation` sí inserta en `observacion`. No obstante, el mapeo de la bandeja no devuelve esas observaciones y el detalle usa observaciones de ejemplo; el contexto de notificaciones tampoco lee la BD. **Registrar**, **mostrar** y **notificar** son operaciones distintas y actualmente no forman un recorrido completo.

**Aceptación:** la observación persiste, aparece vinculada al expediente correcto y llega al equipo destinatario; definir respuesta y cierre cuando requiera subsanación.

### VIE-02 · Checks de verificación sin interacción

**Dictamen:** confirmado en código · **P1**.

`GestoraViePanel` presenta filas estáticas con «Verificado»: no son checkboxes ni hay estado editable o persistido. «Enviar al CIE» no depende de completar una revisión real.

**Aceptación:** obtener el estado de evidencias comprobables o permitir revisión explícita y persistida; no marcar automáticamente requisitos como verificados; bloquear la remisión cuando falten requisitos obligatorios.

### CIE-01 · Rechazo que no se ejecuta

**Dictamen:** confirmado en código · **P0**.

`RubricPanel` envía `{ motivo: rejectText.trim(), ... }` al confirmar. `EvaluacionesPage.onAction()` exige `payload.texto` para `cie-reject`, por lo que lo rechaza antes de llamar a la API. El backend también espera `texto` o `fundamento`, no `motivo`.

El modal se cierra inmediatamente sin esperar el resultado, lo que dificulta corregir el problema.

**Aceptación:** una justificación válida llega al servidor, persiste en `resolucion_cie` y actualiza el estado; ante un error, el modal conserva el texto y permite reintentar.

### CIE-02 · Aprobación, guardado y superposiciones

**Dictamen:** mixto · **P1**; superposición **P2** pendiente de reproducción.

- **Guardar evaluación:** mismo fallo confirmado de **CTE-01**.
- **Aprobar:** el botón requiere todas las justificaciones y una recomendación favorable. Ese bloqueo puede ser deliberado. Sin embargo, el panel también envía el fundamento como `motivo`; la API lo ignora y puede sustituirlo por un texto genérico. Se confirma pérdida del fundamento, no una imposibilidad total de aprobar.
- **Superposición:** requiere la comprobación visual descrita en **CTA-01**.
- **«No se pueden probar las demás pantallas»:** el rechazo bloquea ese recorrido, pero no demuestra que todas las pantallas siguientes fallen. Existen expedientes semilla y una vista de Dirección de Investigación para resoluciones finales.

**Aceptación:** tanto aprobación como rechazo conservan el fundamento ingresado; explicar por qué una acción está deshabilitada; probar ambas ramas hasta la consulta histórica.

### CIE-03 · Notificaciones a la persona coordinadora

**Dictamen:** parcialmente sustentado · **P1**.

La notificación formal corresponde a **Dirección de Investigación**, según el análisis de personas y el diagrama de secuencia. `notify-resolution` inserta una notificación al coordinador y una comunicación institucional; aprobar o rechazar desde CIE no ejecuta esa acción automáticamente.

El aviso registrado no aparece en la bandeja visible porque esta consume datos fijos (**GEN-03**). Además, el adaptador no recupera `notificada`, lo que puede volver a presentar como pendiente una comunicación realizada.

**Aceptación:** emitir resolución → comunicar desde el rol responsable → recibir aviso real → recargar y conservar el estado comunicado, evitando duplicados por repetición accidental.

## Super Administrador

### ADM-01 · Administración solo informativa

**Dictamen:** confirmado en código; alcance por acordar · **P2**.

[AdministracionPage.tsx](../frontend/src/pages/AdministracionPage.tsx) enumera roles y mantiene Usuarios, Catálogos y Formularios deshabilitados con indicación de que no están implementados. No ofrece gestión real de esos elementos.

El análisis de personas contempla administración transversal; los cinco casos de uso demostrables no exigen un módulo completo de administración de usuarios y formularios. Debe distinguirse una carencia del producto objetivo de un requisito imprescindible para la demo actual.

**Aceptación:** declarar el alcance; implementar las operaciones administrativas acordadas o mantenerlas explícitamente como pendientes.

### ADM-02 · Acceso transversal y aprobación sin recorrido previo

**Dictamen:** parcialmente sustentado · **P0** para saltos indebidos.

Cambiar de vista y ejecutar tareas de todos los roles es una capacidad **documentada** del Super Administrador. No constituye por sí misma un fallo.

La API autoriza al administrador para todas las acciones, pero no valida la ruta previa más allá de excluir borradores. Por tanto, la afirmación correcta es: **puede resolver una propuesta ya enviada sin acreditar todos los pasos necesarios**; no puede aprobar directamente un borrador mediante esta ruta.

**Aceptación:** mantener la operación transversal y aplicar las reglas de negocio a toda acción. Si se acuerdan excepciones administrativas, deben ser explícitas, justificadas y auditables.

## Hallazgos adicionales

Estos puntos surgieron al contrastar las notas con otras pantallas y documentos.

| ID | Prioridad | Hallazgo y evidencia | Resultado esperado |
| --- | --- | --- | --- |
| ADI-01 | P1 | `apiToDetailModel()` completa una propuesta real con equipo, presupuesto, productos, ética, documentos y actividad de `PROP-2027-014`. | Mostrar datos propios o ausencia de datos; no atribuir ejemplos a un expediente real. |
| ADI-02 | P1 | `AuthContext` cambia `viewRole`, pero envía a la API el rol autenticado `admin`; la bandeja API devuelve su vista transversal. | Diferenciar permiso administrativo y filtro de vista; el panel y los expedientes mostrados deben corresponder a la vista elegida. |
| ADI-03 | P1 | Las rutas de `App.tsx` requieren sesión, sin guardia por rol; ocultar un enlace del menú no bloquea el acceso directo a Administración. | Aplicar controles de acceso acordes con la matriz, también al navegar por URL. |
| ADI-04 | P1 | `committee-score` registra siempre `recomienda` y puede usar 80 como valor por defecto, sin conservar la recomendación negativa enviada. | Guardar fielmente la evaluación humana y comprobar la rúbrica en el servidor. |
| ADI-05 | P1 | Declaración jurada aceptada por defecto; el envío desde el detalle llama directamente a `enviarPropuesta()` sin el control del wizard. | Definir requisitos de envío y validarlos de forma uniforme en el backend. |
| ADI-06 | P2 | Inicio mezcla indicadores y tareas fijas con expedientes API; `PropuestasPage` calcula progreso con constantes y solo traduce algunos estados. | Etiquetar cifras simuladas o calcularlas con datos reales; no confundir etapa con completitud del formulario. |
| ADI-07 | P2 | Convocatorias permite crear/publicar/cerrar, pero no ofrece edición completa de datos e hitos ya existentes, aunque CU1 la contempla. | Habilitar la edición prevista o documentar el alcance pendiente. |
| ADI-08 | P1 | Formularios de evaluación conservan estado con `useState` inicializado desde la propuesta; los paneles no tienen una `key` por expediente. | Al cambiar de propuesta, cargar sus datos y evitar reutilizar notas o dictámenes del expediente anterior. |
| ADI-09 | P1 | La devolución utiliza siempre ciclo 1 y actualiza la revisión existente. El modelo documental contempla ciclos sucesivos. | Conservar el historial de cada devolución, subsanación y nueva revisión. |

## Orden de atención y comprobación

1. **Restablecer decisiones esenciales:** corregir el contrato de justificación CIE y validar las transiciones y sus requisitos en el servidor.
2. **Proteger los datos:** persistir rúbricas y campos del formulario; eliminar sustituciones por contenido demo y mensajes de guardado ficticios.
3. **Cerrar el circuito institucional:** devolución/subsanación, observaciones, comunicaciones y notificaciones con lectura real.
4. **Completar la interacción:** equipo, plantillas, adjuntos y acciones de consulta documental dentro del alcance acordado.
5. **Validar la presentación:** tipografía, ortografía, estados de carga/error, zoom, adaptación de pantalla y modales en todas las vistas.

### Lista de aceptación para la siguiente revisión

- [ ] Registrar en cada prueba rol autenticado, vista elegida, expediente y origen API/demo.
- [ ] Crear, guardar, recargar y reabrir una propuesta; comparar todos sus campos.
- [ ] Corregir una devolución y reenviar sin perder historial ni datos.
- [ ] Probar dictamen PI requerido y no requerido.
- [ ] Confirmar que cada rol recibe únicamente las tareas que le corresponden.
- [ ] Intentar saltos de etapa y decisiones repetidas mediante la API; verificar rechazo.
- [ ] Guardar una rúbrica, recargar y recuperar puntajes y fundamentos.
- [ ] Cambiar de expediente y comprobar que no se arrastran datos del anterior.
- [ ] Completar aprobación y rechazo hasta notificación y consulta histórica.
- [ ] Verificar el aviso desde la sesión de la persona destinataria.
- [ ] Recorrer login, inicio, convocatorias, propuestas, los 17 pasos, detalle, paneles de evaluación, histórico, notificaciones y administración con teclado y zoom.
- [ ] Documentar las superposiciones con capturas y condiciones reproducibles.

## Cobertura y fuentes

### Alcance efectivo de esta revisión

Se inventariaron las rutas y se revisó su implementación: login, inicio, convocatorias, propuestas, wizard de 17 pasos, detalle con pestañas, evaluación de los nueve roles operativos y vista administrativa, histórico/listado/detalle, notificaciones y administración. Se contrastaron componentes compartidos, estilos, contextos, adaptadores, rutas API y esquema SQL relevantes.

**No se ejecutó un recorrido interactivo de toda la interfaz ni pruebas contra PostgreSQL.** El entorno no dispuso de una herramienta de navegador para reproducir las superposiciones. Las afirmaciones de funcionamiento se limitan a lo demostrable por lectura del código; la lista anterior queda como validación de ejecución pendiente.

La documentación se contrastó mediante sus versiones Markdown y extractos disponibles. No se verificó página por página la fidelidad de todas las conversiones frente a cada PDF, DOCX o XLSX original, ni se inspeccionó visualmente cada imagen del repositorio. Por eso esta revisión no equivale a una certificación visual exhaustiva ni a una auditoría normativa externa.

### Fuentes de requisitos y contraste

| Fuente | Aporte a la revisión |
| --- | --- |
| [Disposiciones Fondos VIE 2027](<../docs/oficiales-vie/markdown/1-Disposiciones Convocatoria Fondos VIE 2027.md>) | Avales, participantes, PI y responsabilidades de evaluación; especialmente §2.6, §2.7, §2.10.3 y §2.11. |
| [Formulario oficial](<../docs/oficiales-vie/markdown/4- Formulario Proyecto Investigacion Fondos VIE 2027.md>) | Secciones, resumen de 500 palabras, 4–6 términos clave, equipos, planes y productos. |
| [Rúbricas oficiales](../docs/oficiales-vie/markdown/2-Rubricas_Investigacion_2027__Fondos_VIE.md) | Criterios por modalidad y requisitos obligatorios. |
| [Plan de acción y riesgos](<../docs/oficiales-vie/markdown/5- Plan de Accion y Gestion del Riesgo Fondos VIE 2027.md>) y [presupuesto](<../docs/oficiales-vie/markdown/6- Plantilla Presupuesto Convocatoria Fondos VIE 2027.md>) | Estructura de las plantillas complementarias. |
| [Acuerdo coordinadora](<../docs/oficiales-vie/markdown/7- Formato de acuerdo instancia coordinadora Fondos VIE 2027.md>) y [participante](<../docs/oficiales-vie/markdown/8- Formato de acuerdo instancia participante Fondos VIE 2027.md>) | Evidencia formal del aval y participación de las instancias. |
| [Cronograma](../docs/oficiales-vie/markdown/03-Cronograma-Convocatoria-2027.md) | Etapas y responsables de la convocatoria. |
| [Enunciado del curso](../docs/enunciado-curso/profe-instrucciones.txt) | Tres módulos, datos semilla y demostración de principio a fin. |
| [Casos de uso CU1–CU5](../docs/casos-de-uso/CASOS-DE-USO.md) | Alcance demostrable, persistencia y exclusiones explícitas. |
| [Análisis de personas](../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md) y [contexto](../docs/etapa1/Contexto-Proyecto-Fondos-VIE.md) | Responsabilidades y necesidades de cada rol. |
| [Dominio VIE](../docs/cerebro/02-DOMINIO-VIE.md) y [secuencia del proceso](../docs/diagramas/Diagrama_Secuencia_Proceso_VIE.md) | Ruta institucional y comunicaciones esperadas. |
| [Diseño de BD revisado](<../docs/database/Diseno_Base_Datos_Fondos_VIE - Revision.md>) y [SQL](../database/DisennoDB.sql) | Entidades previstas para participantes, revisiones, puntajes, documentos y avisos. |
| [Plan maestro](../PLAN-MAESTRO.md) y [continuidad](../CONTINUIDAD.md) | Decisiones actuales y pendientes conocidos de implementación. |
| [Informe de accesibilidad](../docs/a11y/INFORME-WCAG.md), [marca TEC](../docs/cerebro/03-MARCA-TEC.md) y [manual extraído](../docs/manual-identidad-tec/manual-extract.txt) | Contraste entre intención de diseño, estilos y validación manual pendiente. |
| [Prototipo HTML de referencia](../docs/prototipo-html-referencia/README.md) | Antecedente visual; reproducir una limitación del prototipo no demuestra cumplimiento funcional. |

**Precaución documental:** hay referencias antiguas a SQLite, rutas anteriores y diseños preliminares en `docs/cerebro/`. Los documentos de planeamiento y la continuidad también contienen pendientes y afirmaciones de avance que deben contrastarse con el código. Para las reglas institucionales se priorizan las fuentes oficiales; para describir qué está implementado se utiliza el código actual.
