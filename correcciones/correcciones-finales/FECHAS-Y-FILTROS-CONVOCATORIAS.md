# Convocatorias: formato fijo de fechas y filtros

Fecha: 11/11/2026. Solicitud: corregir MM/DD/YYYY y usar filtros como los del histórico.

- **Fechas de creación y edición:** entrada visible DD/MM/YYYY independiente del idioma del navegador. Al escribir los ocho dígitos se insertan las barras; se conservan entradas parciales para poder completarlas. El botón Calendario permite seleccionar una fecha y la devuelve en el mismo formato. La API continúa recibiendo ISO. Se conservan las validaciones de fechas reales y límites de las actividades.
- **Filtros:** mismo panel y grupos desplegables del histórico, con Nombre o descripción y un selector de Estado de convocatoria. Se usa el estado de la convocatoria porque esta pantalla lista convocatorias, no propuestas. Ambos filtros se combinan, se conservan en la URL y tienen limpieza individual y general.

## Validación

[Regresión de VIE: 14 PASA](evidencias/2026-11-11T23-51-03-053Z-vie-publicacion/reporte.json), ejecutada con Chromium en inglés, sin capturas. Incluye escritura asistida DD/MM/YYYY, apertura del calendario, transferencia de selección a la entrada, edición/recarga, límites de actividades, búsqueda por nombre y descripción, combinación de estados, resultado vacío, limpieza independiente/general y persistencia tras recargar.

Compilación completa y lint del frontend: correctos, con advertencias preexistentes. Un primer intento detectó un nombre accesible incorrecto del selector, corregido antes de la ejecución final; otro intento quedó bloqueado por acceso local a PostgreSQL y se repitió con los permisos necesarios. Sus reportes se conservan como registro.

## Revisión manual pendiente

- [ ] Escribir una fecha DD/MM/YYYY y elegir otra desde Calendario en crear y editar.
- [ ] Combinar Nombre o descripción y Estado, y comprobar los resultados esperados.
