# Revisión pendiente del equipo

**Actualización: 2 de noviembre de 2026.** El usuario indicó el comportamiento de D01–D11 y autorizó su implementación. Las decisiones ya no están abiertas; quedan revisión de las fuentes y aceptación humana. Ver [D01–D04](DECISIONES-D01-D04.md), [D05–D11](DECISIONES-D05-D11.md) y [estado de revisión](ESTADO-DE-REVISION.md).

## Decisiones aplicadas

| ID | Resultado |
| --- | --- |
| D01 | Código automático, inmutable y anual; históricos conservados. |
| D02 | Consulta filtrada en API por propietario/equipo, escuela/asignación y rol; sin borradores ajenos. |
| D03 | Subsanación por secciones y retorno a la instancia que devolvió. Nuevos ciclos conservan las notas anteriores. |
| D04 | PI exige dictamen o certificación explícita y fundamentada de no requerimiento. |
| D05 | Tres evaluadores independientes, rúbrica completa y confirmación del consolidado por asistencia. Una recomendación negativa informa al Consejo. |
| D06 | Archivos reales PDF/DOCX/XLSX, 10 MiB, versiones, permisos y retiro lógico. |
| D08 | ES 4–6 y abstract EN al enviar; keywords EN opcionales y editables. |
| D07 | Usuarios, roles asignados, escuelas, modalidades, líneas y versiones de rúbrica. Sin motor genérico de formularios. |
| D09 | Sin override administrativo; se mantienen las precondiciones. |
| D10 | Captura estructurada y Excel adjunto; reasignación de coordinación/dependencia reservada a admin/VIE antes de evaluación. |
| D11 | Rechazo de aval comunicado al investigador; reconsideración con solicitud, autorización y nuevo ciclo auditado. CIE cierra con fundamento. |

## Qué se debe discutir

1. **Errata de la fuente:** comprobar los descriptores de “Experiencia académica del equipo sobre el tema”, que parecen invertidos en algunas hojas. Se importaron literalmente; corregirlos requiere acuerdo y una nueva versión.
2. **Aceptación del prototipo:** confirmar los tres evaluadores demo y el flujo implementado. No se presenta ese número como quórum institucional real.
3. **Exclusiones aceptadas por alcance:** motor de formularios, imágenes/videos y generación automática de PDF de oficios. Sus controles no simulan funcionamiento. Si se requieren después, acordar esa ampliación explícitamente.

No hay una aprobación pendiente para que admin pueda saltarse el circuito: **ese override no se implementó**.

## Seguimiento de implementaciones

| ID anterior | Estado del alcance acordado |
| --- | --- |
| I01 | Numeración anual implementada y probada con concurrencia. |
| I02 | Rúbricas completas de 100 puntos; niveles, requisitos obligatorios y versiones persistidos. |
| I03 | Evaluación independiente, sustitución de pendientes y consolidación real de tres entregas. |
| I04 | Devolución, edición autorizada, respuesta, adjuntos y reenvío; notas previas conservadas por ciclo. |
| I05 | Precondiciones de PI, Comité, Consejo, VIE y CIE aplicadas en servidor, también para admin. |
| I06 | Ámbito protegido en consultas, detalles y archivos. |
| I07 | Captura y relectura de campos estructurados, TRL, líneas y titularidad CONS; revisar el contenido institucional campo a campo en aceptación. |
| I08 | Carga/descarga/versiones reales y plantillas oficiales. Generación automática de PDF excluida del alcance actual. |
| I09 | Administración y auditoría implementadas; sin motor de formularios ni override. |
| I10 | Rechazo de aval, aviso, reconsideración y resolución CIE diferenciados. |
| I11 | Lint sin errores; diez advertencias heredadas clasificadas en el informe de validación. |

## Validación humana

Las pruebas automatizadas no completan estas casillas.

- [ ] **V01 · Flujo:** recorrer aprobación, rechazo CIE, rechazo de aval, reconsideración y subsanación con las cuentas reales del prototipo.
- [ ] **V02 · Persistencia:** revisar los 17 pasos, guardar, salir, iniciar otra sesión y reiniciar servicios; comparar datos y archivos.
- [ ] **V03 · Negativos:** probar permisos, requisitos faltantes, guardados antiguos, concurrencia y decisiones cerradas.
- [ ] **V04 · Visual y accesible:** escritorio/móvil, zoom, teclado, foco, contraste, lector de pantalla y ortografía.
- [ ] **V05 · Instalación:** revisar la actualización conservando datos y la política de conservación/purga. Los binarios tienen almacenamiento separado del volumen PostgreSQL.
- [ ] **V06 · Aceptación:** completar las pausas de [VALIDACION-DEL-FLUJO.md](VALIDACION-DEL-FLUJO.md) y registrar hallazgos del equipo.

**Responsable:** ____________________ · **Fecha:** ____________________

**Observaciones / aceptación:** pendiente de revisión humana.
