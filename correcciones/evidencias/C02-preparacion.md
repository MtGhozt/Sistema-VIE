# C02 · Preparación de la línea base

Fecha: 30 de octubre de 2026 (Costa Rica). C02 **parcial**: infraestructura y recorrido API preparados; ejecución con BD y herramienta de navegador pendientes. No avanzar a cambios de negocio C03 sin V0.

## Sustento y alcance

C02 del plan y CU1–CU5: preparar evidencia reproducible, sin alterar reglas de la aplicación. `docker-compose.test.yml` separa volumen y puerto de desarrollo; `scripts/baseline-flow.mjs` exige una URL explícita cuya base sea `fondos_vie_test`, consulta su identidad y arranca su propia API compilada en un puerto libre. No reutiliza una API cuya base no pueda identificarse.

El script prepara cuentas de los 12 roles, consulta bandejas e intenta tres expedientes nuevos: aprobación, rechazo CIE y rechazo de Consejo. Conserva casos fallidos y bloqueados; no fuerza etapas por SQL y conserva IDs creados para inspección posterior. No borra datos automáticamente.

Las peticiones directas usan el contrato backend `texto`; **no reproducen** el defecto `motivo` del frontend. Tampoco certifican completitud, puntajes individuales, permisos, notificaciones visibles ni los 37 casos manuales completos. Eso permanece pendiente en el registro de validación.

## Preparación cuando Docker esté disponible

```bash
# No utiliza el compose ni el volumen de desarrollo.
docker compose -p vie-baseline -f docker-compose.test.yml up -d --wait
pnpm build
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm baseline:api
```

El script escribe fixtures exclusivamente en la BD de prueba; no ejecutar contra trabajo compartido. El volumen de prueba conserva los registros y los IDs se anotan en cada reporte. El seed solo se aplica inicialmente; no borrar el volumen para simular una migración.

Los reportes usan un identificador de ejecución UTC para evitar ambigüedad; la fecha de revisión humana se registra en Costa Rica. Antes de la aceptación, añadir el SHA, capturas y observaciones en `VALIDACION-DEL-FLUJO.md`.

## Evidencia disponible

- `node --check scripts/baseline-flow.mjs`: sintaxis correcta.
- Ejecución sin `TEST_DATABASE_URL`: salida 1 y reporte de **BLOQUEADO**, sin conexión ni escritura en BD. Es una comprobación de preparación, no un pase del flujo.
- Intento con nombre de BD de desarrollo: rechazado antes de conectar, salida 1. La falla corresponde a la configuración deliberadamente inválida; no es un fallo de la aplicación.
- [Reporte sin configuración](2026-10-31T03-08-31-866Z-linea-base-api/reporte.json) y [reporte de rechazo de BD no aislada](2026-10-31T03-09-10-901Z-linea-base-api/reporte.json).
- Docker: incluso fuera del sandbox no existe socket disponible en `/var/run/docker.sock`.
- No hay API local accesible en el puerto 3000, PostgreSQL local instalado ni navegador en las ubicaciones comprobadas.
- Recorrido de BD/API real, captura de fallos visuales y preparación del navegador: **pendientes por entorno**.

## Discusión V0 pendiente

No se introdujeron reglas del formulario. Antes de C03 se debe discutir la matriz de permisos, devolución/subsanación, PI condicional, criterio de consolidación, restricciones de remisión y alcance administrativo, según las fuentes citadas en el plan. Conservar los comportamientos establecidos cuando la documentación ya los define; discutir únicamente lo que no quede resuelto por esas fuentes.
