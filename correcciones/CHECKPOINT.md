# Checkpoint · Implementación pausada por el usuario

> **Fecha de referencia:** 30 de octubre de 2026, Costa Rica.  
> **Motivo:** solicitud explícita del usuario de detenerse y continuar más adelante.  
> **Rama:** `correcciones/implementacion`.  
> **Último commit funcional completo antes de la pausa:** `af59961`.  
> **Reanudación:** no continuar hasta que el usuario lo solicite.

## Estimación de avance

**Aproximadamente 50 % del alcance de implementación, con alrededor de 50 % pendiente.** Es una estimación de cobertura, no una medición de horas ni una certificación de correcciones verificadas. Hay hallazgos resueltos en código, otros parcialmente atendidos y decisiones del equipo pendientes.

Antes de este checkpoint hay 35 commits desde `956d609`, incluidos preparación, evidencia y documentación. El mínimo de 20 commits ya se supera, pero eso no mide el porcentaje de funcionalidad ni la aceptación de los 33 hallazgos.

La siguiente revisión a profundidad debe comenzar por **validar lo ya cambiado**, antes de añadir más funcionalidades: las pruebas API/Chromium existentes son principalmente de línea base y todavía no se han repetido como regresión sobre el conjunto nuevo.

## Implementado en código

- Errores asincrónicos controlados en Express; transacción para creación y actualización de borradores. Una colisión ya no debe dejar creación parcial ni terminar la API; falta comprobarlo en ejecución nueva.
- PATCH de keywords conserva el idioma omitido; campos vacíos pueden limpiarse.
- Contrato `texto` del CIE corregido; modales esperan el resultado y conservan el texto ante fallo.
- Portal de modales para sacar el diálogo del apilamiento de los paneles.
- Bandejas sin sustitución automática de API vacía/error por propuestas ficticias; paneles reinician estado al cambiar expediente.
- API de notificaciones por destinatario y lectura en BD; campana y página conectadas a datos reales.
- Consulta de equipo, documentos, observaciones e historial reales; retirada de plantilla demo del detalle.
- Textos oficiales, fechas y preguntas generales guardables; editores de arte, hoja de ruta, divulgación y keywords EN.
- Contador de palabras y límites explícitos al enviar; guardado parcial sin falsa afirmación de autoguardado/completitud.
- Equipo interno/externo, tipos de horas, participantes seleccionables y CRUD persistido.
- Presupuesto/fuentes, ética/permisos, actividades/riesgos/responsables y compromisos de productos con editores y persistencia normalizada.
- Declaración y dos compromisos de resguardo explícitos, sin aceptación por defecto; validación de declaración también al enviar desde detalle.
- Bloqueo transaccional de decisiones cerradas y notificación de resolución idempotente; recuperación del fundamento de aval y del estado notificada.

Consultar [IMPLEMENTACION.md](IMPLEMENTACION.md) para sustento por commit. **La columna de comprobación describe también pruebas previstas, no todas ejecutadas.** Ver distinción siguiente.

## Verificación efectivamente realizada

- Typecheck backend y/o frontend ejecutado en los bloques correspondientes de implementación; no equivale a prueba de persistencia ni navegador.
- La migración `001_compromisos_propuesta.sql` se aplicó **una vez** a `fondos_vie_test` y terminó correctamente.
- Los recorridos API/Chromium previos se conservan como línea base. Reprodujeron los fallos originales; **no certifican las correcciones posteriores**.
- Todavía no se ejecutó la regresión integral del nuevo formulario, la concurrencia, la recuperación tras recarga ni las capturas posteriores a los cambios.

## Cambios que quedaron en curso al interrumpir

`frontend/src/App.tsx` contiene una guardia de acceso a Administración por rol autenticado, y su fila de justificación está en la bitácora. Se conservan en el commit de checkpoint **como trabajo en curso, aún sin validación posterior a la interrupción**. No asumir que existe un commit funcional independiente `fix(acceso)` solo porque aparezca como título en la bitácora.

No se completan ni se marcan aceptaciones del usuario automáticamente.

## Pendientes principales

1. **Regresión inmediata:** compilar estado actual, aplicar migración 002 a la BD de pruebas y repetir migraciones para comprobar idempotencia; probar CRUD y rollback de cada agregado.
2. Ajustar los fixtures del script API: nuevos envíos requieren declaración explícita y 4–6 keywords ES. La línea base UI conserva una expectativa del rechazo CIE anterior que debe actualizarse para verificar la corrección y simular fallo de API sin resolver expedientes semilla.
3. Revisar concurrencia del guardado y envío de borradores, numeración y respuestas ante errores; la estrategia anual/global sigue pendiente. No asumir resuelta INC-01 solo por controlar el error.
4. Rúbricas por criterio, recuperación de dictamen PI, consolidación real y recomendación; hoy `save-rubric` sigue sin persistencia. Es un pendiente importante.
5. Devolución/subsanación y ciclos, checklist persistido VIE y dependencia efectiva entre instancias.
6. Filtro de vista administrativa y ámbitos de histórico; revisión completa de permisos y rutas.
7. Edición completa de convocatorias/hitos, indicadores/progreso, traducción de estados y legibilidad general.
8. Carga/consulta de binarios y generación/vista previa de oficios, según alcance acordado; actualmente solo se identifica claramente la selección local.
9. Comprobar que detalle y resumen final presentan todos los datos nuevos: fuentes, plan, compromisos y campos generales. No asumir cobertura total de detalle por tener persistencia del editor.
10. Revisar y registrar las decisiones de [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md), sin convertir propuestas en reglas aceptadas.

## Preparación para retomar

```bash
git status --short
git log -5 --oneline
docker compose -p vie-baseline -f docker-compose.test.yml up -d --wait
DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm db:migrate
pnpm build
pnpm --filter sistema-vie-frontend lint
```

Después preparar y ejecutar las pruebas de regresión descritas. No correr los scripts de línea base antiguos y tomar sus fallos esperados como fallos nuevos, ni sus éxitos parciales como aceptación final.

La BD de desarrollo no recibió migraciones durante esta implementación. Para ejecutarla con el código nuevo necesita aplicar las migraciones de forma explícita y sin borrar su volumen. No se solicitó ni se realizó despliegue, merge o publicación.
