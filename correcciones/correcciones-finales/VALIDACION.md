# Validación de la revisión VIE

**Fecha local:** 11 de noviembre de 2026. **Base del trabajo:** `master`, desde `6b8a6db`. La aceptación manual continúa pendiente.

> **Ajuste posterior:** la validación vigente de presupuesto, calendario y límites de actividades está en [AJUSTES-CREAR-CONVOCATORIA.md](AJUSTES-CREAR-CONVOCATORIA.md) y [VIGENCIA-PRESUPUESTO-Y-ACTIVIDADES.md](VIGENCIA-PRESUPUESTO-Y-ACTIVIDADES.md). La tabla «entrega inicial» conserva capturas; la **ejecución vigente** es **14 PASA** ([reporte](evidencias/2026-11-12T00-10-29-457Z-vie-publicacion/reporte.json), sin capturas) más **15 PASA** en requisitos ([reporte](evidencias/2026-11-12T00-18-28-168Z-requisitos-convocatoria/reporte.json)).

## Ejecuciones finales (entrega inicial con capturas)

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| VIE Publicación · navegador y API | **11 PASA**, sin errores de página registrados | [Reporte](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/reporte.json) |
| Regresión API existente | **33 PASA** | [Reporte](../evidencias/2026-11-11T22-28-36-052Z-regresion-api/reporte.json) |
| Recorridos completos de aprobación/rechazo | **72 PASA y 6 NO APLICA** después del rechazo de aval | [Reporte](../evidencias/2026-11-11T22-36-58-865Z-linea-base-api/reporte.json) |
| Batería heredada de integración Ian | **6 PASA, 2 FALLA** del investigador, descritos abajo | [Reporte](../evidencias/2026-11-11T22-35-02-540Z-merge-ian/reporte.json) |
| Compilación | PASA: backend TypeScript y frontend TypeScript/Vite | `pnpm build` |
| Lint frontend | Sin errores; **17 advertencias** de Fast Refresh y sincronización de estado en efectos, incluidos los filtros/rutas | `pnpm --filter sistema-vie-frontend lint` |
| Scripts de instalación/desinstalación | **12 PASA** con dobles de prueba; no se desinstaló el proyecto | `node scripts/test-lifecycle.mjs` |
| Sintaxis y formato | PASA | `node --check` de ambas regresiones y `git diff --check` |

Vite conserva un aviso por tamaño del bloque JavaScript. No se presenta como una compilación sin advertencias.

## Qué se comprobó

- Chromium con **idioma del navegador `en-US`**: errores propios en español y ausencia de eventos de validación nativa al enviar el acceso vacío.
- Errores señalados con texto, `aria-invalid`, descripción asociada y foco; fechas inexistentes y secuencias incoherentes bloqueadas antes de guardar.
- Creación y edición en rutas propias, guardado/relectura reales y conservación de IDs de actividades sin mostrarlos en la interfaz.
- Fechas `DD-MM-AAAA` con tamaño calculado de al menos **16 px** en revisión; móvil de **390 px** sin desbordamiento y sin menú de una pantalla completa.
- Confirmación/cancelación de publicación; confirmación de cierre y eliminación con persistencia consultada en API.
- Filtros combinados con limpieza y plegado independientes.
- Cierres próximos incluyen el día actual de Costa Rica; excluyen vencidas, borradores y cerradas. La lista de este escenario se acota a registros reales de la ejecución para aislarla de fixtures de pruebas anteriores.
- Intento de publicar un cronograma inválido: bloqueo en interfaz y rechazo transaccional en API; el estado permanece borrador.
- Acceso a histórico/notificaciones, filtros separados y formato de fecha/hora local.
- Un investigador puede consultar, pero las rutas nuevas no le permiten editar ni publicar.
- Respuesta de servicio `503` sin JSON simulada: se muestra mensaje en español.

El reloj del navegador se fijó al **11-11-2026, 23:59 en Costa Rica** para verificar el límite del día sin depender de la hora de ejecución.

Se usaron API propia y **`fondos_vie_test` en el puerto 55432**. Se aplicaron las migraciones existentes 009 y 010 que faltaban en ese perfil. No se cambiaron el esquema ni las propuestas de desarrollo para esta entrega. Los fixtures quedan identificados en los reportes; sus nombres incluyen una marca de ejecución para aislar las pruebas.

## Capturas revisadas

- [Errores del acceso](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/01-acceso-validacion-espanol.png).
- [Errores del formulario](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/02-campos-invalidos.png).
- [Revisión de escritorio](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/03-revision-escritorio.png).
- [Revisión móvil](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/04-revision-movil.png).
- [Cronograma móvil](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/04b-cronograma-movil.png).
- [Confirmación de eliminación](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/05-confirmacion-eliminacion.png).
- [Filtros independientes](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/06-filtros-independientes.png).
- [Cierres próximos](evidencias/2026-11-11T22-39-03-667Z-vie-publicacion/07-inicio-cierres-proximos.png).

Se inspeccionaron visualmente capturas de escritorio y móvil además de las aserciones automáticas. Los reportes anteriores se conservan como diagnóstico; la tabla indica la ejecución final.

## Dos casos heredados pendientes del investigador

1. La regresión busca el nombre accesible antiguo **“Titular de horas CONS (si aplica)”**. La pantalla actual identifica el control como **“Titular de horas CONS, persona TEC 1”**.
2. Otra regresión intenta saltar a objetivos sin completar pasos anteriores. La navegación por pasos incorporada en `37a7a45` lo bloquea. La prueba necesita una preparación acorde con ese recorrido.

Estos cambios ya están en la base de `master`; esta entrega no modifica los campos CONS ni el bloqueo de pasos para forzar un resultado positivo. Se requiere adaptar y ejecutar esos recorridos en la revisión de **Persona Investigadora Coordinadora**. Por ello **no se declara aprobada la batería global ni el verificador integral del instalador**.

## Repetición de esta revisión

```bash
./instalar.sh --pruebas
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:vie-final
```

Completar después [REVISION-MANUAL.md](REVISION-MANUAL.md). Esta revisión no equivale a una certificación completa de WCAG.
