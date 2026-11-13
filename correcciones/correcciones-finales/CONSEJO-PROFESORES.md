# Consejo de Profesores · revisión y rendimiento

**Estado:** implementado; pendiente de aceptación manual. Revisión local del 12/11/2026, sin capturas. No se reiniciaron las bases ni se borraron propuestas de desarrollo en esta revisión.

## Por qué demoraba el Asistente del Consejo

Se midieron 12 peticiones por caso sobre las mismas 16 propuestas de pruebas, con API local aislada y sin incluir login. El plan de la bandeja tenía un costo estimado de unos 33 millones y activaba compilación JIT de PostgreSQL: **809 ms compilando de 823 ms de ejecución**. Las consultas correlacionadas, los accesos sin índices específicos y el trabajo repetido de filtros no se resolvían ocultando un indicador de carga.

| Consulta | Mediana antes | Mediana después |
| --- | ---: | ---: |
| Bandeja del Asistente del Consejo | 1.573,64 ms | 31,21 ms |
| Histórico del asistente con opciones | 1.072,66 ms | 10,52 ms |
| Filtro del asistente con opciones ya cargadas | — | 6,42 ms |
| Histórico de Consejo | 1.066,24 ms | 8,42 ms |
| Bandeja de Consejo | 12,27 ms | 22,66 ms |

La bandeja de Consejo ahora incluye conteos y prioridades reales, a diferencia de la anterior. Sigue por debajo de 25 ms de mediana en esta medición. Estas cifras describen el entorno local y el volumen probado, no garantizan tiempos universales.

Evidencias: [antes](evidencias/rendimiento-consejo/antes.json), [plan lento y JIT](evidencias/rendimiento-consejo/plan-bandeja-antes.json), [después](evidencias/rendimiento-consejo/despues.json).

### Correcciones de rendimiento

- Migración **012**: índices para remisiones, reconsideraciones, asignaciones y versiones de documentos; estadísticas actualizadas con ANALYZE. Aplicada en desarrollo y pruebas, sin borrar datos.
- El cargador y el reinicio demo actualizan estadísticas después de la carga. No se desactiva JIT globalmente.
- Los filtros ya no reconstruyen sus opciones leyendo expedientes completos con subconsultas de PI y líneas. Se consultan proyecciones pequeñas.
- Una vez cargadas las opciones del usuario/rol, filtrar solicita solo resultados (`opciones=0`). Las opciones se refrescan a los 15 segundos o al cambiar de identidad/rol; los resultados y permisos se consultan siempre en servidor, sin caché global compartida.
- Desplegables inmediatos; solo el texto se difiere 150 ms. Se cancelan solicitudes anteriores y sus respuestas no pueden sobrescribir la selección más reciente.

## Indicadores con lógica de aval

| Tarjeta | Fuente real | Destino |
| --- | --- | --- |
| Pendientes de aval | Expedientes remitidos al Consejo, consolidados, aún sin decisión. | Evaluaciones filtradas. |
| Avaladas | Existe aval aprobatorio vigente, aunque el proyecto haya seguido a VIE/CIE. | Histórico: aval aprobado. |
| Aval rechazado | Rechazo de aval vigente del Consejo. No equivale a rechazo CIE. | Histórico: aval rechazado. |
| Reconsideraciones solicitadas | La coordinación presentó solicitud pendiente sobre un aval rechazado. | Evaluaciones: reconsideraciones. |

Se retiró «Sesión próxima»: no existía una agenda persistida que justificara ese indicador. Los conteos recorren todo el ámbito, sin el límite de 100 entradas de la bandeja. Las prioridades muestran hasta cinco expedientes accionables por antigüedad de dictamen, con criterio visible; no tareas aleatorias ni avales ya cerrados.

Histórico separa **estado de propuesta** y **aval del Consejo**. Un proyecto puede tener aval aprobado y después ser rechazado por CIE; no se oculta esa diferencia ni se clasifica su aval a partir del estado final del proyecto.

## Qué debe revisar el Consejo

El [análisis de personas, P5.b](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md) asigna al Consejo la revisión del expediente/calificación y la aprobación o rechazo del aval. El [formato de acuerdo de la instancia](../../docs/oficiales-vie/markdown/7-%20Formato%20de%20acuerdo%20instancia%20coordinadora%20Fondos%20VIE%202027.md) contempla información del equipo y verificaciones institucionales, incluido el oficio PI cuando corresponde. Las [disposiciones de convocatoria](../../docs/oficiales-vie/markdown/1-Disposiciones%20Convocatoria%20Fondos%20VIE%202027.md) y el [formulario oficial](../../docs/oficiales-vie/markdown/4-%20Formulario%20Proyecto%20Investigacion%20Fondos%20VIE%202027.md) sustentan la consulta de propuesta, presupuesto y respaldos.

El Consejo ahora tiene botón destacado de expediente completo, ancho/letra ampliables, índice ocultable y accesos directos a **presupuesto** y **documentos**. Regresa a la propuesta y filtro de origen. Preparación y consulta muestran nota/fundamento/oficio del Comité y dictamen PI o certificación expresa. Las justificaciones de aprobación, rechazo y autorización de reconsideración tienen contador azul y tope operativo de **4.000 caracteres**, validado también por API; ese máximo no se atribuye a una norma institucional.

El presupuesto estructurado contiene los montos capturados. Los adjuntos descargables son los archivos realmente cargados; una plantilla oficial en blanco es referencia y no equivale a un presupuesto completado. Un registro de oficio sin binario no se presenta como PDF firmado.

## Rechazo y reconsideración

La reconsideración ya existía en el prototipo y se verificó completa:

1. Consejo rechaza con fundamento. El expediente queda en `rechazo_aval`; no se genera una resolución CIE.
2. La coordinación solicita nuevo ciclo con motivo desde su propuesta. El rechazo sigue vigente.
3. Consejo ve la solicitud en Inicio/bandeja y autoriza expresamente con fundamento.
4. El rechazo anterior se conserva en auditoría. El expediente vuelve a preparación del asistente.
5. El asistente remite de nuevo. Solo entonces el Consejo puede emitir el aval del nuevo ciclo.

No se reabre automáticamente ni se permite aprobar por encima del rechazo. El protocolo corresponde al ciclo D11 ya implementado en el proyecto; no se afirma que las fuentes oficiales definan cada detalle de esta excepción. Las solicitudes duplicadas se rechazan explícitamente. Se añadió contador/límite al motivo de la coordinación y se evita repetir su envío en la misma pantalla.

## Consulta y descarga por los perfiles

La API de documentos es común y comprueba el ámbito del expediente **en cada listado y descarga**. Se comprobó descarga binaria con los 12 roles del sistema. Esto no significa acceso a todos los expedientes:

- Investigación: propios y participación permitida; editar adjuntos solo con permiso de coordinación en la fase correspondiente.
- Roles institucionales: escuela/asignación; sin borradores ajenos. Los roles de Consejo requieren consolidado del Comité.
- Administración: consulta transversal según las restricciones existentes, sin habilitar borradores ajenos.

Los documentos retirados, históricos sin binario o asociados a otro expediente no se descargan. La consulta completa de los perfiles revisados conserva Documentos; ahora incorpora acceso directo. Los modales históricos restantes también muestran los adjuntos reales con sus botones de descarga.

## Validación técnica

- Batería integrada: **13 grupos aprobados, 278 comprobaciones y 6 no aplicables**. [Reporte](evidencias/2026-11-13T05-38-51-148Z-validacion-actual/reporte.json).
- Comprobación final específica: **9 casos aprobados** tras separar las columnas de aval/propuesta y ajustar mensajes de indisponibilidad. Incluye móvil sin desbordamiento, descargas binarias de 12 roles, límites, filtros rápidos, decisión y reconsideración completa. [Reporte final de Consejo](evidencias/2026-11-13T05-45-42-308Z-consejo-profesores/reporte.json).
- Compilación y lint completados sin errores; permanecen las advertencias conocidas de lint y tamaño del paquete.
- La migración 012 se aplicó en ambas bases locales sin reinicio ni borrado de propuestas de desarrollo. Los recorridos de prueba escriben únicamente en `fondos_vie_test`.
- No se generan capturas. Los nombres de reporte usan UTC; la fecha local de revisión es 12/11/2026.

## Revisión manual

- [ ] Comparar rapidez de Inicio y filtros del Asistente del Consejo y Consejo de Profesores.
- [ ] Abrir las cuatro tarjetas y comprobar los conjuntos y destinos.
- [ ] Revisar presupuesto, PI, consolidado y adjuntos; descargar y volver a la evaluación de origen.
- [ ] Aprobar/rechazar con fundamento y comprobar contadores y consulta posterior.
- [ ] Solicitar reconsideración como coordinación; autorizar como Consejo y comprobar la remisión nueva por asistencia.
- [ ] Confirmar que el aval del Consejo se distingue del resultado final del proyecto.
