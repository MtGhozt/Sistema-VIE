# Estado de revisión · 2 de noviembre de 2026

> **Integración posterior · 3 de noviembre:** formulario y convocatorias de Ian incorporados según el alcance autorizado. Ver [MERGE-IAN.md](MERGE-IAN.md) para adaptaciones, evidencia y aceptación manual.
>
> **Post-auditoría · 9 de noviembre:** CaseFile enriquecido con detalle real de propuesta; limpieza de adapters/demo muertos; docs alineados. Prioridad y checklist: [PRIORIDAD-POST-AUDITORIA.md](PRIORIDAD-POST-AUDITORIA.md). Guion de aceptación humana: [GUIION-DEMO-V01.md](GUIION-DEMO-V01.md).

**Alcance implementado:** D01–D11 conforme a las indicaciones del usuario. Las funciones y sus límites están en [D01–D04](DECISIONES-D01-D04.md) y [D05–D11](DECISIONES-D05-D11.md). **No equivale a aceptación institucional ni del usuario.**

## Resultado funcional

- Código anual automático y consultas limitadas al ámbito del usuario.
- Guardado real de borradores, relectura del formulario y salida diferenciada; sin duplicar propuestas al volver a guardar.
- Adjuntos reales y versionados; descarga autorizada y conservación de versiones retiradas.
- Rúbricas completas de 100 puntos y tres evaluadores independientes. El dictamen se confirma después de las tres entregas.
- Subsanación con permisos por sección, respuestas y otro ciclo de evaluación; las notas anteriores no se sobrescriben y las peticiones antiguas se rechazan.
- PI obligatoria según flag, con certificación fundamentada cuando no se requiere dictamen.
- Aval rechazado y resolución CIE diferenciados; reconsideración del Consejo mediante solicitud y autorización auditadas.
- Usuarios y catálogos con baja lógica, roles/escuela y rúbricas versionadas; sin override ni motor genérico de formularios.

## Cómo revisar

```bash
./instalar.sh --pruebas --verificar
DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm dev
```

Abrir `http://localhost:5173`. Para las tres evaluaciones, seleccionar Comité · Evaluador y usar `comite_evaluador@tec.ac.cr`, `comite_evaluador2@tec.ac.cr` y `comite_evaluador3@tec.ac.cr` (contraseña inicial demo `prototipo2026`).

El instalador aplica las migraciones **001–008** sin reinicializar el volumen. La comprobación de esquema nuevo usa un esquema temporal y revierte la transacción; las baterías funcionales conservan sus expedientes de prueba para inspección.

## Evidencia

Consultar [validación final D05–D11](evidencias/D05-D11-validacion.md): distingue pruebas API, navegador, scripts, instalación nueva, actualización de desarrollo y límites. Los reportes anteriores, incluidos los fallidos, se conservan como diagnóstico. La evidencia histórica de D01–D04 está en [su informe](evidencias/D01-D04-validacion.md).

El lint no tiene errores y conserva diez advertencias de Fast Refresh/estado en efectos. Están clasificadas en el informe; no se presenta como ausencia de deuda técnica.

## Aceptación pendiente

Las casillas de [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md), [VALIDACION-DEL-FLUJO.md](VALIDACION-DEL-FLUJO.md) y los documentos de decisiones continúan vacías para el usuario/equipo. Falta validar humanamente contenido institucional y accesibilidad exhaustiva; las pruebas automatizadas no sustituyen esa revisión.

Las funciones expresamente excluidas siguen identificadas: motor genérico de formularios, imágenes/videos y generación automática de PDF de oficios. Los documentos semilla sin binario no se presentan como archivos descargables. La autenticación sigue siendo la del prototipo demo existente.
