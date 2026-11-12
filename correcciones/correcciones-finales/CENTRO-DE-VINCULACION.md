# Centro de Vinculación · revisión final

**Estado:** implementación y validación técnica completadas el 12/11/2026. Pendiente de revisión manual del usuario. Persona Investigadora Coordinadora y VIE-Publicación permanecen aceptados; esta revisión no extiende su aceptación a Vinculación.

## Hallazgos, cambios y sustento

| ID | Hallazgo | Corrección / fundamento |
| --- | --- | --- |
| CV01 | Las tarjetas enviaban a Evaluaciones sin filtrar. | Pendientes, en revisión, emitidos y no requeridos llevan al histórico con un filtro **de PI** explícito. El filtro se conserva en la URL y al recargar. |
| CV02 | Los conteos usaban la bandeja limitada de expedientes pendientes, por lo que no podían representar las decisiones emitidas. | Consulta de indicadores sobre todos los registros dentro del ámbito autorizado, con el mismo cálculo de estado y permisos que el histórico. No se reutiliza el estado académico general como si fuera el de PI. |
| CV03 | «En revisión» no tenía una acción ni un registro persistido. | Acción **Iniciar revisión de PI**, con responsable y fecha, idempotente. No emite dictamen, no certifica no requerimiento y no avanza el circuito. Es un estado operativo de trabajo, no una nueva decisión institucional. |
| CV04 | Confusión entre declarar y certificar PI no requerido. | «No requerido» solo cuenta cuando Vinculación registró la certificación expresa con fundamento y responsable. La declaración del investigador por sí sola sigue pendiente. Se mantienen las precondiciones D04. |
| CV05 | Prioridades escogidas desde entradas recientes, sin explicar su criterio. | Pendientes de PI más antiguos desde el envío, hasta cinco, con desempate estable por ID. Excluye decisiones PI cerradas, propuestas cerradas y subsanaciones pendientes del investigador. Se muestra el criterio. Es un orden operativo de atención; no se inventa un SLA ni una prioridad institucional por volumen. |
| CV06 | Un pendiente antiguo podía quedar fuera de las primeras 100 entradas al abrir Evaluaciones. | El expediente solicitado se prioriza en la consulta de bandeja, **conservando los predicados de etapa y ámbito**. Si no está disponible no se elige otra propuesta silenciosamente. |
| CV07 | Expediente reducido a un lateral pequeño o un popup incompleto. | Histórico de Vinculación abre una pantalla completa con las secciones del formulario, presupuesto, plan, equipo, documentos y registro PI. Reutiliza la consulta en solo lectura, respetando las observaciones visibles para el rol y los resúmenes autorizados de otras etapas. |
| CV08 | Lectura y edición se mezclaban en Evaluaciones. | Evaluaciones contiene el formulario de trabajo PI y un enlace al expediente completo; se retira el lateral reducido para este rol. Al emitir/certificar vuelve a la consulta completa, sin activar otro expediente por defecto. |
| CV09 | Falta de espacio y control de lectura. | Contenedores desplegables, cambio de sección, letra ampliable/reducible y ampliación del área de lectura ocultando el índice lateral. Se mantiene un selector de secciones para seguir navegando. |
| CV10 | Filtros de PI inexistentes y enlaces que no recuperaban estado. | Grupo desplegable de Estado de PI, limpieza individual/general y combinación con los otros filtros del histórico. Se distinguen Estado de propuesta y Estado de PI. |
| CV11 | Errores de consulta podían parecer ceros o ausencia de trabajo. | Error visible con reintento; no se inventan conteos ni tareas cuando falla la API. |

## Estados de PI

| Estado | Evidencia persistida |
| --- | --- |
| Pendiente | No hay dictamen emitido ni certificación aplicable, ni revisión operativa activa. Incluye declaraciones de no requerimiento aún no certificadas. |
| En revisión | Revisión operativa de PI iniciada y aún no concluida. |
| Emitido | Dictamen emitido con fecha para una propuesta que requiere PI. |
| No requerido certificado | Certificación independiente para una propuesta que no requiere dictamen. |

Estos estados no equivalen a Enviada, En evaluación, Dictaminada por Comité, Avalada o Aprobada. Abrir un expediente en consulta no cambia su estado. Iniciar una revisión tampoco reemplaza las decisiones exigidas para avanzar. Los dictámenes y certificaciones cerrados no se reabren.

## Sustento documental

- [Análisis de personas, P3](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md): bandeja de pendientes, vista de propuesta, plantilla de dictamen y registro del oficio.
- [Disposiciones, §2.10.3](../../docs/oficiales-vie/markdown/1-Disposiciones%20Convocatoria%20Fondos%20VIE%202027.md): el Centro de Vinculación es la instancia técnica responsable de PI; el dictamen contempla potencial de innovación/protección y productos asociados. No constituye aprobación académica general.
- [Formulario oficial](../../docs/oficiales-vie/markdown/4-%20Formulario%20Proyecto%20Investigacion%20Fondos%20VIE%202027.md): información de propuesta y potencial de PI que debe poder consultarse.
- Reglas ya aprobadas D02/D04: ámbito filtrado en API, borradores ajenos excluidos y acreditación de PI antes de avanzar.

El orden por antigüedad, los filtros, la pantalla completa y los controles de lectura responden al pedido de usabilidad. Las fuentes no fijan un puntaje de urgencia ni un SLA para Vinculación. Si el equipo desea otra política de prioridad deberá definirla expresamente.

La revisión operativa usa `revision_expediente` con etapa `pi`; se amplía su documentación en el esquema, sin modificar columnas ni requerir una migración funcional. La emisión y la certificación conservan sus tablas y sus condiciones existentes.

## Validación técnica

Las pruebas usan datos identificados de demostración en `fondos_vie_test`, incluyendo fechas antiguas sintéticas para verificar el orden de atención. No se modifica la base de desarrollo ni se generan capturas.

- Vinculación: **16 verificaciones aprobadas**, incluyendo navegación real en navegador, filtros, permisos, persistencia, conteos, errores de API y lectura móvil sin desbordamiento. [Reporte](evidencias/2026-11-12T16-26-55-935Z-vinculacion/reporte.json).
- Investigador: **24 verificaciones aprobadas** tras los cambios compartidos. [Reporte](evidencias/2026-11-12T16-17-49-114Z-investigador/reporte.json).
- API: **33 verificaciones aprobadas**. [Reporte](../evidencias/2026-11-12T16-17-48-857Z-regresion-api/reporte.json).
- Flujo institucional: rutas de aprobación, rechazo CIE y rechazo de aval comprobadas. [Reporte](../evidencias/2026-11-12T16-26-33-981Z-linea-base-api/reporte.json).
- Compilación de frontend/backend y lint completados sin errores; permanecen advertencias de lint y de tamaño del paquete de producción.

Las primeras ejecuciones detectaron y permitieron corregir el acceso a expedientes antiguos fuera de las primeras 100 entradas, nombres accesibles de campos y el desbordamiento de cabecera en móvil. Los reportes previos se conservan como trazabilidad; el reporte final indicado arriba cierra esas incidencias. Estas pruebas no sustituyen la aceptación manual pendiente.

## Revisión manual

- [ ] Comprobar las cuatro tarjetas, sus conteos y su filtro en Histórico.
- [ ] Revisar el orden de pendientes más antiguos y abrir el expediente correcto.
- [ ] Combinar, plegar, limpiar y recargar los filtros.
- [ ] Abrir una propuesta sin popup, consultar secciones y adjuntos, ampliar letra/ancho y volver al histórico conservando filtros.
- [ ] Abrir el registro PI emitido/no requerido y verificar que sea de consulta.
- [ ] Iniciar revisión y comprobar que aparezca En revisión sin emitir todavía.
- [ ] Registrar dictamen o certificar no requerimiento; volver a consultar el resultado y los indicadores.
- [ ] Confirmar que Evaluaciones no selecciona otro expediente cuando el solicitado ya no está pendiente.
