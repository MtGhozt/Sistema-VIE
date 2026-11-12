# Convocatorias: vigencia, presupuesto y actividades

Fecha: 11/11/2026 (Costa Rica). Autorización: solicitud posterior del usuario sobre fechas pasadas, presupuesto obligatorio y consulta del mínimo de actividades.

## Reglas vigentes

| Tema | Comportamiento |
| --- | --- |
| Próximas a cerrar | Solo publicadas cuyo cierre esté entre **hoy y hoy + 30 días**, inclusive, usando el día de Costa Rica. La convocatoria de la imagen cierra el **01/03/2000**: está vencida; no corresponde incluirla. El cálculo existente era correcto y se verificó también para 30 y 31 días. |
| Crear | La apertura y el cierre no pueden estar en el pasado. Se permite hoy. El cierre debe ser igual o posterior a la apertura. Se valida antes de guardar y en la API. |
| Editar | No se permite introducir una apertura pasada ni guardar un cierre vencido. Una apertura histórica sin cambios se conserva si la convocatoria sigue vigente; moverla al pasado sí se rechaza. |
| Publicar / reactivar | Cierre vigente, presupuesto definido y cronograma completo. Una convocatoria vencida no se publica ni reactiva. Para un borrador cuya apertura ya ocurrió, se permite publicarlo si la recepción sigue vigente. |
| Presupuesto | **Obligatorio para guardar y publicar**, incluido borrador. Vacío se presenta como **Indefinido** y produce error; no se convierte automáticamente en cero. Se acepta cero o un monto positivo, coma o punto decimal, máximo dos decimales y ₡999 999 999 999,99. Mensajes distintos para indefinido, no numérico, negativo, exceso de decimales y exceso del límite. |
| Actividades | **Al menos una**, con nombre, responsable, inicio y fin dentro de la convocatoria. El formulario ya impedía quitar su última actividad, pero la API admitía cero: se corrige la inconsistencia. Se rechaza crear o editar con un cronograma vacío, publicar sin él o borrar la última actividad por su ruta individual. |
| Históricos | No se borran ni se cambian estados o fechas automáticamente. Los presupuestos históricos nulos se muestran como **Indefinido** y deben completarse antes de editar/publicar. Las modificaciones rechazadas no dejan cambios parciales. No requiere migración. |

## Sustento y cambios respecto a lo anterior

La obligatoriedad del presupuesto y la restricción de fechas pasadas responden a esta indicación explícita del usuario y sustituyen la aceptación anterior de presupuesto vacío y fechas históricas en nuevas convocatorias. Los reportes anteriores conservan su contexto.

El [análisis de personas](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md) exige publicar convocatoria y cronograma; el [cronograma oficial](../../docs/oficiales-vie/markdown/03-Cronograma-Convocatoria-2027.md) describe actividades, responsables y fechas. Estas fuentes sustentan la existencia del cronograma, pero **no fijan un mínimo numérico institucional**. El mínimo de una actividad mantiene consistente la regla que ya aplicaba el formulario del prototipo; no se presenta como una nueva regla CIE.

## Validaciones

- Requisitos de convocatoria: **15 PASA**: [reporte](evidencias/2026-11-12T00-18-28-168Z-requisitos-convocatoria/reporte.json).
- Regresión VIE: **14 PASA**, incluidos filtros, calendario, edición y acciones: [reporte](evidencias/2026-11-12T00-10-29-457Z-vie-publicacion/reporte.json).
- Regresión API: **33 PASA**: [reporte](../evidencias/2026-11-12T00-14-15-862Z-regresion-api/reporte.json).
- Flujos de aprobación, rechazo CIE y rechazo Consejo: **72 PASA y 6 NO APLICA**: [reporte](../evidencias/2026-11-12T00-14-15-857Z-linea-base-api/reporte.json).
- Compilación completa y lint correctos, con advertencias previas. Pruebas sobre base aislada y Chromium en inglés, **sin capturas**.

La nueva regresión específica usa fechas relativas al día de ejecución. Comprueba creación, edición, publicación, reactivación, presupuesto, actividad mínima, reversión de cambios y fecha de Costa Rica. Un primer intento falló únicamente por esperar `aria-invalid="false"` en vez de la ausencia del atributo; se corrigió la aserción y se repitió.

## Validación manual

- [ ] Crear con apertura o cierre pasados y comprobar el error señalado.
- [ ] Dejar presupuesto vacío, probar un negativo y luego guardar con cero.
- [ ] Completar una actividad y verificar el guardado y la publicación.
- [ ] Verificar próximas a cerrar con cierres hoy, a 30 y a 31 días; comprobar que la de 2000 se excluye.
