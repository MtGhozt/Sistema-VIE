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
