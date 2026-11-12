# Ajustes posteriores · Crear y editar convocatorias

**Fecha:** 11 de noviembre de 2026. **Sustento:** indicaciones del usuario durante la revisión manual.

## Comportamiento vigente

| Tema | Corrección |
| --- | --- |
| Presupuesto | El campo se llama **Presupuesto estimado (₡)**, sin “opcional”. **Histórico de esta nota:** vacío → `NULL` y `0` → ₡0. **Vigente ahora:** presupuesto **obligatorio** al guardar (cero o monto); vacío = error «Indefinido». Ver [VIGENCIA-PRESUPUESTO-Y-ACTIVIDADES.md](VIGENCIA-PRESUPUESTO-Y-ACTIVIDADES.md). |
| Fechas | Se recupera el componente **DateField** ya utilizado en el proyecto: control nativo de fecha, escritura por segmentos y calendario. Se añade el botón **Calendario**, una pista fija día/mes/año y los errores en español. La API conserva las fechas en ISO. |
| Próximas a cerrar | Publicadas que cierran **hoy o dentro de 30 días**, incluidos ambos extremos. Las vencidas y las que cierran en 31 días quedan fuera. |
| Actividades | Inicio y fin deben quedar **entre la apertura y el cierre de la convocatoria**, inclusive. Además, el fin de una actividad no puede ser anterior a su inicio. Se comprueba al crear, editar, agregar una actividad y publicar/reactivar. |
| Cambio de período | Acortar las fechas de una convocatoria también vuelve a validar sus actividades existentes. Si alguna queda fuera, se rechaza toda la edición; no se guardan cambios parciales. |

**Esta regla de actividades sustituye la interpretación anterior que permitía actividades posteriores al cierre de recepción.** Se aplica por indicación explícita del usuario para el comportamiento actual del prototipo. Los informes anteriores conservan el resultado histórico de la versión que se probó entonces.

No se modifica automáticamente información histórica ni se requiere una migración. Un borrador con actividades fuera del intervalo debe corregirse antes de guardarlo o publicarlo.

## Validación sin imágenes

La regresión de VIE deja de generar capturas y guarda exclusivamente el reporte de texto/JSON. Se verificaron el calendario nativo, sus límites, los montos vacío/cero y los límites temporales, incluido crear una convocatoria de 2000 con actividades de 2004.

- **14 comprobaciones VIE PASA:** [reporte](evidencias/2026-11-11T23-18-24-279Z-vie-publicacion/reporte.json).
- Rechazo de actividades anteriores a la apertura y posteriores al cierre, tanto mediante edición completa como mediante la ruta individual.
- Conservación del nombre, período y actividades tras una edición rechazada.
- Aceptación de actividades exactamente en los límites del período.
- Presupuesto vacío `NULL`, cero explícito `0` y presentación “No definido”.

La compilación pasó; lint no presentó errores y mantiene las advertencias de Fast Refresh y sincronización de estado ya registradas. **33 comprobaciones API PASA** ([reporte](../evidencias/2026-11-11T23-20-58-197Z-regresion-api/reporte.json)); **72 PASA y 6 NO APLICA** en los recorridos completos de aprobación y rechazo ([reporte](../evidencias/2026-11-11T23-20-59-356Z-linea-base-api/reporte.json)).

## Nueva comprobación manual

Las marcas que el usuario ya hizo en [REVISION-MANUAL.md](REVISION-MANUAL.md) se conservan. Estas casillas corresponden únicamente a los ajustes posteriores:

- [ ] Comprobar el significado del presupuesto vacío y del valor cero.
- [ ] Escribir fechas usando el control asistido y seleccionar otra desde el calendario.
- [ ] Intentar guardar una actividad fuera del período; comprobar el mensaje y corregirla.
- [ ] Acortar el cierre de un borrador; verificar que no quedan actividades fuera del nuevo rango.
- [ ] Comprobar que un cierre a 30 días aparece como próximo y uno a 31 días no.

**Responsable:** ____________________ · **Fecha:** ____________________

> Actualización posterior: [presupuesto obligatorio, vigencia y actividades](VIGENCIA-PRESUPUESTO-Y-ACTIVIDADES.md). La aceptación de presupuesto vacío descrita arriba corresponde a la versión anterior.
