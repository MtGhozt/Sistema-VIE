# Persona Investigadora Coordinadora · revisión final

**Estado:** aceptado por el usuario el 12/11/2026; solo se reabre ante nuevos errores. **VIE-Publicación:** aceptado por el usuario antes de iniciar esta revisión. No se extiende esa aceptación a este rol.

## Hallazgos y sustento

| ID | Solicitud / hallazgo | Sustento y criterio |
| --- | --- | --- |
| PIC01 | DD/MM/YYYY y calendario en proyecto y nombramientos | Usabilidad solicitada; fechas reales, fin ≥ inicio, años 2000–2100. El formulario oficial incluye período de nombramiento, sin imponer una máscara específica. |
| PIC02 | Resumen de errores y campos señalados al guardar/avanzar | Corrección de usabilidad. Un borrador admite campos incompletos; no se confunde guardar parcialmente con enviar una propuesta completa. Los datos inválidos se señalan. |
| PIC03 | Índice rojo por error y verde por completitud real | Usabilidad: el índice anterior consideraba completo cualquier paso anterior al actual. La corrección usa la validación y distingue secciones devueltas. |
| PIC04 | Orden No / Sí y consistencia de controles | Coincide con las preguntas y los cuadros del formulario oficial. La frase posterior «Sí o No» se interpreta como consistencia; no como instrucción de invertir ese orden. Respuesta exclusiva: radio; catálogo: desplegable; aceptación o selección múltiple: casilla. |
| PIC05 | Horas enteras y no negativas | Indicación explícita del usuario. Los documentos identifican los tipos de horas, pero no establecen expresamente la granularidad entera. No se atribuye esta restricción al CIE. |
| PIC06 | Aclarar titular de horas CONS | Disposiciones §1.2: régimen de Investigador Consolidado. Acuerdos coordinadora/participante: «Dependencia o persona CONS, que aporta las horas». Campo contextual, no obligatorio para tipos ajenos a CONS. |
| PIC07 | Institución externa no registra el texto | Bug confirmado: el adaptador elegía la propiedad interna `instancia` en lugar del nuevo valor de `institucion`. Se corrige y se verifica guardado/recarga. |
| PIC08 | Duración decimal de actividades | **Se conserva:** el formulario oficial dice días ÷ 30 y da el ejemplo **2 días = 0,07 meses**. El pedido de enteros estaba condicionado a que no existiera sustento de decimales. |
| PIC09 | Actividades de proyectos menores de un mes | Bug: el cálculo anterior contaba meses de calendario completos aunque el período fuera de pocos días. Se usa duración real expresada en meses de 30 días, con centésimas, y se valida también al acortar el proyecto. |
| PIC10 | Contadores azules y límites en actividades/riesgos/divulgación/ética/hoja de ruta | Límites técnicos del formulario, no topes oficiales de palabras. Se visualizan también los límites de caracteres que ya existían. Se mantiene el contador de palabras donde ya correspondía. |
| PIC11 | Límites de resumen, problema, objetivos y demás textos | Oficial: resumen máximo 500 palabras, problema 1 página, estado del arte 2 páginas. **500 palabras por página es una aproximación del prototipo**, no equivalencia normativa. 200/120 palabras de objetivos y otros topes son técnicos y deben ratificarse para una entrega institucional. |
| PIC12 | Compromisos: ¿qué son las opciones? | Sí existen en el formulario: cuadros 6–10, cantidades por horas y modalidad, combinación/repetición de opciones y activos PI para desarrollo tecnológico. No se sustituyen por un conteo libre de entregables. |
| PIC13 | Cédula X-XXXX-XXXX | Máscara y validación solicitadas; no equivale a verificar identidad en el Registro Civil. Falta definir soporte para DIMEX/pasaporte si participan coordinaciones con otra identificación. |
| PIC14 | Revisión contraíble, datos en contenedores y tamaño de letra | Bugs/usabilidad: los botones contraíbles estaban dentro de un `fieldset disabled`. Se permite revisar secciones sin habilitar mutaciones de los controles de datos. La revisión final debe mostrar las secciones, no un resumen incompleto. |
| PIC15 | Respuesta a observaciones desaparece al guardar | Bug confirmado: solo se persistía al reenviar. Se guarda en la devolución activa y se recupera al recargar; no se cierra la devolución hasta reenviar. |
| PIC16 | Problema/objetivos inaccesibles en subsanación | La navegación exigía completar secciones ajenas antes de llegar a la autorizada. Se permite acceder a las secciones devueltas y consultar el resto en solo lectura, conservando las restricciones de API. |
| PIC17 | Guía y señalización de observaciones | Secciones devueltas señaladas, motivo visible y accesos directos. No se inventa qué frase corregir si la instancia solo identificó una sección completa. |
| PIC18 | Bloquear Siguiente cuando hay errores | Se conservan precondiciones existentes y se agregan mensajes y vínculos de campo. La subsanación solo valida las secciones autorizadas; no fuerza a editar otras. |
| PIC19 | Filtros desplegables y tarjetas de Inicio con destino correcto | Usabilidad. Mantener búsqueda y estado al recargar; no mostrar un selector vacío cuando una tarjeta envía un código de estado. |
| PIC20 | Propuestas realistas en distintos estados | Cargador separado, voluntario, mediante API y flujo normal; no asigna estados finales por SQL ni modifica propuestas existentes. Datos ficticios claramente identificados. |
| PIC21 | Caso real y presupuesto correcto | Referencia local IC-467-2026: PIELS, desarrollo tecnológico, 01/01/2027–31/12/2029, ₡5 millones operativos/año, ₡0 duraderos, total ₡15 millones. El equipo, identificaciones, evaluaciones y estados de los clones son simulados. |

## Fuentes locales consultadas

- [Formulario oficial](../../docs/oficiales-vie/markdown/4-%20Formulario%20Proyecto%20Investigacion%20Fondos%20VIE%202027.md): preguntas, equipo, problema/objetivos, plan (incluye 0,07), presupuesto, productos, divulgación, ética y hoja de ruta.
- [Plan de acción y riesgos](../../docs/oficiales-vie/markdown/5-%20Plan%20de%20Accion%20y%20Gestion%20del%20Riesgo%20Fondos%20VIE%202027.md): meses 1–36, riesgos y responsables.
- [Disposiciones](../../docs/oficiales-vie/markdown/1-Disposiciones%20Convocatoria%20Fondos%20VIE%202027.md): horas CONS y producción académica.
- [Acuerdo de instancia coordinadora](../../docs/oficiales-vie/markdown/7-%20Formato%20de%20acuerdo%20instancia%20coordinadora%20Fondos%20VIE%202027.md) y [participante](../../docs/oficiales-vie/markdown/8-%20Formato%20de%20acuerdo%20instancia%20participante%20Fondos%20VIE%202027.md): aporte de horas CONS y nombramiento.
- [Referencia PIELS](../../docs/referencias/IC_467_2026_Propuesta_de_Investigacioìn_PIELS_Mario_Chacoìn_RCM.pdf): memorando real; los clones de demostración no son expedientes reales ni resoluciones auténticas.

## Decisiones pendientes del equipo

1. Ratificar topes técnicos donde no hay máximo oficial, especialmente equivalencia página/palabras y tamaño de campos narrativos. No se presentan como límites institucionales.
2. Definir identificación de personas extranjeras; esta entrega implementa el formato nacional solicitado.
3. Precisar «Guardar en forma de checkbox»: guardar sigue siendo una acción con botón; aceptar compromisos usa casillas. Un checkbox no expresa de forma clara el resultado de una operación de guardado.
4. Precisar «Estado de gestión»: se preservan los valores existentes; el documento pide describirlo, sin enumerar un catálogo cerrado que autorice reemplazarlos.
5. Regla sobre cargas superiores a 30 horas: el cuadro muestra hasta 30, y el prototipo extrapola por bloques. Debe ratificarse sin inventar otra regla.

## Validación manual del usuario

- [x] Crear un borrador; revisar fechas, errores, colores y navegación.
- [x] Editar equipo externo y nombramientos; guardar y recargar.
- [x] Probar horas enteras, negativas y decimales; revisar explicación CONS.
- [x] Probar actividad de 0,07 y rechazar una actividad excesiva en un proyecto de pocos días.
- [x] Revisar límites, barras azules y opciones de productos.
- [x] Abrir/cerrar secciones del expediente y de revisión final; cambiar tamaño de letra.
- [x] Corregir problema/objetivos de una devolución, guardar respuesta, recargar y reenviar a la misma instancia.
- [x] Ejecutar cargador voluntario; revisar borrador, evaluación, aval y resoluciones simuladas.

## Validación técnica y evidencias

- Investigador: **24 PASA**, incluidos errores por campo, fechas, horas, nombramiento, institución externa, límites, revisión, presupuesto y ciclo completo de subsanación. Se verificó también guardar y recargar el estado de gestión y la contrapartida. [Reporte](evidencias/2026-11-12T03-40-50-526Z-investigador/reporte.json).
- API: **33 PASA**, incluidos rechazo atómico de resumen excesivo y envío concurrente único. [Reporte](../evidencias/2026-11-12T03-32-04-778Z-regresion-api/reporte.json).
- Aprobación / rechazo CIE / rechazo de aval: **72 PASA y 6 NO APLICA**. [Reporte](../evidencias/2026-11-12T03-12-18-278Z-linea-base-api/reporte.json).
- VIE-Publicación: **14 PASA** tras los cambios compartidos. [Reporte](evidencias/2026-11-12T03-12-18-616Z-vie-publicacion/reporte.json).
- Cargador: **8 estados esperados verificados** mediante API, en la base aislada. [Reporte](evidencias/2026-11-12T03-31-19-367Z-carga-propuestas/reporte.json).
- Compilación completa y lint sin errores; se conservan las advertencias anteriores de Fast Refresh/efectos y tamaño del paquete. No se generan capturas. No se escribieron propuestas en la base de desarrollo.

Los intentos iniciales con fallos se conservan como trazabilidad. Se corrigieron interacción de radio, resumen de errores al guardar, revisión anidada y visibilidad del resultado del guardado. Al hacer obligatorio el resumen en el envío, se adaptaron las precondiciones de la prueba de concurrencia y se verificó que una operación inválida revierte también los demás campos enviados en ella.

## Cargar y revisar datos

```bash
./cargar-propuestas-demo.sh --pruebas --simular
./cargar-propuestas-demo.sh --pruebas
# Para la base habitual, tras revisar el perfil elegido:
./cargar-propuestas-demo.sh --desarrollo
```

Cada ejecución crea un lote nuevo de ocho expedientes, o la cantidad indicada con `--cantidad` (8–80). Identificados como DEMO; no modifica ni elimina expedientes existentes ni fuerza estados por SQL. Al fallar conserva los registros ya creados y un reporte. No envía mensajes externos. En pruebas use la aplicación conectada a `fondos_vie_test`, con `investigador@tec.ac.cr` / `prototipo2026`. Instrucciones completas en el [README principal](../../README.md).

Se reutiliza la columna `propuesta_subsanacion.respuesta` para guardar el texto antes del reenvío: **no hay una nueva migración**. Los datos históricos no se convierten automáticamente ni se atribuye validez institucional a los clones.

## Segunda ronda · 12/11/2026

[Ajustes de índice, equipo, calendarios y confirmación de correcciones](AJUSTES-INDICE-EQUIPO-Y-PRODUCTOS.md). Aclara nombramiento obligatorio al avanzar/enviar, CONS editable y azul para corrección guardada. Sustituye la deshabilitación del campo CONS descrita en la primera entrega.

## Aceptación del perfil

**12/11/2026:** el usuario completó la revisión manual y dio por listo el perfil Persona Investigadora Coordinadora. Se reabre únicamente si se detecta un error posterior. Esta aceptación incluye la segunda ronda de índice, equipo y productos; no implica aceptación de los perfiles siguientes.
