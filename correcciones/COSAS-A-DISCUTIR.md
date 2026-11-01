# Pendientes para completar el sistema

> **Base:** [ESTADO-DE-REVISION.md](ESTADO-DE-REVISION.md). Este archivo reúne decisiones, implementaciones y validaciones pendientes.
> **Regla:** lo exigido por las fuentes oficiales se implementa; las ambigüedades se acuerdan antes de cambiar el comportamiento. Ningún punto se considera aprobado por aparecer aquí.

> **Actualización D01–D04:** el usuario indicó los acuerdos a implementar. Consultar [DECISIONES-D01-D04.md](DECISIONES-D01-D04.md); D05–D11 continúan pendientes para el equipo.

## 1. Decisiones del equipo

Mantener estos identificadores al registrar acuerdos.

| ID | Tema | Pregunta concreta |
| --- | --- | --- |
| D01 | Numeración | **Acordada:** consecutivo anual automático, histórico intacto. Ver decisiones D01–D04. |
| D02 | Visibilidad | **Acordada:** ámbito en API por propiedad, equipo, escuela o asignación; sin borradores ajenos. |
| D03 | Subsanación | **Acordada:** devolución con secciones autorizadas, respuesta y reenvío a la misma instancia; sin reapertura excepcional. |
| D04 | PI | **Acordada:** dictamen emitido si es requerido; certificación fundamentada si no lo es. Los demás requisitos de etapa conservan su alcance pendiente. |
| D05 | Comité | ¿Cómo se identifican los cinco evaluadores, se sustituyen integrantes y se consolida su valoración? ¿Qué trámite sigue una recomendación negativa? |
| D06 | Archivos y oficios | ¿Esta entrega incluye carga real y PDF? Si los incluye: ¿qué formatos, tamaños, versiones, almacenamiento y retención se requieren? |
| D07 | Administración | ¿Qué CRUD de usuarios, roles, catálogos y rúbricas entra en la entrega? El motor genérico de formularios está excluido del alcance actual. |
| D08 | Textos e idiomas | ¿Qué campos en inglés son obligatorios según las fuentes? ¿Hay límites adicionales documentados? No añadir límites sin fuente. |
| D09 | Excepciones admin | ¿El administrador puede anular requisitos? Si puede: ¿con qué autorización, motivo y auditoría? |
| D10 | Formulario y plantillas | ¿Se admite captura estructurada, Excel o ambos? ¿Quién puede cambiar la dependencia coordinadora y gestionar los catálogos? |
| D11 | Rechazo del Consejo | ¿Quién comunica el rechazo de aval y cómo se solicita reconsideración, sin inventar una resolución CIE? |

**Ya establecido:** resumen de máximo **500 palabras**, entre **4 y 6 términos clave ES**, decisiones humanas justificadas y persistencia real. Estos requisitos no están pendientes de votación.

## 2. Implementaciones necesarias

La captura y persistencia de muchos campos ya existe. Aquí se lista lo que todavía falta cerrar, no se propone rehacer lo corregido.

| ID | Pendiente | Dependencia / resultado exigido |
| --- | --- | --- |
| I01 | Implementado conforme a D01; pendiente aceptación humana. | Contador anual transaccional, códigos históricos conservados y pruebas de concurrencia. Ver decisiones D01–D04. |
| I02 | Incorporar la **rúbrica oficial completa**, con criterios, pesos, niveles y requisitos por modalidad. | Fuente oficial. Versionarla y calcular en servidor; retirar la limitación del subconjunto demo y comprobar aprobación/rechazo desde la interfaz. |
| I03 | Completar la evaluación independiente y consolidación real del Comité. | D05 + I02. Usar integrantes y notas persistidas; sustituir el resumen de evaluadores ficticios y generar el resultado/oficio correspondiente. |
| I04 | Implementado para devoluciones de Comité y VIE; pendiente aceptación humana. | D03. Secciones autorizadas, respuesta, ciclos, avisos y reenvío a la instancia que devolvió. D09 sigue pendiente. |
| I05 | Completar las precondiciones restantes de las etapas en la API. | PI y subsanación ya protegidas por D03/D04; las reglas restantes dependen del alcance del equipo y D09. Impedir saltos y acciones fuera de turno para cada rol, incluido admin; reflejar las acciones válidas en las bandejas. |
| I06 | Implementado el ámbito de las consultas actuales; pendiente aceptación humana. | D02. Listados, filtros, detalles y evaluación protegidos en API. Las futuras descargas de D06 deberán aplicar el mismo ámbito. |
| I07 | Completar el mapeo campo a campo del formulario y sus validaciones oficiales. | Revisar identificación/TRL, objetivos, horas y titularidad CONS, mínimos de productos, presupuesto, riesgos y ética. Resolver D08/D10 donde la fuente no sea suficiente. |
| I08 | Implementar archivos y documentos acordados. | D06. Carga, consulta, permisos, metadatos accesibles y versiones; PDF/vistas previas con datos reales. Si se excluyen, registrar la exclusión y mantenerla visible. |
| I09 | Implementar la administración incluida y las excepciones autorizadas. | D07/D09. CRUD con persistencia, protección de referencias y auditoría donde corresponda; no presentar funciones pendientes como disponibles. |
| I10 | Completar comunicaciones y consistencia de vistas. | D11 e implementaciones anteriores. Cerrar rechazo de aval/reconsideración; revisar pendientes, indicadores, documentos y estado final desde cada rol. |
| I11 | Revisar la deuda técnica restante. | Clasificar las **10 advertencias de lint**: corregir las relevantes y justificar las aceptadas. No confundir lint sin errores con ausencia de deuda. |

**Fuentes para I02/I07:** [rúbricas](../docs/oficiales-vie/markdown/2-Rubricas_Investigacion_2027__Fondos_VIE.md), [formulario](<../docs/oficiales-vie/markdown/4- Formulario Proyecto Investigacion Fondos VIE 2027.md>), [disposiciones](<../docs/oficiales-vie/markdown/1-Disposiciones Convocatoria Fondos VIE 2027.md>) y [CU1–CU5](../docs/casos-de-uso/CASOS-DE-USO.md). No añadir reglas institucionales sin sustento.

## 3. Validación pendiente para cerrar

Las **33 comprobaciones API, 14 de D01–D04, 11 de navegador y 12 de scripts** cubren correcciones concretas; no sustituyen esta aceptación integral.

- [ ] **V01 · Flujo completo:** recorrer la interfaz con expedientes nuevos y todos los roles; probar aprobación, rechazo CIE, rechazo de aval y subsanación hasta comunicación e histórico. No sustituir etapas por cambios directos en BD.
- [ ] **V02 · Persistencia:** completar los 17 pasos, guardar, salir, cambiar de sesión y reiniciar servicios; comparar todo lo capturado con el expediente mostrado.
- [ ] **V03 · Casos negativos:** permisos, saltos de etapa, concurrencia, doble envío, cierre, límites y fallos de API sin pérdidas ni éxitos falsos.
- [ ] **V04 · Revisión visual y accesible:** todas las pantallas, escritorio/móvil, zoom 100 %/200 %, teclado, foco, modales, contraste, lector de pantalla y ortografía.
- [ ] **V05 · Instalación reproducible:** comprobar instalación limpia y actualización sobre datos existentes; limpieza/reinstalación y purga únicamente en un entorno desechable. Los scripts ya tienen pruebas, pero falta cubrir todos esos escenarios de entrega.
- [ ] **V06 · Aceptación del usuario:** completar las pausas V0–V6 de [VALIDACION-DEL-FLUJO.md](VALIDACION-DEL-FLUJO.md), registrar observaciones y repetir los casos corregidos.

## 4. Criterio de completitud

- [ ] Cada decisión tiene acuerdo, fuente y responsable; las exclusiones están aceptadas explícitamente.
- [ ] Cada implementación exigida por el alcance está terminada y tiene evidencia.
- [ ] CU1–CU5 y sus ramas funcionan de principio a fin; no quedan fallos bloqueantes en el alcance aceptado.
- [ ] Las simulaciones restantes están identificadas y no suplantan datos ni operaciones reales.
- [ ] Código, migraciones, pruebas y README describen el mismo comportamiento.
- [ ] El usuario registra su aceptación. No cerrar por cantidad de commits ni por porcentaje estimado.

## 5. Acuerdos y seguimiento

| ID | Acuerdo o tarea concreta | Fuente / participantes / fecha | Responsable | Commit y prueba | Validación del usuario |
| --- | --- | --- | --- | --- | --- |
| Pendiente | | | | | |
