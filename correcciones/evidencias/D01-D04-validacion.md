# Validación de D01–D04

**Fecha local:** 31 de octubre de 2026 · **Implementación:** `728b813` · **Pruebas:** `e6201a9`.

Las carpetas usan fecha UTC; por eso comienzan con `2026-11-01`. Solo se modificó `fondos_vie_test` en el puerto 55432, conservando su volumen. Las migraciones 003 y 004 no se aplicaron a la base de desarrollo.

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| `pnpm build` | Correcto | Backend TypeScript y frontend TypeScript/Vite. |
| `./instalar.sh --pruebas --verificar` | Salida 0 | Dependencias con lockfile, build, PostgreSQL healthy, migraciones y las tres baterías de regresión. |
| Regresión API existente | **33 PASA** | [Reporte final](2026-11-01T02-13-37-441Z-regresion-api/reporte.json). |
| Regresión D01–D04 | **14 PASA** | [Reporte final](2026-11-01T02-11-57-048Z-decisiones-d01-d04/reporte.json). |
| Regresión Chromium | **11 PASA**, sin errores JS de página | [Reporte y capturas finales](2026-11-01T02-11-58-484Z-regresion-ui/reporte.json). Incluye modal a 1440 y 390 px, URL por código y certificación → devolución → edición → respuesta → reenvío. |
| Tres ramas completas por API | **63 PASA**, 6 acciones no aplican | [Aprobación, rechazo CIE y rechazo del Consejo](2026-11-01T02-09-21-263Z-linea-base-api/reporte.json). Tras rechazo del Consejo no se fuerza una resolución CIE. |
| `node scripts/test-lifecycle.mjs` y `bash -n instalar.sh` | **12 PASA**, sintaxis correcta | Dobles de Docker/pnpm en directorio temporal; comprueba también la inclusión de `regression:decisions` en el instalador. |
| Lint frontend | Sin errores, **10 advertencias** | Fast Refresh y estado en efectos; se conservan como deuda pendiente del equipo. |
| `git diff --check` | Correcto | Sin errores de espacios en los cambios finales. |

## Cobertura específica

- **D01:** seis creaciones simultáneas, cambio de año, códigos históricos intactos, código inmutable y contador que no reutiliza el último número eliminado.
- **D02:** aislamiento entre escuelas, borradores ajenos, pertenencia al equipo, asignación expresa por rol, filtros y notas privadas por etapa. Un encabezado de rol no concede permisos ausentes en BD.
- **D03:** devolución con motivo/secciones, edición autorizada, respuesta obligatoria, validaciones de envío, ciclos sucesivos y reenvío concurrente único. Retorno a Comité/VIE, nueva verificación VIE y protección de decisiones/rechazos cerrados.
- **D04:** bloqueo sin evidencia en ambas ramas, fundamento/responsable/fecha de certificación, no sobrescritura de dictamen y certificación de un expediente antiguo sin alterar su documento ni retroceder de etapa. La pantalla no presume certificación por haber avanzado de etapa.

## Alcance y diagnóstico

Los recorridos principales de D01–D04 usan la API real. SQL prepara escenarios de escuela/asignación, eventos privados, legado y contador anual; no sustituye las transiciones del recorrido principal. Las pruebas antiguas de rutas usan certificaciones sintéticas para aislar sus casos; la batería específica comprueba la certificación real por API y navegador.

Se conservaron los reportes intermedios fallidos. Detectaron tipados SQL del contador/devolución, un selector accesible del motivo y una comparación de bandejas que ignoraba sus ámbitos distintos y `LIMIT 100`. Las capturas también motivaron el ajuste de las casillas del modal móvil. Los enlaces de la tabla corresponden a las comprobaciones finales corregidas.

Estos resultados no certifican la rúbrica oficial completa, consolidación de cinco evaluadores, D05–D11 ni accesibilidad exhaustiva. Las casillas de [aceptación humana](../DECISIONES-D01-D04.md) siguen vacías.
