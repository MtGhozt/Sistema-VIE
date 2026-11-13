# Dirección de Escuela · comunicación de aval a VIE

**Fecha local:** 13/11/2026. Implementación y validación integrada completadas. Pendiente de aceptación manual del usuario. Sin capturas ni reinicio de desarrollo.

## Alcance del rol y sustento

Sí es correcto que Dirección **comunique el aval ya aprobado**, sin decidir nuevamente su aprobación o rechazo. El [análisis de personas, P5.c](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md) le asigna tomar el aval del Consejo y comunicarlo a VIE. P5.b reserva la decisión al Consejo de profesores. Las verificaciones técnicas de etapas anteriores no se reabren desde Dirección.

Debe poder consultar los respaldos de lo que comunica: expediente, presupuesto, adjuntos, oficio/fundamento del aval, consolidado del Comité y dictamen PI o certificación aplicable. El [formato de acuerdo de la instancia](../../docs/oficiales-vie/markdown/7-%20Formato%20de%20acuerdo%20instancia%20coordinadora%20Fondos%20VIE%202027.md) y el [formulario oficial](../../docs/oficiales-vie/markdown/4-%20Formulario%20Proyecto%20Investigacion%20Fondos%20VIE%202027.md) contienen esos respaldos. Se mantiene el ámbito de escuela/asignación, la exclusión de borradores ajenos y la protección de observaciones privadas de otras etapas.

## Causa del problema y corrección

El botón existente insertaba una comunicación cada vez y volvía a escribir **Avalada**, mientras Dirección conservaba en bandeja todos los avales de la etapa. Esto hacía indistinguibles los pendientes de lo ya comunicado y permitía duplicar registros.

El estado académico **Avalada se conserva**: comunicar no es emitir otra decisión. Ahora existe una fase operativa separada, consultada desde el registro real de comunicación:

1. Aval aprobado, en etapa 4, todavía sin comunicación vigente → pendiente de Dirección.
2. Dirección revisa respaldos y confirma el registro.
3. Se guarda comunicación con fecha y responsable; la propuesta sale de su bandeja y sus prioridades.
4. Se abre Histórico filtrado a **Comunicados a VIE**, con la comunicación diferenciada del estado académico.
5. La propuesta queda disponible en la bandeja de verificación VIE. Antes de comunicar, VIE no puede guardar la verificación ni remitirla a CIE.

La API exige aval aprobado con número de oficio, etapa correspondiente y ausencia de comunicación vigente. El bloqueo transaccional de la propuesta evita duplicados incluso con dos solicitudes simultáneas. Los registros anteriores se conservan: no se borraron comunicaciones antiguas para normalizar datos.

Una reconsideración autorizada distingue su nuevo ciclo por la fecha de autorización; una comunicación anterior no habilita el aval nuevo. En cambio, una subsanación pedida por VIE vuelve a VIE tras el reenvío del investigador y **no requiere ni permite repetir** la comunicación de Dirección.

## Inicio, filtros y prioridades

| Indicador | Qué representa | Destino |
| --- | --- | --- |
| Pendientes de comunicar | Avales aprobados en etapa 4, sin comunicación vigente. | Evaluaciones: pendientes de comunicación. |
| Comunicados a VIE | Avales con comunicación vigente, aunque el expediente haya avanzado. | Histórico: comunicaciones registradas. |
| En VIE | Comunicados en etapa 4 y estado Avalada, disponibles para la verificación de VIE. Excluye subsanaciones pendientes del investigador. | Histórico: En VIE. |
| Aval rechazado | Rechazos de aval vigentes del Consejo; consulta, sin acción de comunicación aprobatoria. | Histórico: aval rechazado. |

Se retiran los rótulos **Con confirmación** y **Por revisar**, que no tenían una fuente suficiente ni conjuntos distinguibles. Los conteos se calculan sobre todo el ámbito autorizado, sin recortarse a las primeras 100 entradas. Las prioridades son hasta cinco avales pendientes más antiguos por fecha de aval/ID, no expedientes recientes al azar ni registros ya comunicados.

El filtro Comunicación del aval se conserva al recargar y volver del expediente. Histórico muestra por separado aval, comunicación a VIE y estado de propuesta. Las consultas mantienen las optimizaciones y los índices de la revisión de Consejo; no se requiere una migración nueva.

## Revisión y comunicación

- Botón principal de expediente completo al inicio, como los perfiles anteriores; conserva la propuesta y el filtro al volver.
- Consulta ampliable con índice ocultable, tamaño de letra y accesos directos a presupuesto y documentos.
- En preparación se consultan el aval real, fecha, responsable y fundamento, además de Comité, PI y adjuntos. Se utiliza la escuela del expediente, sin nombres de escuela fijos.
- Modal de confirmación antes de registrar; cancelar no produce cambios. Las acciones ya registradas se consultan en Histórico, no se ofrecen como aprobaciones repetidas.
- Se retira el botón PDF deshabilitado. Se muestran registros digitales y los archivos realmente cargados; no se promete un oficio firmado inexistente.

**Registro de comunicación no equivale a acuse de recibo.** El prototipo no envía correo externo y el campo de confirmación existente no se marca como si VIE hubiera recibido un mensaje. La pantalla indica si consta una confirmación, o si el registro no incluye acuse. Esta revisión no inventa un nuevo procedimiento de recepción institucional.

## Validación técnica

**9 comprobaciones específicas aprobadas** en [el reporte inicial](evidencias/2026-11-13T06-10-18-000Z-direccion-escuela/reporte.json): permisos, indicadores, prioridades, lectura y móvil, confirmación/cancelación, estado persistido, exclusión de pendientes, ingreso a VIE, duplicados, concurrencia y subsanación hacia VIE. Dos solicitudes simultáneas dieron una respuesta exitosa y un conflicto, con **un registro y un evento**.

La batería integrada terminó con **14 grupos aprobados, 288 comprobaciones y 6 casos no aplicables**. [Reporte global](evidencias/2026-11-13T06-12-17-404Z-validacion-actual/reporte.json). Incluye los perfiles anteriores y las rutas de aprobación, rechazo y reconsideración.

Compilación frontend/backend y lint sin errores; permanecen las advertencias conocidas de tamaño del paquete y lint. Los nombres de reporte utilizan UTC; la fecha local de esta revisión es 13/11/2026. No se reinició desarrollo ni se eliminaron sus propuestas. Las pruebas crean sus fixtures únicamente en `fondos_vie_test`.

## Revisión manual

- [ ] Abrir las cuatro tarjetas y comprobar sus filtros, conjuntos y conteos.
- [ ] Revisar prioridades y verificar que solo sean avales pendientes de comunicación.
- [ ] Abrir expediente, presupuesto, aval, Comité, PI y documentos; ampliar lectura y volver a la misma propuesta.
- [ ] Cancelar la confirmación y comprobar que siga pendiente.
- [ ] Registrar comunicación y comprobar que salga de Evaluaciones/prioridades y aparezca en Histórico con fecha y responsable.
- [ ] Comprobar que el estado académico sigue Avalada y la comunicación figura como registrada.
- [ ] Verificar que no se pueda repetir el registro y que VIE reciba el expediente.
