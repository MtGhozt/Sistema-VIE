# Asistente del Comité Técnico · revisión final

**Estado:** implementación y validación técnica completadas el 12/11/2026. Pendiente de aceptación manual. Centro de Vinculación queda aceptado por el usuario, incluidos los ajustes del dictamen.

## Cambios y sustento

| ID | Hallazgo | Cambio |
| --- | --- | --- |
| ACT01 | El acceso al expediente era un enlace pequeño al final del lateral. | Botón principal de ancho completo y altura mínima de 52 px, situado al inicio del panel, con explicación de la consulta y el regreso. |
| ACT02 | Se perdía la evaluación de origen al regresar del expediente. | El acceso conserva `/evaluaciones?propuesta=ID`; Volver a la evaluación restaura la propuesta exacta, también tras recargar la consulta. El destino se comprueba contra el ID del expediente. |
| ACT03 | El asistente no disponía de los controles cómodos de Vinculación. | Se reutiliza la misma pantalla de solo lectura, con ampliación de ancho, ocultación/restauración del índice, selector de sección y tamaño de letra. También se utiliza al abrir desde Histórico; en ese caso conserva el filtro y vuelve a Histórico. |
| ACT04 | El dictamen PI no podía consultarse para verificar su contenido. | Registro de PI en el expediente, con todo el dictamen emitido, oficio, fecha/hora, contadores y fundamento de no requerimiento cuando corresponda. Se mantienen los permisos de ámbito de la API. |

## Quién verifica el dictamen

Sí corresponde que el asistente pueda **consultarlo para verificar la completitud del expediente**. El [análisis de personas, P4.a](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md) asigna al asistente la revisión del formulario, plan, presupuesto y adjuntos antes de pasar al cuerpo evaluador. El [formato oficial de acuerdo de la instancia, apartado 3](../../docs/oficiales-vie/markdown/7-%20Formato%20de%20acuerdo%20instancia%20coordinadora%20Fondos%20VIE%202027.md) exige al Comité constatar el oficio de Vinculación cuando aplica.

La [disposición 2.10.3.3](../../docs/oficiales-vie/markdown/1-Disposiciones%20Convocatoria%20Fondos%20VIE%202027.md) reserva a Vinculación el dictamen técnico sobre innovación, protección y productos PI. El asistente consulta su contenido y verifica que corresponda al expediente; esto no le permite sustituir el análisis técnico, alterar el dictamen ni emitir otro. No se agregan nuevos criterios de aprobación ni reglas para saltar el flujo.

La API habilita solo la **lectura** para `comite_asistente`: conserva el ámbito por escuela/asignación, excluye borradores ajenos y no expone contenido de un eventual dictamen aún no emitido. Las acciones de inicio, emisión y certificación PI continúan restringidas a Vinculación/administración según los permisos existentes. No se requiere migración.

## Validación técnica

**22 comprobaciones aprobadas**: las 17 regresiones de Vinculación y 5 específicas del asistente (consulta y permisos, botón destacado, lectura/PI, retorno tras recarga y apertura desde Histórico). [Reporte](evidencias/2026-11-13T03-29-58-109Z-vinculacion/reporte.json).

Se comprobó lectura en 390 px sin desbordamiento horizontal, contenido en solo lectura y rechazo de acciones PI y de consultas de otra escuela/borrador ajeno. Compilación frontend/backend aprobada; se conserva la advertencia conocida sobre tamaño del paquete. No se generaron capturas. El nombre del reporte utiliza UTC; la fecha local de esta revisión es 12/11/2026.

## Revisión manual

- [ ] Confirmar que el botón de expediente es visible y cómodo de encontrar.
- [ ] Abrir desde Evaluaciones, consultar y volver a la misma propuesta.
- [ ] Ocultar/restaurar el índice, seleccionar secciones y ampliar ancho/letra.
- [ ] Revisar el dictamen de PI y sus datos asociados, sin controles para modificarlo.
- [ ] Abrir desde Histórico y regresar conservando su filtro.

## Ajuste de recepción y remisión al Cuerpo Evaluador · 12/11/2026

**Hallazgo:** el estado académico `en_evaluacion` ya podía asignarse después de PI. Por tanto, ese estado por sí solo no acreditaba la remisión por el asistente. Cada clic en Enviar creaba una revisión adicional y los controles de recepción permanecían activos. Además, «Listas para evaluación» no tenía un cálculo y terminaba en cero.

**Corrección:** la última revisión formal de Comité distingue la recepción de la remisión. Se reutiliza `revision_expediente`; no requiere migración ni se crean revisiones nuevas para normalizar datos anteriores.

- Antes de remitir: estado visible **Pendiente de revisión de completitud**, checklist editable y devolución de recepción disponible. No se permite guardar/entregar evaluación técnica ni confirmar consolidado antes de la remisión.
- Al remitir: se asignan los evaluadores, queda registrada la revisión completa y se muestra **Enviada al Cuerpo Evaluador · recepción completada**. El asistente conserva el acceso para seguir las entregas y confirmar el consolidado.
- Después de remitir: se ocultan Enviar y Devolver de recepción y el checklist queda en solo lectura. La API rechaza tanto una remisión repetida como una devolución de recepción, sin duplicar revisiones ni alterar el expediente. La operación usa el bloqueo transaccional existente de la propuesta.
- El Cuerpo Evaluador solo recibe expedientes remitidos, dentro de su ámbito y asignación. La API también exige la remisión antes de guardar o entregar sus valoraciones.
- La tarjeta **Listas para evaluación** cuenta los expedientes efectivamente remitidos sobre todo el ámbito autorizado, sin limitarse a las primeras 100 filas. Abre la bandeja filtrada a remisiones. El selector **Fase del Comité** permite distinguir recepción, remisiones y todas las fases.
- El **Fundamento del dictamen consolidado** tiene contador de caracteres con barra azul y límite de **4.000 caracteres**, compartido entre interfaz y API. El exceso se rechaza sin recortarlo. Es un límite operativo de captura; los documentos oficiales no fijan un número para este texto.

### Sustento y alcance

La tarea P4.a del análisis de personas establece que el asistente revisa completitud y **después** pasa al cuerpo evaluador o devuelve por faltantes. Este ajuste responde además al pedido expreso del usuario de impedir los envíos repetidos y la devolución desde recepción una vez remitida. El estado académico general no se renombra: se añade una indicación operativa de la fase formal.

No se introduce una reapertura excepcional ni se anulan evaluaciones entregadas. Si se necesitara devolver una propuesta ya remitida por una situación extraordinaria, el equipo deberá definir una acción y reglas específicas; el botón de recepción no cumplirá esa función.

### Validación del ajuste

- **26 comprobaciones aprobadas**, incluyendo envío único, persistencia al recargar, rechazo de devolución posterior, disponibilidad para el evaluador, conteo/filtro reales y límites del fundamento. Incluye las regresiones de lectura del asistente y Vinculación. [Reporte final](evidencias/2026-11-13T03-45-55-729Z-vinculacion/reporte.json).
- **72 comprobaciones aprobadas, 6 no aplicables** en las rutas de aprobación, rechazo CIE y rechazo de aval. [Reporte](../evidencias/2026-11-13T03-43-42-250Z-linea-base-api/reporte.json).
- Compilación frontend/backend y lint sin errores, con las advertencias existentes.
- Se intentó también la batería antigua D01–D04, pero no llegó a ejecutar sus escenarios: su convocatoria de preparación carece de presupuesto y usa una apertura pasada, incompatibles con las validaciones ya aprobadas de VIE. No se cuenta como aprobada ni se modificó esa batería para forzar el resultado. [Registro del bloqueo](../evidencias/2026-11-13T03-43-26-188Z-decisiones-d01-d04/reporte.json). La devolución previa y el bloqueo posterior se verificaron expresamente en la batería final del ajuste.

### Validación manual pendiente del ajuste

- [ ] En recepción, revisar que pueda devolver por faltantes antes de remitir.
- [ ] Remitir una propuesta y comprobar el cambio de fase, los evaluadores y la desaparición de las acciones de recepción.
- [ ] Recargar y comprobar que no se pueda remitir nuevamente ni devolver desde recepción.
- [ ] Verificar la tarjeta Listas para evaluación y el filtro de fase.
- [ ] Comprobar el contador y límite de 4.000 caracteres del fundamento consolidado.

## Indicadores Con faltantes / Devueltas · 12/11/2026

**Hallazgo:** las tarjetas usaban el estado académico general y abrían la bandeja sin distinguir conjuntos. La bandeja excluía las subsanaciones, de modo que «Devueltas» siempre podía mostrar cero. No hay una marca persistida de «faltantes» anterior a la devolución: los checks sin marcar de una sesión no constituyen un estado institucional.

**Cambio:** se reemplaza «Con faltantes» por **Reenviadas por revisar**, basado en subsanaciones reales del Comité ya respondidas. No se inventa una nueva decisión ni un estado de aprobación. La recepción/corrección corresponde a P4.a del análisis de personas y al ciclo de subsanación D03 ya aprobado.

| Indicador | Qué cuenta | Destino |
| --- | --- | --- |
| Pendientes | Expedientes en recepción, aún no remitidos al Cuerpo Evaluador. Incluye las reenviadas por revisar. | Evaluaciones · fase Pendientes de completitud. |
| Reenviadas por revisar | Expedientes corregidos y reenviados tras una devolución del Comité, todavía sin nueva remisión al Cuerpo Evaluador. Es un subconjunto de Pendientes. | Evaluaciones · fase Reenviadas por revisar. |
| Listas para evaluación | Expedientes efectivamente remitidos al Cuerpo Evaluador. | Evaluaciones · fase Enviadas al Cuerpo Evaluador. |
| Devueltas | Expedientes actualmente en subsanación con una devolución del Comité aún no reenviada. No cuenta devoluciones de VIE ni el acumulado histórico de devoluciones cerradas. | Histórico · filtro Devoluciones del Comité = Devueltas pendientes de subsanación. |

Los cuatro conteos se calculan en BD sobre todo el ámbito autorizado (escuela/asignación), independientemente del límite de 100 filas de la bandeja. Los filtros usan los mismos predicados. Un fallo de consulta muestra un error y «—», no ceros inventados. El filtro del Histórico se conserva al recargar, permite limpiar y combina con los filtros existentes. No hay migración ni se alteran expedientes.

### Validación

**28 comprobaciones aprobadas** de Vinculación/Asistente. Se crearon por API expedientes devueltos y reenviados, se verificaron los conteos y destinos con navegador, y se comprobó que al remitir una corregida baja Reenviadas y sube Listas. Se mantuvieron las regresiones de permisos, lectura y envío único. [Reporte final](evidencias/2026-11-13T03-57-44-444Z-vinculacion/reporte.json). Compilación frontend/backend aprobada; no se generaron capturas.

- [ ] Comprobar que ya no aparezca Con faltantes y se muestre Reenviadas por revisar.
- [ ] Abrir Devueltas y comprobar expedientes pendientes de corrección y el filtro de Histórico.
- [ ] Corregir/reenviar como investigador y comprobar la salida de Devueltas y la entrada en Reenviadas por revisar.
- [ ] Remitir al Cuerpo Evaluador y comprobar que cambien los conteos y listados.
