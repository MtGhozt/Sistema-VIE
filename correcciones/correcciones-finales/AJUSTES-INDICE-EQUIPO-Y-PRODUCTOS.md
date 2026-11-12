# Investigador · índice, equipo y confirmación de correcciones

**Fecha:** 12/11/2026. Segunda ronda de observaciones del usuario. Pendiente de aceptación manual; no cambia la aceptación de VIE-Publicación.

## Cambios y fundamento

| Tema | Ajuste |
| --- | --- |
| Índice y progreso | Colores en el **botón completo** y texto del estado. El estilo anterior anulaba el color del número. La barra ahora cuenta secciones completas/guardadas, no la posición del paso visitado. |
| Scroll | En edición y consulta se usa completitud real: visitar una sección no la completa. El listado dentro de «Secciones del formulario» tiene altura limitada, scroll vertical, acceso mediante teclado y desplazamiento hasta el último paso sin perder el encabezado del panel. |
| CONS | El campo «Dependencia o persona que aporta horas CONS» es editable mientras se edita la sección, aun antes de elegir el tipo de horas. Su exigencia sigue siendo condicional: solo cuando se declaran horas CONS positivas. En consulta permanece en solo lectura. |
| Nombramiento | Inicio y fin en DD/MM/YYYY, botones de calendario visibles y selección mediante calendario. Fechas reales, años 2000–2100, fin ≥ inicio. Se requiere el período para avanzar, confirmar el equipo o enviar una propuesta con participantes TEC. **Guardar un borrador incompleto sigue permitido** si ambas fechas se dejan vacías; un período parcial o incoherente se señala. |
| Iniciales y participantes | Las iniciales ahora se persisten y recuperan mediante el ID estable del participante. Se normaliza la referencia del formulario complementario al guardar, incluso cuando el servidor sustituye el nombre capturado por el nombre del usuario TEC. No se depende únicamente de comparar nombres. El nombramiento se conserva en el registro del participante. |
| Guardar correcciones | Se validan las secciones modificadas y la sección autorizada que se está guardando. Solo esas secciones se registran como atendidas. Guardar objetivos no confirma automáticamente un resumen pendiente. No se descartan cambios de otras secciones modificadas: también deben validarse y guardarse. |
| Persistencia del color | La confirmación se reconstruye con los campos atendidos que conserva la devolución y la validación del contenido. Persiste al recargar. Un cambio sin guardar invalida el azul en la sesión. Un error o fallo de guardado no confirma una sección ni sobrescribe parcialmente datos. |

## Significado de los colores

| Color | Significado |
| --- | --- |
| Verde | Sección completa y válida del formulario. |
| Rojo | Sección solicitada para corrección que sigue pendiente, contenido editado sin confirmar o errores detectados. |
| Azul | Corrección guardada y validada por el formulario. **No significa aval ni aprobación del Comité, Consejo o CIE.** |
| Blanco, con borde | Sección actual al crear/editar, cuando no tiene un estado de corrección o error prioritario. |

Los estados tienen etiquetas de texto además del color. El reenvío sigue siendo una acción aparte, con respuesta a las observaciones y retorno a la misma instancia.

## ¿Están bien las opciones de productos?

La estructura y los umbrales de los cuadros 6–10 del [formulario oficial](../../docs/oficiales-vie/markdown/4-%20Formulario%20Proyecto%20Investigacion%20Fondos%20VIE%202027.md) sí se corresponden con el formulario:

- Investigación básica/aplicada: 1, 2 o 3 opciones para 1–10, 11–20 o 21–30 horas.
- Desarrollo tecnológico: al menos 1 activo PI y 1, 2 o 3 opciones académicas según esos rangos; mínimos combinados de 2, 3 o 4.
- Se permite combinar o repetir opciones. **Una unidad de la opción 2 equivale a dos artículos**, no a uno. Los resultados complementarios no reemplazan el mínimo académico.
- Se corrigió un detalle de la descripción: para **desarrollo tecnológico**, la opción 2 exige que **al menos uno de los dos artículos esté publicado**. Este requisito no se agrega a la opción de básica/aplicada, donde la fuente no lo expresa así.

La comprobación del formulario valida cantidades, selección de opción, objetivo asociado y datos del activo. **No certifica publicaciones, indexación ni coherencia científica con el dictamen PI**: corresponde a la revisión institucional. La extrapolación por encima de 30 horas continúa documentada para discusión, porque excede el cuadro explícito.

El nombramiento figura en el Cuadro 2 del formulario y en los [acuerdos de instancia coordinadora](../../docs/oficiales-vie/markdown/7-%20Formato%20de%20acuerdo%20instancia%20coordinadora%20Fondos%20VIE%202027.md). El formato exacto y las señales visuales responden a la indicación del usuario y a la consistencia de captura; no se presentan como una nueva norma CIE.

## Validaciones técnicas

| Validación | Resultado | Evidencia |
| --- | --- | --- |
| Ajustes de esta ronda | **10 PASA** | [Reporte](evidencias/2026-11-12T15-30-22-680Z-ajustes-indice-equipo/reporte.json) |
| Regresión completa del investigador | **24 PASA** | [Reporte](evidencias/2026-11-12T15-20-18-946Z-investigador/reporte.json) |
| Regresión API | **33 PASA** | [Reporte](../evidencias/2026-11-12T15-20-18-705Z-regresion-api/reporte.json) |
| Aprobación y rechazos de CIE/Consejo | **72 PASA y 6 NO APLICA** | [Reporte](../evidencias/2026-11-12T15-25-23-612Z-linea-base-api/reporte.json) |

Las comprobaciones nuevas verifican el color efectivo, scroll hasta el paso 17, calendarios en móvil, normalización del nombre sin perder iniciales, persistencia de fechas, obligatoriedad al avanzar/enviar y confirmación separada de dos secciones. Se comprobaron los umbrales de productos para 10, 11, 20, 21 y 30 horas, repetición de opciones y activo PI obligatorio.

Compilación completa y lint sin errores, con las advertencias anteriores. Pruebas sobre `fondos_vie_test`, Chromium en inglés y vista móvil, **sin capturas**. No se modificó la base de desarrollo ni se añadió una migración: se reutilizan los registros y el JSON complementario existentes.

Se conservan los intentos anteriores como trazabilidad: uno no pudo conectar porque PostgreSQL de pruebas estaba apagado y otro leyó el color antes de finalizar su transición. La ejecución final comprueba el estado visual estable.

## Revisión manual

- [ ] Avanzar entre pasos; ver botones verdes, actual blanco y progreso por completitud.
- [ ] Hacer scroll hasta Documentación/Revisión con mouse y teclado.
- [ ] Editar CONS y comprobar su guardado, sin confundirlo con obligatoriedad para otros tipos de horas.
- [ ] Probar ambos calendarios del nombramiento y un fin anterior al inicio.
- [ ] Guardar iniciales y nombramiento, recargar y comprobarlos.
- [ ] Corregir una de dos secciones solicitadas: una azul y la otra roja; volver a editar la azul y comprobar que retorna a rojo.
- [ ] Intentar guardar una corrección inválida: conservar los datos previos y mostrar el error.
- [ ] Revisar opciones de productos y el requisito de publicación de la opción 2 tecnológica.
