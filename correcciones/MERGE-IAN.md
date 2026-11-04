# Integración de Ian · 3 de noviembre de 2026

**Destino:** `correcciones/implementacion` (`a1ed4ec` antes del merge).
**Origen:** `origin/rama-ian-para-no-explotar-todo` (`a605b81`).
**Autorización:** conservar edición y eliminación de borradores de convocatorias, actividades y cronograma, y el formulario de la Persona Investigadora Coordinadora de Ian, adaptándolo a los documentos y a las correcciones actuales. La aceptación final será manual.

## Resultado y sustento

| Parte | Integración y justificación |
| --- | --- |
| Convocatorias | Se incorpora la pantalla de Ian para crear, editar y eliminar borradores, con actividades, responsables y fechas. Solo VIE Publicación y admin pueden modificar. No se elimina una convocatoria con propuestas ni una publicada. La edición de cronograma también se protege en las rutas individuales de la API. |
| Cronograma | Se conserva la transacción y el control de hitos ajenos de correcciones. Se agrega creación atómica y actualización solo de actividades. Se verifican fechas reales y orden inicio/fin. **No se obliga a que todas las actividades terminen antes del cierre de recepción:** el propio seed incluye Comité, Consejo y CIE después de esa fecha. |
| Formulario | Se reutilizan las tablas, preguntas condicionales, objetivos específicos y campos detallados de Ian. Un adaptador los conecta a la API actual, conservando equipo, horas, titular CONS, presupuesto, productos, permisos, actividades y responsabilidades individuales. |
| Persistencia adicional | La migración **008** incorpora `propuesta.formulario_detalle` para complementos que no tenían representación completa: detalles de preguntas, iniciales, identificación de declaración, objetivos sin actividades y otros desgloses. Los datos de negocio siguen en sus tablas normalizadas. Cada complemento pertenece a su sección; no permite modificar otra sección durante subsanación. |
| Guardado | Se conserva «Guardar borrador» sin salir ni duplicar, «Guardar y salir», errores reales y relectura después de guardar. Las claves temporales del equipo se resuelven dentro de la misma transacción al guardar actividades. No se muestran mensajes de autoguardado inexistente. |
| Requisitos conservados | Numeración anual, permisos por ámbito, PI acreditada, subsanación limitada, tres evaluadores, consolidación, rechazos y reconsideración, usuarios, catálogos, rúbricas y auditoría siguen vigentes. Se conservan documentación, migraciones, scripts y evidencia existentes. |

### Adaptaciones necesarias del formulario de Ian

- **Dependencia académica:** se muestra la de la cuenta; el investigador no la reasigna libremente. Admin/VIE mantienen el editor autorizado de coordinación (D10).
- **Modalidades y líneas:** se consultan los catálogos reales. Se conserva visible una modalidad actual retirada para no reemplazarla silenciosamente.
- **PI:** el oficio escrito por el investigador es un dato declarado; no sustituye el dictamen ni la certificación de Vinculación (D04). La necesidad de PI permanece congelada en subsanación.
- **Idiomas:** 4–6 términos ES; abstract EN obligatorio al enviar; keywords EN opcionales. Se preserva D08.
- **Documentación:** se conserva carga y descarga real de PDF/DOCX/XLSX. Los controles de imágenes/videos de Ian solo retenían nombres locales y se sustituyen por el componente persistente existente (D06).
- **Plan:** se admiten duraciones decimales, incluido el ejemplo oficial de **0,07 meses**. Se conservan responsabilidades distintas por integrante.
- **Presupuesto:** los años parten de la fecha de inicio y se conservan años ya registrados; se evita imponer 2027–2029 a todos los expedientes. Los duraderos siguen sujetos al primer año.
- **Ética:** editar el detalle no reemplaza el estado previamente declarado de los permisos por «pendiente».
- **Estado del arte:** las 1 000 palabras son una orientación visual para dos páginas, no una regla institucional nueva que bloquee el guardado.
- **Revisión:** los complementos se pueden consultar antes del envío y desde el expediente; no se limitan a datos invisibles en la base.

## Fuentes

- [Análisis de personas](../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md): publicación, cronograma, permisos de edición y roles.
- [Formulario oficial](<../docs/oficiales-vie/markdown/4- Formulario Proyecto Investigacion Fondos VIE 2027.md>): campos, objetivos, plan, presupuesto, productos, ética, hoja de ruta y declaración.
- [Seed](../database/seed.sql): cronograma de recepción, Comité, Consejo y CIE; evidencia de fases posteriores al cierre de recepción.
- [Decisiones D01–D04](DECISIONES-D01-D04.md) y [D05–D11](DECISIONES-D05-D11.md): restricciones acordadas por el usuario que debe conservar la integración.

## Validación técnica

`./instalar.sh --pruebas --verificar` terminó con **código 0**: **99 comprobaciones funcionales PASA**, esquema nuevo con ocho migraciones y conservación de sus 16 propuestas originales. También pasaron las **12 comprobaciones de scripts**, sintaxis Bash y `git diff --check`.

| Batería | Resultado | Evidencia |
| --- | --- | --- |
| Esquema nuevo | PASA; seed conservado | [Reporte](evidencias/2026-11-04T02-52-29-461Z-esquema-nuevo/reporte.json) |
| API existente | 33 PASA | [Reporte](evidencias/2026-11-04T02-52-30-057Z-regresion-api/reporte.json) |
| D01–D04 | 14 PASA | [Reporte](evidencias/2026-11-04T02-52-33-100Z-decisiones-d01-d04/reporte.json) |
| D05–D11 API | 22 PASA | [Reporte](evidencias/2026-11-04T02-52-36-463Z-d05-d11-api/reporte.json) |
| UI existente | 11 PASA | [Reporte y capturas](evidencias/2026-11-04T02-52-40-643Z-regresion-ui/reporte.json) |
| UI D05–D11 | 11 PASA; sin errores registrados | [Reporte y capturas](evidencias/2026-11-04T02-52-51-763Z-d05-d11-ui/reporte.json) |
| Integración Ian API/UI | 8 PASA; sin errores registrados | [Reporte y capturas](evidencias/2026-11-04T02-53-07-837Z-merge-ian/reporte.json) |

Se verificaron adicionalmente las tres ramas completas de aprobación, rechazo CIE y rechazo de aval: **72 PASA y 6 NO APLICA** posteriores al rechazo del Consejo, sin forzar una resolución CIE. [Reporte del recorrido](evidencias/2026-11-04T02-53-57-112Z-linea-base-api/reporte.json).

Lint: **0 errores y 10 advertencias heredadas** de Fast Refresh/efectos de carga. Build correcto, con aviso de Vite por el tamaño del bloque JavaScript (aproximadamente 551 kB sin comprimir). No se certifica accesibilidad completa con estas pruebas.

Se aplicó **008** a desarrollo sin reinicializarlo: sus **23 propuestas conservan los mismos IDs y códigos**. [Comparación](evidencias/MERGE-IAN-desarrollo.json).

Las carpetas de reportes usan fecha UTC; este documento usa la fecha local de Costa Rica. Se conservan diagnósticos anteriores: nombres accesibles de campos poblados, claves de catálogo por nombre repetido y una consulta de prueba que debía esperar el guardado. La tabla identifica la ejecución final. El contenedor oficial de pruebas se recreó conservando el volumen para recuperar la publicación de su puerto; desarrollo no se reinicializó.

## Validación manual pendiente

- [ ] VIE crea un borrador con varias actividades; guarda, recarga y verifica nombres, responsables y fechas.
- [ ] VIE edita, agrega y quita actividades; elimina un borrador vacío. Confirma que una publicada o con propuestas no se elimina.
- [ ] Investigador comprueba que el formulario corresponde al de Ian y que la dependencia no se puede reasignar libremente.
- [ ] Investigador completa preguntas condicionales, objetivos y datos de equipo; guarda dos veces, recarga y confirma que no se duplican integrantes ni propuestas.
- [ ] Revisa participantes y responsabilidades del plan, duración decimal, riesgos, presupuesto por año y productos según modalidad.
- [ ] Revisa divulgación, ética, permisos existentes, hoja de ruta y declaración desde formulario y expediente.
- [ ] Carga, descarga y retira un adjunto real; comprueba plantilla XLSX.
- [ ] Envía, devuelve, subsana solo lo solicitado y reenvía a la misma instancia.
- [ ] Tres evaluadores entregan notas; asistencia confirma; Consejo, VIE y CIE siguen el flujo acordado.

**Responsable:** ____________________ · **Fecha:** ____________________

**Observaciones y aceptación:** pendiente de revisión manual.
