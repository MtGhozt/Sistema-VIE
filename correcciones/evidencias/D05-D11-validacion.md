# Validación final · D05–D11

**Fecha:** 2 de noviembre de 2026. Implementación `4582c4c`; pruebas e integración `e5b2cf9`. Alcance y sustento: [decisiones](../DECISIONES-D05-D11.md). La validación automática no sustituye la aceptación del equipo.

## Ejecución integral

`./instalar.sh --pruebas --verificar` terminó con código **0** sobre `fondos_vie_test` (puerto 55432), con API propia y datos de prueba.

| Batería | Resultado | Evidencia |
| --- | --- | --- |
| Esquema nuevo y siete migraciones | PASA; 16 propuestas originales del seed conservan sus códigos; esquema temporal revertido | [Reporte](2026-11-02T21-16-12-530Z-esquema-nuevo/reporte.json) |
| Regresión API existente | 33 PASA | [Reporte](2026-11-02T21-16-13-130Z-regresion-api/reporte.json) |
| D01–D04 | 14 PASA | [Reporte](2026-11-02T21-16-15-831Z-decisiones-d01-d04/reporte.json) |
| D05–D11 API | 22 PASA | [Reporte](2026-11-02T21-16-18-803Z-d05-d11-api/reporte.json) |
| Interfaz existente | 11 PASA | [Reporte y capturas](2026-11-02T21-16-22-709Z-regresion-ui/reporte.json) |
| Interfaz D05–D11 | 11 PASA | [Reporte y capturas](2026-11-02T21-16-32-738Z-d05-d11-ui/reporte.json) |
| Flujo completo por API | 72 PASA; 6 NO APLICA después de rechazo del Consejo | [Reporte](2026-11-02T21-19-29-254Z-linea-base-api/reporte.json) |

Son **69 comprobaciones API y 22 de navegador** en la ejecución integral; el recorrido completo se ejecutó adicionalmente. Comprueba aprobación, rechazo CIE y rechazo de aval, con tres evaluadores y confirmación real. Los seis NO APLICA evitan continuar hacia CIE después de un rechazo del Consejo.

También pasaron `pnpm build`, las **12 comprobaciones** de `node scripts/test-lifecycle.mjs`, sintaxis Bash y `git diff --check`. Lint terminó sin errores y con **10 advertencias heredadas**: cinco de Fast Refresh/exportación de contextos o componentes y cinco de actualización de estado en efectos de carga. No se presenta como una ejecución sin advertencias.

## Comportamientos comprobados

- Guardar borrador conserva URL e identidad, no duplica; guardar y salir, recargar y captura parcial funcionan. Se bloquea la navegación por el enlace del expediente durante el guardado.
- Tres cuentas reales completan la rúbrica oficial; consolidación, requisitos obligatorios, versiones fijadas y sustitución antes de entrega se verifican en servidor.
- Subsanación después de entregar notas conserva el ciclo anterior; un guardado de pantalla antigua devuelve conflicto. Adjuntos pueden atender una devolución de documentos sin simular cambios de formulario.
- Los archivos se guardan y descargan byte a byte; otro proceso de API recupera el mismo binario. Se prueban formato, tamaño, versiones y permisos. Navegador verifica carga, descarga y retirada.
- Desarrollo tecnológico exige activo PI y productos académicos según horas. La confirmación humana y la cantidad calculada se distinguen.
- Rechazo del Consejo, solicitud del investigador y autorización de nuevo ciclo conservan evidencia; no se omiten PI, Consejo o checklist VIE por ser admin.
- Usuarios, catálogos y rúbricas se guardan con auditoría. Algunas pruebas de restricciones preparan predecesores sintéticos; el recorrido completo y las pruebas de navegador aportan evidencia separada del circuito real.

## Desarrollo actualizado sin reinicializar

Se aplicaron **001–007** a `fondos_vie` (puerto 5432), cuyo esquema estaba pendiente. Se compararon las **21 propuestas existentes** antes y después: mismos IDs y códigos. Estas 21 incluyen trabajo previo del entorno; no son las 16 del seed limpio. [Comparación registrada](D05-D11-desarrollo.json).

## Cierre humano pendiente

Los reportes anteriores fallidos se conservan como diagnóstico; la tabla identifica las ejecuciones finales. No se certifica accesibilidad completa ni quórum institucional definitivo. Motor genérico de formularios, imágenes/videos y PDF automático de oficios permanecen excluidos y deshabilitados explícitamente.

- [ ] Equipo revisa pantallas, permisos, contenido institucional y exclusiones.
- [ ] Equipo completa la aceptación en [DECISIONES-D05-D11.md](../DECISIONES-D05-D11.md).

**Responsable:** ____________________ · **Fecha:** ____________________
