# Cuerpo Evaluador del Comité Técnico · revisión final

**Estado:** implementación y validación técnica completadas el 12/11/2026. Pendiente de aceptación manual. Sin capturas ni imágenes.

## Hallazgos, cambios y sustento

| ID | Hallazgo | Cambio |
| --- | --- | --- |
| CET01 | Inicio interpretaba el estado académico como si fuera el avance de la evaluación individual. Una remisión no cambiaba «Recién enviadas» porque PI ya había pasado la propuesta a En evaluación. | Conteos por persona asignada, versión de rúbrica y ciclo actuales. Los filtros y destinos corresponden a esos mismos conjuntos. La remisión del asistente habilita el expediente para los evaluadores asignados. |
| CET02 | Una entrega individual seguía mezclada con el trabajo pendiente. | La bandeja predeterminada contiene pendientes y borradores. Al entregar, el expediente sale del pendiente personal y abre Histórico con Mi evaluación entregada. Esto no supone que todo el Comité haya terminado. |
| CET03 | Histórico mostraba un popup reducido y no distinguía el estado de la valoración de la persona. | Filtro desplegable Mi evaluación, conservado en URL, y columna de evaluación propia separada del estado académico de la propuesta. Pantalla completa con controles de ancho, índice y letra; consulta del dictamen PI y acceso a la evaluación propia. La valoración entregada se recupera en solo lectura, incluso si la propuesta avanzó a otra instancia. |
| CET04 | Justificaciones sin tope ni contador. | Todas las justificaciones editables tienen límite de 4.000 caracteres y contador con barra azul. La API rechaza excesos con el nombre del criterio, sin recortar el texto. Los controles comparten el límite con la persistencia de rúbrica (también usada por CIE). |
| CET05 | Acceso al expediente poco visible. | Botón principal de ancho completo al inicio del panel, como el del asistente. La consulta conserva el regreso a la propuesta y al filtro de evaluación de origen, incluidas las entregadas. |
| CET06 | Lectura y rúbrica competían por espacio y era difícil recorrer contenido largo. | Sección plegable para la propuesta y para cada sección de rúbrica. Ampliar propuesta, Ampliar evaluación y Mostrar ambos paneles. La propuesta tiene desplazamiento propio y foco de teclado; los controles de distribución siguen disponibles con una evaluación cerrada. |
| CET07 | El anillo no representaba visualmente la nota editada. | Anillo calculado con la calificación ponderada sobre los puntos incluidos; cambia al editar las valoraciones. Texto accesible con la nota real. Los valores iniciales no se toman de notas demo o sugeridas por IA. |
| CET08 | Sin indicación de avance. | Barra de completitud: criterios con nota válida y justificación dentro del límite, más verificación de productos. Se recalcula al editar y se recupera desde el borrador guardado. No es una calificación ni altera los pesos de la rúbrica. |
| CET09 | La página abierta podía conservar indicadores anteriores a una remisión desde otra sesión. | Botón Actualizar indicadores y consulta al recuperar el foco de la ventana. No hay notificaciones externas ni se afirma actualización instantánea en segundo plano. |
| CET10 | El selector heredado de expediente tenía ancho mínimo de 540 px. | Selector adaptable al ancho del dispositivo para este perfil; lectura móvil sin desbordamiento horizontal. |

## Indicadores y destinos

| Indicador | Datos reales del usuario actual | Destino |
| --- | --- | --- |
| En bandeja | Asignaciones remitidas al Cuerpo Evaluador, en etapa técnica vigente, sin entrega individual completada. | Evaluaciones: pendientes y borradores. |
| Pendientes de evaluar | Mismo conjunto, sin evaluación propia guardada en la versión/ciclo actuales. | Evaluaciones: Pendientes de evaluar. |
| Borradores de evaluación | Evaluación propia en progreso, dentro de las asignaciones vigentes de la bandeja. | Evaluaciones: Borradores de evaluación. |
| Evaluaciones entregadas | Evaluación propia completada en la versión/ciclo actuales, también si la propuesta avanzó o cerró. | Histórico: Mi evaluación entregada. |

En bandeja es la suma de pendientes y borradores. Los conteos recorren todo el ámbito y las asignaciones, no solo las primeras 100 filas. La nota de otra persona no cambia estos indicadores. Una nueva remisión aparece únicamente para quienes estén asignados a esa propuesta; no para todos los usuarios con rol evaluador. Los borradores de ciclos anteriores no se cuentan como entregas vigentes.

El histórico general conserva el ámbito institucional existente. Al usar Mi evaluación, se exige además asignación y evaluación de la identidad autenticada; no se admite elegir otro evaluador en la URL. La consulta PI es de solo lectura: el evaluador no obtiene permisos para iniciar, emitir o certificar PI.

## Sustento documental y límites del cambio

- [Análisis de personas, P4.b](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md): valoración independiente con nota y justificación, rúbrica digital y consolidación posterior del Comité. P4.a separa la recepción formal del asistente.
- [Rúbricas oficiales Fondos VIE 2027](../../docs/oficiales-vie/markdown/2-Rubricas_Investigacion_2027__Fondos_VIE.md): escala, pesos y criterios obligatorios. Se conservan las definiciones versionadas y las reglas existentes de recomendación; los controles visuales no sustituyen la valoración humana.
- [Disposiciones, 2.10.3.3](../../docs/oficiales-vie/markdown/1-Disposiciones%20Convocatoria%20Fondos%20VIE%202027.md): dictamen técnico de Vinculación. Se habilita su lectura para revisar el expediente, sin transferir su autoría ni su decisión al evaluador.
- El límite de 4.000 caracteres es **operativo**: las fuentes no prescriben una extensión para cada justificación. No se recortan justificaciones históricas ni sugerencias de IA; si exceden el tope, el contador lo señala y la API impide guardarlas hasta ajustarlas.
- La barra informa completitud de captura y verificación, mientras el anillo informa calificación. Un criterio con nota 0 puede estar justificado y completo. Completar esta evaluación no confirma el consolidado ni aprueba el proyecto.

No se requieren migraciones, no se modifican evaluaciones anteriores y no se cambian los criterios de asignación del Comité. Se reutilizan sus miembros, la versión de rúbrica, el ciclo y las tablas de evaluación existentes.

## Validación técnica

- **38 comprobaciones aprobadas** en la batería ampliada de Vinculación/Comité, incluidas 10 específicas del Cuerpo Evaluador. [Reporte final](evidencias/2026-11-13T04-20-37-059Z-vinculacion/reporte.json).
- Recorrido por API y navegador: remisión → pendiente personal → borrador → entrega → Histórico/consulta de solo lectura. Se comprueba independencia respecto de un segundo evaluador, límites de texto, persistencia, círculo/progreso, paneles, filtros, lectura móvil y actualización de Inicio abierto desde otra sesión.
- **72 comprobaciones aprobadas y 6 no aplicables** de flujo institucional: aprobación, rechazo CIE y rechazo de aval. [Reporte](../evidencias/2026-11-13T04-16-22-965Z-linea-base-api/reporte.json).
- Compilación frontend/backend y lint sin errores; permanecen las advertencias existentes de lint y tamaño del paquete de producción.
- La primera ejecución detectó el selector de ancho fijo. Se corrigió y la repetición pasó todas las comprobaciones, incluida la lectura móvil sin desbordamiento. Los reportes anteriores se conservan para trazabilidad.

Los reportes se identifican con fecha UTC del entorno. La fecha local de esta revisión en Costa Rica es 12/11/2026. Estas pruebas no sustituyen la aceptación manual pendiente.

## Revisión manual

- [ ] Remitir como asistente y comprobar el aumento de asignadas/pendientes del evaluador asignado; actualizar Inicio si estaba abierto.
- [ ] Abrir las cuatro tarjetas y comprobar el filtro y los expedientes correspondientes.
- [ ] Usar el acceso destacado al expediente y volver a la misma evaluación.
- [ ] Plegar la propuesta/secciones de rúbrica y ampliar cada panel; desplazar la propuesta de forma independiente.
- [ ] Cambiar notas y comprobar el círculo; justificar y verificar productos para comprobar la barra de progreso.
- [ ] Comprobar contador y límite de las justificaciones, guardar borrador y recargar.
- [ ] Entregar y consultar desde Histórico la evaluación propia, sin poder modificarla; comprobar que otra persona conserva su propio avance.
- [ ] Revisar ancho móvil, filtros del Histórico y conservación del origen al volver del expediente.
