# C02 · Primera línea base con PostgreSQL

**Fecha local:** 30 de octubre de 2026, aproximadamente 21:30, Costa Rica. Los nombres de las carpetas usan UTC (31 de octubre, 03:30).  
**Base de aplicación:** `1c86c33`, con la corrección del adaptador C01 ya incluida. La segunda ejecución solo añade al script la distinción entre rama terminada y prueba bloqueada.

## Entorno y comprobaciones

- Docker accesible; `docker compose -p vie-baseline -f docker-compose.test.yml up -d --wait` completado con PostgreSQL healthy.
- Base `fondos_vie_test`, puerto local 55432 y volumen `vie-baseline_vie_test_pgdata`. No se utilizó la base de desarrollo.
- Cada ejecución arrancó y detuvo su propia API compilada en puerto libre. La base de pruebas queda disponible para inspección; no se borraron los expedientes.
- `pnpm build`: backend y frontend compilan, salida 0.
- `node --check scripts/baseline-flow.mjs` y `git diff --check`: sin errores.

## Primera ejecución: fallo conservado

[Reporte original](2026-10-31T03-30-24-422Z-linea-base-api/reporte.json) · [error de API](2026-10-31T03-30-24-422Z-linea-base-api/api.txt).

**52 PASA, 1 FALLA, 13 BLOQUEADO.** Las ramas de aprobación y rechazo CIE llegaron a comunicación e histórico. Al crear la tercera propuesta, el ID 19 generó el código `PROP-2026-019`, ya asignado al expediente semilla ID 13. PostgreSQL rechazó el UPDATE con `23505`; la promesa rechazada terminó el proceso de API. El INSERT previo quedó como borrador con código temporal.

### INC-01 · Código duplicado y creación parcial

- **Estado:** nuevo defecto confirmado; pendiente de corrección.
- **Prioridad propuesta:** P0, por interrumpir la API y dejar una creación parcial.
- **Sustento:** CU2 exige crear propuestas y CU5 consultarlas de forma inequívoca; `propuesta.codigo` tiene restricción UNIQUE en `database/DisennoDB.sql`.
- **Causa comprobada:** `propuestas.ts` construye el código final a partir del ID numérico y el año; los códigos históricos del seed no coinciden necesariamente con sus IDs.
- **Corrección a preparar:** conservar el formato establecido `PROP-año-consecutivo`, asignar el consecutivo de manera única bajo concurrencia, guardar la propuesta y sus relaciones en transacción y responder con un error controlado si falla. No renombrar expedientes históricos ni resetear secuencias para esconder el fallo.
- **Prueba exigida:** semilla original más creación que atraviese todos sus consecutivos, creación concurrente y fallo de escritura sin propuesta parcial ni caída del proceso.
- **Discusión necesaria:** no se ha encontrado una política documental para el alcance del consecutivo (por año o global). Confirmarla antes de sustituir la estrategia de numeración; el requisito de unicidad y atomicidad ya está sustentado.

## Segunda ejecución: recorridos API completados

[Reporte](2026-10-31T03-30-53-003Z-linea-base-api/reporte.json) · [salida de API](2026-10-31T03-30-53-003Z-linea-base-api/api.txt).

**61 PASA, 5 NO APLICA; salida 0.** Nuevos expedientes con IDs 20, 21 y 22 no chocaron con esos códigos semilla. Esto permite cubrir las ramas restantes, **no corrige INC-01 ni garantiza que la siguiente creación funcione**.

Se distinguieron en el script las acciones posteriores a un rechazo de aval: se registran como NO APLICA en ese recorrido, en lugar de BLOQUEADO. La clasificación describe la rama elegida por la prueba; no cambia ni demuestra que el backend impida forzar esas acciones.

## Consulta de persistencia posterior

Consulta ejecutada sobre la base de pruebas:

```sql
SELECT p.id_propuesta, p.codigo, p.estado_actual, rc.resultado, rc.fundamento,
  (SELECT count(*) FROM evaluacion e WHERE e.id_propuesta=p.id_propuesta) AS evaluaciones,
  (SELECT count(*) FROM notificacion n WHERE n.id_propuesta=p.id_propuesta) AS avisos
FROM propuesta p
LEFT JOIN resolucion_cie rc ON rc.id_propuesta=p.id_propuesta
WHERE p.titulo LIKE 'Baseline %'
ORDER BY p.id_propuesta;
```

| ID | Código | Estado | Resolución CIE | Evaluaciones | Avisos |
| --- | --- | --- | --- | --- | --- |
| 17 | PROP-2026-017 | aprobada | aprobada, fundamento de prueba conservado | 0 | 1 |
| 18 | PROP-2026-018 | rechazada | rechazada, fundamento de prueba conservado | 0 | 1 |
| 19 | TMP-2-1793417425814 | borrador | Sin resolución; creación parcial | 0 | 0 |
| 20 | PROP-2026-020 | aprobada | aprobada, fundamento de prueba conservado | 0 | 1 |
| 21 | PROP-2026-021 | rechazada | rechazada, fundamento de prueba conservado | 0 | 1 |
| 22 | PROP-2026-022 | rechazada | Sin resolución CIE; rechazo de aval | 0 | 0 |

Los eventos `save-rubric` recibieron respuesta satisfactoria, pero **no existe ninguna fila de evaluación** de esos expedientes. Sigue abierto CTE-01. El script envía puntajes vacíos y notas consolidadas de prueba: los resultados PASA verifican disponibilidad del contrato y recorrido, no la validez académica ni la persistencia criterio a criterio.

## Alcance que permanece pendiente

- Navegador, los 17 pasos, superposiciones y accesibilidad manual: no ejecutados.
- Rechazo desde el frontend que utiliza `motivo`: no corregido ni validado por esta prueba API, que usa `texto`.
- Rúbricas completas, devolución y subsanación, documentos reales, avisos visibles, matriz de permisos, concurrencia e instalaciones/migraciones: requieren sus pruebas específicas.
- Las 37 pruebas manuales del registro no se marcan como aprobadas por estas 61 comprobaciones API parciales.
- V0 sigue pendiente del usuario. Antes de C03, revisar las políticas abiertas del plan y la numeración INC-01. No se modificaron reglas funcionales.
