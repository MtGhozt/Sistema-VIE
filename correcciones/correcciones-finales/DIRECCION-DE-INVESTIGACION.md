# Dirección de Investigación · revisión final

**Fecha local:** 13/11/2026. Implementación y validación integrada completadas. Pendiente de aceptación manual. Sin capturas ni reinicio de desarrollo.

## ¿Puede rechazar una propuesta?

**En el modelo de roles del prototipo, no.** [Análisis de personas, P6-c](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md): Dirección de Investigación recibe el dictamen CIE y notifica aprobación o rechazo. P6-b asigna la decisión al CIE. [D09 y D11](../DECISIONES-D05-D11.md) mantienen la decisión cerrada y no permiten override administrativo.

Las [Disposiciones oficiales 2027, sección 2.7.3](../../docs/oficiales-vie/markdown/1-Disposiciones%20Convocatoria%20Fondos%20VIE%202027.md) también respaldan la consulta de acuerdos por Dirección de Investigación. El cronograma oficial menciona elaboración de dictamen por esta Dirección; no se interpreta esa mención como autorización para sustituir una resolución CIE ya emitida. La subdivisión operativa aplicada aquí es P6 del proyecto.

Por eso no se añade otro botón de rechazo. Sí se permite leer el fundamento CIE, su rúbrica, los oficios y los documentos antes de notificar, tanto aprobaciones como rechazos.

## Problemas y correcciones

| Pantalla | Problema | Corrección |
| --- | --- | --- |
| Inicio | Conteos derivados de la bandeja, sin distinguir decisiones y notificaciones. | Cuatro indicadores SQL del ámbito completo, con destinos filtrados diferentes. |
| Prioridades | Lista genérica, incluyendo trabajo ya terminado. | Solo resoluciones pendientes, por antigüedad de resolución y máximo cinco. |
| Evaluaciones | Incluía resoluciones ya notificadas y mostraba un botón deshabilitado de trámite terminado. | La bandeja predeterminada contiene solo pendientes con resolución CIE real y coherente con el estado. Las notificadas se consultan en Histórico. |
| Lectura | Enlace pequeño y datos breves. | Botón azul de al menos 52 px, paneles ampliables, expediente desplazable, lectura con índice ocultable y letra ajustable; regreso a la misma evaluación. |
| Respaldos | No se consultaban en la pantalla de notificación. | Fundamento, responsable y rúbrica CIE, verificación VIE, Comité y oficio, PI, aval y archivos descargables. |
| Notificación | Acción inmediata sin confirmación; registro poco visible. | Modal con resolución, resultado y destinatario; cancelar no escribe. Confirmar retira de pendientes y abre Histórico. |
| Histórico | Modal pequeño y falta de filtro específico. | Expediente completo; filtro de notificación; columna de estado; fecha, responsable y destinatario reales del registro. |
| Comunicación | Mensaje interno genérico. | Incluye número y resultado de la resolución; el aviso al investigador incluye el fundamento hasta el límite del mensaje. El fundamento íntegro permanece en la resolución. |

No se generan archivos PDF institucionales ficticios. Se retira el botón inactivo de PDF automático; los adjuntos reales continúan disponibles para descarga.

## Indicadores

| Indicador | Criterio | Destino |
| --- | --- | --- |
| Pendientes de notificar | Resolución CIE aprobatoria/rechazatoria coherente con el estado y sin comunicación confirmada. | Histórico `notificacion=pendientes`. |
| Notificadas | Resolución CIE con comunicación interna registrada. | Histórico `notificacion=notificadas`. |
| Aprobaciones | Resolución CIE aprobatoria, notificada o pendiente. | Histórico `notificacion=aprobaciones`. |
| Rechazos | Resolución CIE de rechazo, notificada o pendiente. Excluye rechazo de aval del Consejo. | Histórico `notificacion=rechazos`. |

Son dos clasificaciones distintas: estado de notificación y resultado CIE; no se suman los cuatro valores. El acceso principal abre los pendientes operativos en Evaluaciones. Las prioridades abren la propuesta específica. Los errores de consulta se muestran sin inventar ceros ni «Sin pendientes».

## Persistencia y alcance

- Confirmar registra una notificación en la aplicación para la persona coordinadora y una comunicación institucional con responsable, destinatario y fecha.
- **No cambia aprobación/rechazo ni reabre el expediente.** Dirección comunica la decisión existente.
- El bloqueo transaccional de la propuesta ya evita duplicados. Se mantiene la operación idempotente: reintentar informa que ya fue notificada y no agrega otra notificación ni comunicación. La interfaz la retira de pendientes.
- No envía correo externo ni demuestra lectura/recepción efectiva. El registro se presenta como notificación interna, sin atribuirle un acuse inexistente.
- Superadministrador usa la misma vista operativa y mantiene las precondiciones del flujo. El acceso a documentos conserva los permisos por expediente.

**Por discutir con el equipo si se amplía el alcance:** destinatarios institucionales adicionales y canal formal de entrega/acuse. P6-c menciona instancias e investigadoras, pero no define aquí una matriz completa de copias. Esta entrega conserva el destinatario coordinador implementado y no inventa envíos externos.

## Validación técnica

Comando específico: `pnpm regression:direccion-investigacion`, con `TEST_DATABASE_URL` exclusivamente para `fondos_vie_test`. Comprueba bandeja, cuatro filtros, paneles, respaldos, descarga real, confirmación/cancelación, registro histórico, concurrencia, rechazo, móvil y Superadministrador.

**Resultado:** **17 baterías aprobadas, 317 comprobaciones correctas y 6 casos no aplicables**, incluidas las 9 pruebas específicas de Dirección de Investigación. Compilación correcta y lint sin errores, con advertencias preexistentes. [Reporte integrado](evidencias/2026-11-13T08-45-20-550Z-validacion-actual/reporte.json) · [Reporte específico](evidencias/2026-11-13T08-46-47-024Z-direccion-investigacion/reporte.json).

Se actualizó la comprobación API anterior que esperaba encontrar una resolución ya notificada en la bandeja: ahora comprueba su exclusión y conserva la verificación de la marca persistida en el detalle.

## Revisión manual

Para obtener un pendiente, emita una resolución desde CIE y luego entre como Dirección de Investigación. El cargador actual de propuestas demo deja sus casos aprobados/rechazados ya notificados; estos deben aparecer en Histórico y no volver a la bandeja pendiente.

- [ ] Revisar los cuatro indicadores, sus filtros y las prioridades reales.
- [ ] Abrir una aprobación pendiente y consultar fundamento, rúbrica CIE y respaldos.
- [ ] Ampliar cada panel y usar el botón azul para revisar presupuesto/documentos; volver a la misma evaluación.
- [ ] Cancelar la notificación y comprobar que continúa pendiente.
- [ ] Confirmar, comprobar el registro histórico y que desaparece de pendientes.
- [ ] Revisar responsable, destinatario y fecha de notificación.
- [ ] Notificar un rechazo CIE y comprobar que conserva el rechazo.
- [ ] Consultar las notificadas desde Histórico, sin una segunda acción de aprobación/rechazo.
- [ ] Repetir el recorrido desde Superadministrador y comprobar lectura en pantalla estrecha.
