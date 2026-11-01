# Estado de revisión · 31 de octubre de 2026

> **Actualización D01–D04:** acuerdos del usuario implementados; ver [DECISIONES-D01-D04.md](DECISIONES-D01-D04.md). D05–D11 continúan pendientes.
> **Base anterior:** correcciones funcionales hasta `bbf2770`; scripts y README en `ac656c2`.
> **Resultado:** compilación y regresiones descritas abajo correctas. **No equivale a aceptación final del usuario ni a resolución de todas las decisiones institucionales.**

## Verificación actual de D01–D04

Implementación `728b813`; regresiones e instalador `e6201a9`. [Detalle y reportes](evidencias/D01-D04-validacion.md).

| Verificación | Resultado actual |
| --- | --- |
| Build e instalación de pruebas con verificación | Correctos |
| Regresión API existente / D01–D04 | **33 / 14 correctas** |
| Navegador Chromium | **11 correctas**, sin errores JS de página |
| Circuito API: aprobación, rechazo CIE y rechazo del Consejo | **63 correctas**; 6 acciones posteriores al rechazo de aval no aplican |
| Scripts Bash | **12 correctas** |
| Lint | Sin errores; **10 advertencias** |

Las migraciones 003/004 se aplicaron y verificaron únicamente en la BD aislada; no se modificó la base de desarrollo. D01–D04 están implementadas y pendientes de aceptación humana. Los datos históricos no se renumeran ni reciben certificaciones inventadas. La evidencia anterior se conserva abajo como referencia, no como descripción de los pendientes actuales.

## Cómo revisar ahora

```bash
./instalar.sh --pruebas --verificar
DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm dev
```

Abrir `http://localhost:5173`. Usar las cuentas demo por rol y completar los espacios de [VALIDACION-DEL-FLUJO.md](VALIDACION-DEL-FLUJO.md). Los datos de pruebas se conservan y pueden identificarse por sus títulos/códigos de regresión.

## Evidencia anterior (antes de D01–D04)

| Verificación | Resultado | Evidencia / límite |
| --- | --- | --- |
| Instalación real `--pruebas --verificar` | Salida 0 | Dependencias congeladas por lockfile, build, Docker healthy, migraciones, Chromium y regresiones. |
| Regresión API | **33 comprobaciones correctas** | [Reporte final](evidencias/2026-10-31T19-36-48-431Z-regresion-api/reporte.json); incluye guardado/relectura, rollback, concurrencia, PI, checklist, avales y destinatarios. |
| Regresión navegador | **9 comprobaciones correctas**, sin errores JS de página | [Reporte y capturas](evidencias/2026-10-31T19-31-19-330Z-regresion-ui/reporte.json). Chromium real; error HTTP 500 CIE simulado para probar conservación del texto. |
| Scripts Bash | **12 comprobaciones correctas** | `node scripts/test-lifecycle.mjs`, repositorio temporal con rutas que contienen espacios y dobles de Docker/pnpm; verifica ayuda, flags, orden, simulación, borrado acotado y purga explícita. |
| Desinstalación real no destructiva | Salida 0 | `./desinstalar.sh --pruebas --conservar-dependencias` retira contenedor y red, conserva volumen. |
| Reinstalación real | Salida 0 | `./instalar.sh --pruebas`; PostgreSQL conserva **234 propuestas** y **2 migraciones**. No se probó purga real ni se retiraron herramientas compartidas. |
| Lint frontend | Salida 0, **11 advertencias** | Fast Refresh y actualizaciones de estado desde efectos; no se presenta como lint sin advertencias. Las advertencias nuevas de dependencias de hooks se corrigieron. |
| Migraciones | Aplicadas y repetidas sin reinicializar volumen | `001_compromisos_propuesta.sql` y `002_precision_plan.sql`; instalación nueva incorpora también esos campos en el esquema inicial. |

La primera regresión de esta reanudación encontró un error en el año presupuestario y la prueba de rúbrica encontró un error SQL de tipado. Sus reportes fallidos se conservaron; los reportes finales anteriores corresponden a las correcciones posteriores. Los log de conflictos UNIQUE en pruebas negativas son errores provocados para verificar rollback y disponibilidad de la API, no fallos de esa ejecución final.

## Trazabilidad de los 33 hallazgos originales

**Implementado** se refiere al cambio técnico y a las comprobaciones indicadas, sin completar casillas del usuario. **Parcial** significa que una parte está corregida pero queda validación o una decisión del equipo. Las decisiones se mantienen en [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md).

| ID | Estado técnico | Resultado y pendiente |
| --- | --- | --- |
| GEN-01 | Implementado D02 | Propiedad/equipo, escuela/asignación y admin transversal; sin borradores ajenos. API protege consultas, filtros, detalles y evaluación. |
| GEN-02 | Parcial | Escala de lectura, adaptación móvil, estados traducidos y capturas verificadas; falta revisión manual completa con zoom/lector de pantalla. |
| GEN-03 | Implementado | Avisos de BD por destinatario, lectura persistida y contexto sin arreglo de ejemplo. Validación de aislamiento en API. |
| GEN-04 | Decisión D06 | Archivos locales identificados como locales; no se finge carga ni adjuntos. Binarios, almacenamiento y PDF pendientes de alcance. |
| INV-01 | Implementado | CRUD de equipo TEC/externo y horas; API verifica nombres del catálogo, IDs propios y relectura; navegador prueba alta externa. |
| INV-02 | Implementado con límite documental | Textos/agregados se guardan, cambios vacíos se conservan y no se anuncia autoguardado ficticio. Archivos locales quedan fuera por D06. |
| INV-03 | Parcial | Todos los bloques señalados tienen captura y persistencia, incluidos arte, plan, presupuesto, productos, resguardo y ética. Reglas condicionales/mínimos no transcritos siguen D10. |
| INV-04 | Implementado | Límite 500 palabras y 4–6 términos ES al enviar; guardar borrador incompleto sigue permitido. No se agregaron límites arbitrarios a otros campos. |
| INV-05 | Implementado | Campos ES/EN separados; PATCH parcial no borra el idioma omitido y el detalle no suplanta términos vacíos con demo. |
| INV-06 | Parcial | Lectura mejorada y ausencia de adjuntos reales explícita; consulta binaria pendiente D06. |
| FLU-01 | Parcial | Rol, borrador, cierre, envío concurrente, aval previo a comunicación, checklist VIE y notificación con resolución protegidos. PI obligatoria y subsanación protegidas según D03/D04; reglas restantes del equipo conservan su alcance pendiente. |
| VIN-01 | Implementado | Recuperación de dictamen propio y emisión con contrato de PI; no se insertan análisis IoT por defecto. No se añadió un borrador de dictamen nuevo. |
| CTA-01 | Implementado | Portal elimina el solapamiento observado; muestreo de puntos, viewport, foco y Escape correctos en 1440×900 y 390×844. |
| CTA-02 | Implementado D03 | Selección de secciones, edición restringida, respuesta y reenvío a la misma instancia; decisiones cerradas protegidas. Excepciones D09 pendientes. |
| CTE-01 | Parcial | Guardado/relectura real de puntajes y motivos por usuario/instancia/versión. Completar rúbrica oficial y consolidación sigue D05. |
| CON-01 | Parcial | Aval y fundamento reales, sin sobrescritura de decisión emitida. No se supera un rechazo previo; comunicación/reconsideración y excepciones siguen D11/D09. |
| DIR-01 | Parcial | Comunicación exige aval aprobado y registra la comunicación; vistas previas no implementadas están deshabilitadas. Archivo de oficio pendiente D06. |
| VIE-01 | Implementado | Observación recuperable en detalle y aviso real al coordinador. Devolución formal activa subsanación, respuesta y retorno a VIE con nueva verificación; comentarios informativos no devuelven. |
| VIE-02 | Implementado | Seis controles editables y revisión persistida; remisión exige guardar la verificación completa. No hay seis «Verificado» estáticos. |
| CIE-01 | Implementado | `texto` llega al servidor; error conserva modal/fundamento. API conserva la resolución con fundamento humano. |
| CIE-02 | Parcial | Guardado real y modales corregidos; aprobación por rúbrica completa no se certifica mientras siga pendiente D05. |
| CIE-03 | Implementado con alcance | Avisos y comunicación únicos bajo concurrencia, datos propios y `notificada` recuperable. PDF y rechazo de aval mantienen D06/D11. |
| ADM-01 | Decisión D07 | Administración ampliada requiere acuerdo de alcance; no se implementó un motor genérico de formularios. |
| ADM-02 | Parcial | Identidad admin se mantiene y controles de cierre/precondiciones corregidas aplican también al admin. No puede omitir PI ni subsanación; excepciones siguen D09. |
| ADI-01 | Implementado | Detalle, equipo, plan, fuentes, productos, ética, observaciones y fechas proceden del expediente; borrador nuevo sin datos de ejemplo. |
| ADI-02 | Implementado | Vista admin filtra por el rol solicitado conservando identidad; un rol ordinario no puede solicitar vista privilegiada. |
| ADI-03 | Parcial | URL de Administración restringida y operaciones API por roles existentes; ámbitos por escuela/asignación implementados según D02. No se certifica autenticación de producción. |
| ADI-04 | Parcial | Se eliminó promedio 80 por defecto y recomendación constante; servidor calcula los criterios del subconjunto existente. Política oficial completa sigue D05. |
| ADI-05 | Implementado | Declaración no preaceptada, persistida y exigida en servidor para ambas rutas de envío. |
| ADI-06 | Parcial | Etapa real reemplaza porcentaje arbitrario en listado; cifras simuladas se identifican y borrador ya no muestra «Completa» en todos los pasos. Revisión humana restante. |
| ADI-07 | Implementado | Editor de datos/hitos; añadir/editar/quitar cronograma en transacción, con rollback de hito inválido/ajeno. |
| ADI-08 | Implementado | Paneles se reinician por clave de expediente; claves React directas y nombres de controles estables. |
| ADI-09 | Implementado D03 | Ciclos, secciones autorizadas, respuestas, avisos y destino de retorno persistidos; reenvío concurrente genera un solo evento. |

## INC-01 · Numeración

**Implementado D01:** contador anual transaccional independiente del PK, código automático e inmutable y `UNIQUE` de código. Las nuevas asignaciones respetan los mayores sufijos históricos de cada año; una eliminación no reinicia el contador. Las pruebas cubren seis creaciones simultáneas, cambio de año y conservación de códigos existentes.

## Qué no queda aprobado automáticamente

- Las casillas V0–V6 y la aceptación final del usuario.
- Rúbrica oficial íntegra, cinco identidades evaluadoras/consolidación y decisión académica definitiva.
- Aceptación humana de D01–D04 y excepciones de reapertura administrativas (D09).
- Carga de binarios y generación real de PDF.
- Auditoría visual/accesible exhaustiva ni funcionamiento de todas las combinaciones posibles.

La próxima revisión del equipo puede realizarse ya con los scripts. Para cambios de política, registrar primero el acuerdo en COSAS-A-DISCUTIR y luego su implementación/prueba. No se hizo merge, push, publicación ni migración sobre la base de desarrollo del usuario.
