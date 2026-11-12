# VIE — Publicación: hallazgos y correcciones

**Fecha:** 11 de noviembre de 2026. **Sustento principal:** observaciones del usuario sobre errores en inglés, filtros, convocatorias, prioridades, confirmación, fechas y legibilidad.

| ID | Pantalla y problema observado | Corrección implementada |
| --- | --- | --- |
| VF01 | Acceso y convocatoria: `required`, fechas y restricciones numéricas delegan mensajes al idioma del navegador. | Validación propia en español; resumen de errores, mensaje junto al campo, borde rojo y foco en el primer error. Se desactiva la burbuja nativa en esos formularios. |
| VF02 | Convocatorias e histórico: un bloque agrupa todos los filtros. | Criterios desplegables independientes, marcador visual y limpieza individual. Limpiar búsqueda conserva estado y viceversa. En histórico se conserva también la limpieza global. |
| VF03 | Listado, edición y detalle aparecen mezclados, con IDs técnicos como `VIE-…`. | Rutas propias para listado, creación, edición y revisión; se muestran nombres y datos relevantes. Los IDs se usan internamente y en las rutas. |
| VF04 | Inicio: “Pendientes prioritarios” toma las cinco fechas más antiguas, aunque sean borradores o convocatorias cerradas/vencidas. | “Convocatorias próximas a cerrar”: publicadas con cierre entre hoy y los próximos 30 días, ordenadas por fecha. Fecha local de Costa Rica, incluido el día del cierre. Cada elemento abre su revisión. |
| VF05 | Acciones: guardar, publicar y cerrar carecen de confirmación clara y estable. | Guardar muestra confirmación persistente. Publicar, cerrar, reactivar y eliminar tienen diálogo previo, cancelación y resultado explícito. Un error mantiene su motivo disponible; no se anuncia éxito si falla la API. |
| VF06 | Fechas: presentación variable, componentes nativos dependientes del navegador y cronograma pequeño. | Control nativo con escritura asistida, calendario y pista día/mes/año; revisión en `DD-MM-AAAA` y comprobación de fechas reales. Fechas legibles de al menos 16 px; revisión con responsables y fechas de cada actividad. Las notificaciones conservan también hora local. |
| VF07 | Avance: datos previamente guardados podían publicarse sin revisar su coherencia actual. | Validación antes de abrir la confirmación y nueva comprobación en la transacción de publicación de la API. Incluye fechas, nombre, presupuesto y actividades existentes. |
| VF08 | Calendario: el formulario limita todas las actividades al período de recepción. | Según la indicación posterior del usuario, se valida apertura ≤ inicio ≤ fin ≤ cierre de convocatoria, en interfaz y API. Esta regla sustituye la interpretación inicial que permitía actividades posteriores. |
| VF09 | Presupuesto: `step=1000` puede rechazar montos válidos mediante mensajes nativos. | Captura decimal con punto o coma; límites y errores comprensibles, sin imponer múltiplos de mil. La API recibe un número. El rótulo no dice “opcional”; la ayuda distingue presupuesto no definido de cero. |
| VF10 | Móvil: una regla más específica del menú mantiene su altura en una pantalla completa. | Menú compacto y adaptable; la convocatoria deja de quedar bajo una pantalla vacía de navegación. |
| VF11 | Errores de servicio sin JSON: se puede mostrar `Service Unavailable` u otro estado HTTP en inglés. | Mensajes de respaldo en español y explicación de fallos de conexión. Se conservan los motivos específicos de la API. |

## Pantallas resultantes

- Inicio: `/inicio`.
- Listado y filtros: `/convocatorias`.
- Creación: `/convocatorias/nueva`.
- Revisión: `/convocatorias/:id`.
- Edición de borrador: `/convocatorias/:id/editar`.
- Histórico: `/historico`.
- Notificaciones: `/notificaciones`.

Las restricciones de rol, borradores y borrado con propuestas asociadas se conservan. Ver [ajustes posteriores](AJUSTES-CREAR-CONVOCATORIA.md) para la validación actual sin imágenes.

Las fechas se envían a la API como ISO; el cambio de presentación no modifica el esquema de la base de datos.

## Sustento documental y límites

- [Análisis de personas](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md): P1 necesita editor de convocatoria y cronograma, estado de publicación y consulta vigente/histórica.
- [Cronograma oficial](../../docs/oficiales-vie/markdown/03-Cronograma-Convocatoria-2027.md): distingue recepción, evaluación, aprobación y comunicación; estas etapas tienen fechas diferentes.
- [Esquema](../../database/DisennoDB.sql): límites existentes de nombre, responsable y presupuesto.
- [Integración previa](../MERGE-IAN.md): base de convocatorias/cronograma. **Regla vigente (11-nov):** actividades dentro de apertura–cierre ([AJUSTES](AJUSTES-CREAR-CONVOCATORIA.md) / [VIGENCIA](VIGENCIA-PRESUPUESTO-Y-ACTIVIDADES.md)); ya no se permiten actividades posteriores al cierre.

Los documentos no establecen una fórmula para priorizar por cantidad de propuestas. Se conserva la ventana de 30 días ya usada en “Próximas a cerrar”, ahora explícita y correctamente aplicada. Cualquier prioridad institucional adicional se registra en [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md).

**Pendiente:** aceptación manual de esta entrega y revisión posterior de los demás perfiles, sin presumir que sus pantallas quedaron certificadas por estas pruebas.
