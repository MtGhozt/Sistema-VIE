# Errores al guardar y enviar propuestas

**Fecha:** 3 de noviembre de 2026, Costa Rica.
**Sustento:** solicitud del usuario de identificar el error o conflicto en el formulario de la Persona Investigadora Coordinadora; restricciones existentes del esquema y del flujo.

## Comportamiento implementado

- El motivo queda en un aviso persistente del formulario, además de la notificación temporal. El aviso recibe foco y distingue guardar, enviar y conflicto.
- Las palabras clave repetidas identifican **idioma y término**. Los términos de más de 100 caracteres y los títulos de más de 500 explican el límite existente en la base de datos.
- Las validaciones de equipo, plan, productos, presupuesto y ética identifican su sección. Los conflictos de datos conocidos se traducen a mensajes comprensibles.
- Antes de enviar se indica qué falta: abstract, declaración o número de términos ES; un resumen demasiado largo informa su cantidad de palabras.
- Se distinguen un formulario demasiado extenso, un archivo demasiado grande y una respuesta de servidor que no se pudo confirmar por un fallo de conexión.
- Si guardar funciona y enviar falla, se informa **que el borrador sí se guardó**, se muestra su código y se continúa editando ese mismo expediente. Reintentar el envío no crea otro borrador.
- El aviso se limpia al iniciar el siguiente intento. Los datos escritos permanecen disponibles para corregirlos.

No se requieren migraciones. Las reglas de permisos y avance conservan sus precondiciones.

## Verificación

- API: **33 PASA**, incluidos mensajes de duplicados, título, tamaño y rollback. [Reporte](evidencias/2026-11-04T03-13-39-245Z-regresion-api/reporte.json).
- Navegador: **16 PASA**, con conflicto real de términos repetidos, validación local, titularidad CONS pendiente y fallos simulados de envío/red. [Reporte y capturas](evidencias/2026-11-04T03-12-21-933Z-regresion-ui/reporte.json).
- Regresión de guardado y flujo: **11 PASA**. [Reporte](evidencias/2026-11-04T03-12-23-181Z-d05-d11-ui/reporte.json).
- Build correcto; lint sin errores y con las 10 advertencias heredadas. Vite conserva el aviso de tamaño del bloque JavaScript.

La simulación de HTTP 409 comprueba el tratamiento de una respuesta de envío fallida; los conflictos de palabras clave y la validación CONS se ejecutan contra la API real. Los reportes anteriores de diagnóstico se conservan.

## Revisión manual

- [ ] Repetir un término ES o EN y comprobar que se identifica el término y se conserva la captura.
- [ ] Enviar con un requisito pendiente y verificar que el aviso explica la causa.
- [ ] Corregir, reintentar y confirmar que se conserva un único expediente.

**Responsable:** ____________________ · **Fecha:** ____________________
