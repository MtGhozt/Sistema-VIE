# Estado de revisión · 31 de octubre de 2026

> **Código revisado:** correcciones funcionales hasta `bbf2770`; scripts y README en `ac656c2`.  
> **Resultado:** compilación y regresiones descritas abajo correctas. **No equivale a aceptación final del usuario ni a resolución de todas las decisiones institucionales.**

## Cómo revisar ahora

```bash
./instalar.sh --pruebas --verificar
DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm dev
```

Abrir `http://localhost:5173`. Usar las cuentas demo por rol y completar los espacios de [VALIDACION-DEL-FLUJO.md](VALIDACION-DEL-FLUJO.md). Los datos de pruebas se conservan y pueden identificarse por sus títulos/códigos de regresión.

## Evidencia ejecutada

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
| GEN-01 | Decisión D02 | La matriz de visibilidad histórica por dependencia/asignación sigue abierta; no se impuso una política nueva. |
| GEN-02 | Parcial | Escala de lectura, adaptación móvil, estados traducidos y capturas verificadas; falta revisión manual completa con zoom/lector de pantalla. |
| GEN-03 | Implementado | Avisos de BD por destinatario, lectura persistida y contexto sin arreglo de ejemplo. Validación de aislamiento en API. |
| GEN-04 | Decisión D06 | Archivos locales identificados como locales; no se finge carga ni adjuntos. Binarios, almacenamiento y PDF pendientes de alcance. |
| INV-01 | Implementado | CRUD de equipo TEC/externo y horas; API verifica nombres del catálogo, IDs propios y relectura; navegador prueba alta externa. |
| INV-02 | Implementado con límite documental | Textos/agregados se guardan, cambios vacíos se conservan y no se anuncia autoguardado ficticio. Archivos locales quedan fuera por D06. |
| INV-03 | Parcial | Todos los bloques señalados tienen captura y persistencia, incluidos arte, plan, presupuesto, productos, resguardo y ética. Reglas condicionales/mínimos no transcritos siguen D10. |
| INV-04 | Implementado | Límite 500 palabras y 4–6 términos ES al enviar; guardar borrador incompleto sigue permitido. No se agregaron límites arbitrarios a otros campos. |
| INV-05 | Implementado | Campos ES/EN separados; PATCH parcial no borra el idioma omitido y el detalle no suplanta términos vacíos con demo. |
| INV-06 | Parcial | Lectura mejorada y ausencia de adjuntos reales explícita; consulta binaria pendiente D06. |
| FLU-01 | Parcial | Rol, borrador, cierre, envío concurrente, aval previo a comunicación, checklist VIE y notificación con resolución protegidos. Matriz completa de precondiciones de etapa sigue D04. |
| VIN-01 | Implementado | Recuperación de dictamen propio y emisión con contrato de PI; no se insertan análisis IoT por defecto. No se añadió un borrador de dictamen nuevo. |
| CTA-01 | Implementado | Portal elimina el solapamiento observado; muestreo de puntos, viewport, foco y Escape correctos en 1440×900 y 390×844. |
| CTA-02 | Decisión D03 | Se conserva la devolución; queda acordar edición/subsanación, retorno y reapertura. Seguir consultando no se trata por sí solo como defecto. |
| CTE-01 | Parcial | Guardado/relectura real de puntajes y motivos por usuario/instancia/versión. Completar rúbrica oficial y consolidación sigue D05. |
| CON-01 | Parcial | Aval y fundamento reales, sin sobrescritura de decisión emitida. Acordar matriz institucional completa y reconsideración en D03/D04. |
| DIR-01 | Parcial | Comunicación exige aval aprobado y registra la comunicación; vistas previas no implementadas están deshabilitadas. Archivo de oficio pendiente D06. |
| VIE-01 | Implementado | Observación recuperable en detalle y aviso real al coordinador. Respuesta/subsanación sigue D03. |
| VIE-02 | Implementado | Seis controles editables y revisión persistida; remisión exige guardar la verificación completa. No hay seis «Verificado» estáticos. |
| CIE-01 | Implementado | `texto` llega al servidor; error conserva modal/fundamento. API conserva la resolución con fundamento humano. |
| CIE-02 | Parcial | Guardado real y modales corregidos; aprobación por rúbrica completa no se certifica mientras siga pendiente D05. |
| CIE-03 | Implementado con alcance | Avisos y comunicación únicos bajo concurrencia, datos propios y `notificada` recuperable. PDF y rechazo de aval mantienen D06/D11. |
| ADM-01 | Decisión D07 | Administración ampliada requiere acuerdo de alcance; no se implementó un motor genérico de formularios. |
| ADM-02 | Parcial | Identidad admin se mantiene y controles de cierre/precondiciones corregidas aplican también al admin. Matriz completa y excepciones siguen D04/D09. |
| ADI-01 | Implementado | Detalle, equipo, plan, fuentes, productos, ética, observaciones y fechas proceden del expediente; borrador nuevo sin datos de ejemplo. |
| ADI-02 | Implementado | Vista admin filtra por el rol solicitado conservando identidad; un rol ordinario no puede solicitar vista privilegiada. |
| ADI-03 | Parcial | URL de Administración restringida y operaciones API por roles existentes; ámbitos por escuela/asignación siguen D02. No se certifica autenticación de producción. |
| ADI-04 | Parcial | Se eliminó promedio 80 por defecto y recomendación constante; servidor calcula los criterios del subconjunto existente. Política oficial completa sigue D05. |
| ADI-05 | Implementado | Declaración no preaceptada, persistida y exigida en servidor para ambas rutas de envío. |
| ADI-06 | Parcial | Etapa real reemplaza porcentaje arbitrario en listado; cifras simuladas se identifican y borrador ya no muestra «Completa» en todos los pasos. Revisión humana restante. |
| ADI-07 | Implementado | Editor de datos/hitos; añadir/editar/quitar cronograma en transacción, con rollback de hito inválido/ajeno. |
| ADI-08 | Implementado | Paneles se reinician por clave de expediente; claves React directas y nombres de controles estables. |
| ADI-09 | Implementado en trazabilidad | Devoluciones y revisiones completas posteriores crean ciclos nuevos; no sobrescriben devoluciones previas. La subsanación de negocio sigue D03. |

## INC-01 · Numeración

La colisión ahora devuelve error controlado y revierte la creación entera; la API sigue disponible y no queda propuesta temporal. **La estrategia definitiva anual/global sigue pendiente D01**: no se cambió por suposición. En una base recién sembrada todavía puede rechazarse una creación cuyo código coincida con uno histórico; este hallazgo no se declara resuelto completamente.

## Qué no queda aprobado automáticamente

- Las casillas V0–V6 y la aceptación final del usuario.
- Rúbrica oficial íntegra, cinco identidades evaluadoras/consolidación y decisión académica definitiva.
- Subsanación/reapertura, ámbitos históricos y excepciones administrativas no acordados.
- Carga de binarios y generación real de PDF.
- Auditoría visual/accesible exhaustiva ni funcionamiento de todas las combinaciones posibles.

La próxima revisión del equipo puede realizarse ya con los scripts. Para cambios de política, registrar primero el acuerdo en COSAS-A-DISCUTIR y luego su implementación/prueba. No se hizo merge, push, publicación ni migración sobre la base de desarrollo del usuario.
