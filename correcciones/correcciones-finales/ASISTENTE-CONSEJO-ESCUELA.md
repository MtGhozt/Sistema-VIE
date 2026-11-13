# Asistente del Consejo de Escuela · revisión final

**Estado:** implementación, validación integrada y reinicio de datos completados el 12/11/2026. Pendiente de aceptación manual del usuario.

## Alcance del rol y respuestas

El [análisis de personas, P5.a](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md) establece: recibe la nota/oficio del Comité, prepara el expediente para sesión y lo remite al Consejo de profesores. **No aprueba ni rechaza el aval**: esa decisión corresponde al Consejo, según P5.b. Tampoco emite otro dictamen PI ni modifica la nota consolidada. El botón se denomina Enviar al Consejo, sin sugerir una aprobación de fondo.

Sí debe consultar los respaldos. Se habilita la nota ponderada consolidada, recomendación, fundamento, responsable, fecha y número de oficio del Comité, así como el dictamen PI emitido o la certificación expresa de no requerimiento. Se mantiene el ámbito por escuela/asignación y la protección de borradores ajenos. No se abren comentarios privados de evaluaciones individuales de otra etapa.

**Oficio del Comité:** es el registro digital del dictamen consolidado confirmado por el asistente técnico, identificado con su número de oficio. Tiene sentido como respaldo del Consejo. Se muestra ese registro íntegro; no se anuncia un PDF adjunto inexistente ni se afirma disponer de una copia firmada externa. El fundamento y la calificación proceden de BD, no de etiquetas de estado o contenido demo.

## Hallazgos y correcciones

| ID | Hallazgo | Cambio |
| --- | --- | --- |
| ACE01 | Inicio contaba estados académicos generales y todas las tarjetas abrían la bandeja sin filtro. | Cuatro conjuntos reales del Consejo, calculados sobre todo el ámbito autorizado y con destinos propios. |
| ACE02 | Listos para sesión no distinguía una preparación persistida y duplicaba otras tarjetas. | Se reemplaza por En Consejo: remisiones efectivas aún sin decisión. No se inventa una preparación intermedia ni una sesión formal. |
| ACE03 | Prioridades tomaban propuestas recientes sin criterio suficiente. | Hasta cinco consolidados pendientes de remisión, por antigüedad de fecha del dictamen; desempate por envío/ID. Excluye remitidos y decisiones cerradas. Criterio visible; no se inventa un plazo institucional. |
| ACE04 | Acceso reducido al expediente y sin retorno a la evaluación de origen. | Botón principal visible como en los perfiles anteriores, consulta completa, índice ocultable, ancho/letra ampliables y retorno a la misma propuesta. Histórico abre también esa consulta. |
| ACE05 | Nota/oficios/PI se representaban con badges estáticos como Adjunto o Verificado. | Lectura real del consolidado y PI en preparación y expediente completo; se retiran afirmaciones de archivos inexistentes. |
| ACE06 | Selector con fechas y sesiones fijas de septiembre de 2026 que no se guardaban. | Referencia de sesión o nota de remisión **opcional**, persistida con la remisión. No impone calendario ni número de sesión. Contador con barra azul y máximo de 2.000 caracteres, compartido entre API e interfaz. |
| ACE07 | Enviar generaba un evento sin una remisión consultable; se podía repetir. | Comunicación interna persistida con fecha, responsable y nota. Bloqueo de duplicados bajo la transacción de propuesta. Al enviar vuelve al Histórico filtrado. El Consejo no puede emitir aval antes de la remisión. |
| ACE08 | Los reenvíos de otro ciclo podían confundirse con una remisión vigente. | Una reconsideración autorizada conserva la remisión anterior como histórica; la nueva remisión debe ser posterior a la autorización. Se respeta el ciclo D11 sin ignorar el rechazo. |

El límite de 2.000 caracteres es operativo: las fuentes no fijan una extensión para una referencia de sesión. No se agregan requisitos documentales obligatorios. Las disposiciones y el [formato de acuerdo de la instancia](../../docs/oficiales-vie/markdown/7-%20Formato%20de%20acuerdo%20instancia%20coordinadora%20Fondos%20VIE%202027.md) sustentan la revisión del dictamen y la calificación para emitir el aval; la responsabilidad de decidir permanece en el Consejo.

## Indicadores y prioridades

| Tarjeta | Qué representa | Destino |
| --- | --- | --- |
| Recibidos | Expedientes con consolidado confirmado, incluidos los que ya avanzaron. | Histórico: consolidados recibidos. |
| Pendientes de preparar | Dictaminados en etapa de Consejo sin remisión vigente. | Evaluaciones: preparación/remisión. |
| En Consejo | Remitidos y todavía sin aval aprobado/rechazado. | Histórico: en Consejo. |
| Enviados | Expedientes con remisión vigente registrada, incluidos los que avanzaron. | Histórico: remitidos. |

Son vistas de trabajo, no estados académicos nuevos ni categorías mutuamente excluyentes. Se calculan sobre toda la consulta autorizada, sin truncar a 100; las prioridades solo muestran cinco pendientes reales más antiguos. Se conserva el filtro al recargar y al volver de la consulta. Inicio permite actualizar indicadores y los consulta al recuperar el foco de ventana.

## Datos limpios y automatización

El usuario autorizó eliminar los datos anteriores al finalizar. El reinicio se limita a `fondos_vie` y `fondos_vie_test` locales, restaura esquema, seed de usuarios/catálogos y migraciones, y retira los expedientes históricos del seed antes de cargar casos nuevos. No toca otras bases, código, dependencias ni evidencias. Los archivos locales anteriores no se eliminan; las nuevas propuestas solo referencian sus adjuntos recién cargados.

`reiniciar-datos-demo.sh` requiere elegir perfil. La carga nueva tiene 16 escenarios reales por API, tres evaluadores demo, PI/certificaciones coherentes, borrador y entrega individuales, consolidado y remisión al Consejo. Adjunta la plantilla presupuestaria oficial y mantiene la captura estructurada como fuente de datos. No fuerza estados por SQL ni envía mensajes externos.

`verificar-actual.sh --reiniciar` reinicia únicamente pruebas, ejecuta las baterías vigentes **secuencialmente** y, al aprobar, repone solo los 16 escenarios. Un fallo conserva los fixtures y logs. El instalador con `--pruebas --verificar` usa ese mismo flujo. Las antiguas baterías de API se actualizaron para fechas vigentes, nombramientos, oficio/instante PI automáticos, remisión única, rechazo de devolución posterior y remisión del nuevo ciclo del Consejo; no se relajaron validaciones de producción para hacerlas pasar.

Los puntos de entrada de interfaz usan ahora las baterías de perfiles actualizadas. Los guiones históricos `regression-ui.mjs`/`regression-completion-ui.mjs` no son la batería canónica: sus selectores y recorridos anteriores fueron sustituidos por las pruebas de los perfiles ya revisados. Los perfiles restantes seguirán recibiendo su revisión manual posterior, como indicó el usuario.

## Validación técnica

- **12 baterías aprobadas, 270 comprobaciones y 6 casos no aplicables**, ejecutadas secuencialmente sin capturas. [Reporte global final](evidencias/2026-11-13T05-08-33-144Z-validacion-actual/reporte.json).
- Incluye **45 comprobaciones** de los recorridos de Vinculación y Comité; siete específicas del Asistente del Consejo: respaldos/permisos, indicadores, prioridades, expediente, límites, envío único e Histórico. Se verifica que el Consejo no reciba el expediente antes de la remisión y sí lo reciba después.
- Compilación frontend/backend y lint sin errores. Persisten advertencias existentes de lint y tamaño del paquete.
- Se actualizaron fechas de VIE a valores relativos al día real de Costa Rica. Las primeras ejecuciones fallidas se conservan como trazabilidad de pruebas obsoletas y su corrección, sin presentar esos intentos como aprobación.
- Desarrollo: [reinicio completado](evidencias/2026-11-13T05-11-35-888Z-reinicio-desarrollo/reporte.json). Pruebas: [reinicio final tras aprobar](evidencias/2026-11-13T05-09-32-752Z-reinicio-pruebas/reporte.json).
- [Comprobación de datos limpios](evidencias/2026-11-13T05-13-22-213Z-datos-limpios/reporte.json): en cada base quedan exactamente **16 propuestas nuevas**, una convocatoria, tres evaluadores activos y 16 documentos adjuntos; **0 propuestas anteriores y 0 expedientes avanzados sin PI/certificación aplicable**.

Consulte [DATOS-DE-PRUEBA.md](DATOS-DE-PRUEBA.md) para localizar cada escenario por código. Los identificadores de reporte usan UTC; la fecha local de esta revisión es 12/11/2026.

## Revisión manual

- [ ] Abrir las cuatro tarjetas y verificar sus filtros y conteos.
- [ ] Revisar prioridades y su criterio de antigüedad.
- [ ] Consultar el expediente completo, nota, fundamento, oficio y PI, y volver a la misma preparación.
- [ ] Escribir una nota de remisión y comprobar contador/límite de 2.000 caracteres.
- [ ] Enviar al Consejo y consultar fecha, responsable y nota en Histórico; comprobar que no se puede repetir.
- [ ] Probar con los 16 escenarios limpios y confirmar que cada perfil reciba los casos de su ámbito y fase.
