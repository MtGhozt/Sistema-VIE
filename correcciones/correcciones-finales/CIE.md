# CIE · revisión de evaluación y resolución

**Fecha local:** 13/11/2026. Implementación y validación integrada completadas. Aceptación manual pendiente. Sin capturas ni reinicio de la base de desarrollo.

## Sustento y límites del rol

- [Análisis de personas, P6-b](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md): CIE recibe el expediente completo, evalúa con rúbrica, registra observaciones y determina aprobación o rechazo. Necesita Comité, avales y PI; el formulario por sí solo no basta.
- [Disposiciones oficiales 2027, sección 2.7](../../docs/oficiales-vie/markdown/1-Disposiciones%20Convocatoria%20Fondos%20VIE%202027.md): los acuerdos de las instancias y el aval de la calificación/dictamen técnico son respaldos relevantes para la valoración del expediente. La sección 2.7.3 establece la información de acuerdos como base para CIE y Dirección de Investigación.
- [Rúbricas oficiales](../../docs/oficiales-vie/markdown/2-Rubricas_Investigacion_2027__Fondos_VIE.md): la rúbrica versionada del expediente conserva criterios, pesos, escala y justificaciones. Esta revisión no modifica esos valores ni añade un umbral automático de aprobación del CIE.
- [D09 y D11](../DECISIONES-D05-D11.md): sin override administrativo; rechazo de aval y rechazo CIE son decisiones distintas. CIE cierra con fundamento. Dirección de Investigación notifica.

Las ampliaciones, desplegables, contadores y límite técnico de 4000 caracteres del fundamento son ajustes de usabilidad; no se presentan como disposiciones académicas oficiales.

## Cambios y justificación

| Pantalla | Hallazgo | Resultado |
| --- | --- | --- |
| Inicio | Conteos derivados de estados generales, sin identificar el trabajo real de CIE. | Conteos API por ámbito, basados en remisión formal, evaluaciones CIE vigentes y resoluciones emitidas. |
| Prioridades | Lista genérica de expedientes. | Solo pendientes CIE, ordenados por la remisión formal más antigua, máximo cinco; excluye decisiones cerradas. |
| Evaluaciones | La condición `cie` excluía las herramientas de lectura del Cuerpo Evaluador. | Mismo diseño de dos paneles, ampliación de propuesta/evaluación, secciones contraíbles, progreso y círculo dinámico de nota. |
| Respaldos | Solo acceso breve al formulario. | Apartados para PI, Comité y oficio, aval y comunicación, archivos/plantilla presupuestaria, verificación VIE y resolución. Panel del expediente desplazable por sí mismo. |
| Expediente completo | Enlace pequeño y lectura menos cómoda. | Botón azul de al menos 52 px; índice ocultable, letra ajustable, presupuesto y adjuntos. Regreso a la misma evaluación y filtro. |
| Rúbrica al resolver | La interfaz enviaba notas, pero la acción de resolución no las persistía. | Si la petición incluye rúbrica, la API la valida y guarda como completada en la misma transacción que la resolución. Un error revierte ambos registros. |
| Fundamentos | Sin contador ni tamaño máximo visible. | Fundamento obligatorio, contador con barra azul, máximo 4000 caracteres y validación API. La pantalla exige justificar todos los criterios antes de resolver y conserva el guardado de borradores. |
| Histórico | Modal pequeño y filtros sin distinción propia de CIE. | Pantalla completa, filtros CIE, resolución fundamentada y rúbrica registrada consultables junto a los respaldos. |

La calificación y la recomendación son referencias de evaluación; no sustituyen la decisión fundamentada de CIE. El cambio guarda las notas que la pantalla ya enviaba: no inventa decisiones para registros antiguos. Si un histórico no tiene rúbrica CIE asociada al responsable, se informa su ausencia. Se mantiene compatibilidad con las resoluciones anteriores del prototipo.

## Indicadores

| Indicador | Criterio y destino |
| --- | --- |
| Pendientes de resolución | Etapa CIE, estado académico avalada y remisión formal registrada. Histórico `cie=pendientes`. |
| En evaluación | Subconjunto anterior con borrador de evaluación CIE del ciclo y rúbrica vigentes. Histórico `cie=en_evaluacion`. |
| Aprobadas | Resolución CIE aprobatoria real. Histórico `cie=aprobadas`. |
| Rechazadas | Resolución CIE de rechazo real; no incluye rechazo de aval del Consejo. Histórico `cie=rechazadas`. |

«En evaluación» está incluido en «Pendientes»: no deben sumarse como grupos excluyentes. Todos los conteos se calculan sobre el ámbito completo autorizado y no sobre los primeros 100 expedientes de la bandeja. Los accesos de prioridades abren la propuesta concreta para trabajarla. Un fallo de consulta muestra error y «—», sin inventar ceros ni tareas.

## Documentos y lectura

1. Propuesta, presupuesto estructurado y todas las secciones del formulario desde el botón azul.
2. Dictamen PI emitido o constancia fundamentada de no requerimiento.
3. Consolidado del Comité: nota, recomendación, oficio, fundamento, fecha y responsable.
4. Aval del Consejo y registro de comunicación a VIE.
5. Archivos adjuntos persistidos, con versiones y descarga; los documentos históricos sin binario indican indisponibilidad.
6. Verificación VIE guardada, responsable, fecha, seis requisitos y remisión formal.
7. Cuando se resuelve: número, resultado, fundamento, fecha, responsable y rúbrica CIE registrada.

Los oficios se consultan como registros digitales del prototipo; no se presentan como PDF institucional firmado. La vista CIE de Superadministrador usa estos mismos componentes y conserva las precondiciones del flujo. La Persona Gestora VIE mantiene el formato compartido de paneles ampliables y apartados desplegables con confirmación No/Sí ya validado, sin añadirle una rúbrica que corresponde a otros roles.

## ¿El rechazo cierra la propuesta para siempre?

**En el prototipo, una resolución de rechazo CIE cierra ese expediente para el flujo ordinario.** Queda en Histórico, conserva documentos y fundamento, y Dirección de Investigación puede notificarla. No se borra. La API impide volver a aprobarlo, editar su evaluación o utilizar la reconsideración de aval del Consejo para ignorar el rechazo. Admin tampoco puede saltarlo.

**Esto no establece que institucionalmente no pueda existir un recurso.** Los formatos oficiales de acuerdos de instancias académicas incluidos en el repositorio mencionan recursos contra esos acuerdos; no basta esa referencia para extrapolar automáticamente un procedimiento de reapertura CIE. El prototipo no implementa recursos/reaperturas de resoluciones CIE y esta revisión no añade uno sin acuerdo del equipo.

Si se requiere ese alcance, discutir únicamente: **qué recurso aplica a una resolución CIE, quién lo autoriza, sus plazos y qué nuevo ciclo auditado produce**. Hasta definirlo, se conserva el cierre aprobado en D11. Tampoco se garantiza aquí que copiar una propuesta en otra convocatoria constituya un recurso válido.

## Validación

Comando específico: `pnpm regression:cie`, con `TEST_DATABASE_URL` exclusivamente para `fondos_vie_test`.

**Resultado:** **16 baterías aprobadas, 308 comprobaciones correctas y 6 casos no aplicables**. Compilación correcta y lint sin errores (advertencias preexistentes). [Reporte integrado](evidencias/2026-11-13T08-31-39-575Z-validacion-actual/reporte.json) · [Reporte CIE](evidencias/2026-11-13T08-32-55-504Z-cie/reporte.json). La batería cubre remisión formal, cuatro filtros, paneles, documentos descargables, nota/progreso, persistencia, atomicidad, rechazo, notificación, Histórico, móvil y Superadministrador.

## Aceptación manual

- [ ] Comprobar los cuatro indicadores y el criterio de prioridades en Inicio.
- [ ] Contraer y ampliar los dos paneles; desplazarse por el expediente.
- [ ] Abrir el botón azul, revisar presupuesto/documentos y volver a la misma evaluación.
- [ ] Consultar PI, oficio del Comité, aval, verificación VIE y descargar un adjunto real.
- [ ] Cambiar notas y justificaciones; comprobar el círculo, contadores y progreso.
- [ ] Guardar, recargar y comprobar la evaluación recuperada.
- [ ] Cancelar una resolución y comprobar que no se emite; confirmar después con fundamento.
- [ ] Consultar resolución y rúbrica en Histórico; comprobar que desaparece de pendientes.
- [ ] Rechazar otro expediente y comprobar consulta, cierre y notificación sin reapertura automática.
- [ ] Repetir la consulta desde la vista CIE de Superadministrador y en pantalla estrecha.
