# Persona Gestora VIE · revisión final

**Fecha local:** 13/11/2026. Implementación y validación integrada completadas; aceptación manual pendiente. Validación sin capturas y únicamente sobre `fondos_vie_test`, sin reiniciar desarrollo.

## Sustento y alcance del rol

[Análisis de personas, P6-a](../../docs/etapa1/Analisis-de-Personas-Fondos-VIE.md#p6--vie--cie-verificación-dictamen-y-resolución): la Persona Gestora revisa contenidos, completitud, ruta previa y comentarios al equipo investigador. El CIE resuelve aprobación o rechazo; VIE puede comentar, devolver para subsanación y remitir un expediente verificado, sin otorgar una nueva aprobación.

Las [Disposiciones oficiales 2027, sección 2.7](../../docs/oficiales-vie/markdown/1-Disposiciones%20Convocatoria%20Fondos%20VIE%202027.md) exigen avales formales, respaldos de participación, horas/nombramientos y aval de la calificación y dictamen del Comité. Esto sustenta la consulta del acuerdo y sus adjuntos además del formulario. La subdivisión de pantallas y permisos VIE/CIE usada en el prototipo corresponde al análisis P6; no se atribuye esa interfaz al documento oficial.

Los seis requisitos ya establecidos en [checklist-vie.json](../../shared/checklist-vie.json) se mantienen. Los desplegables, tamaños de lectura, confirmaciones y límite de 4000 caracteres del comentario son ajustes de usabilidad; ese límite técnico no se presenta como una regla académica oficial.

## Hallazgos y cambios

| Pantalla | Problema | Corrección |
| --- | --- | --- |
| Inicio | Indicadores deducidos del estado general; accesos iguales. | Conteos SQL del ámbito autorizado, con destinos y filtros distintos en Histórico. Error visible cuando no se pueden consultar. |
| Prioridades | Orden genérico por fecha de envío. | Solo expedientes comunicados a VIE y actualmente pendientes, por antigüedad de la comunicación; máximo cinco. |
| Evaluaciones | Información breve; respaldos separados de la verificación. | Dos paneles ampliables, información desplazable y seis apartados desplegables junto a sus marcas de revisión. |
| Expediente completo | Enlace poco visible y regreso a otra pantalla. | Botón azul de al menos 52 px; índice ocultable, letra ajustable, presupuesto, archivos y respaldos PI/Comité/aval. Regreso a la misma evaluación. |
| Verificación | Una lista sin consulta integrada ni guardado por apartado. | Guardado individual o global con estado pendiente/guardado/cambios sin guardar y progreso de requisitos persistidos. |
| Subsanación | Debía comprobarse que la subsanación no heredara verificación vigente del ciclo anterior. | Una devolución invalida las marcas anteriores como verificación vigente. El expediente corregido debe revisarse en el nuevo ciclo. |
| Remisión | Faltaba confirmación explícita. | Confirmación antes de remitir, checklist completo guardado obligatorio, salida de pendientes y consulta en Histórico. La API impide repetir fuera de etapa. |
| Comentarios | Sin límite visible. | Contador con barra azul y máximo 4000 caracteres, también validado por API para comentario/devolución VIE. |

## Indicadores y filtros

| Indicador | Criterio |
| --- | --- |
| Expedientes pendientes | Etapa VIE, aval aprobado y comunicado, sin subsanación activa. |
| Listos para CIE | Subconjunto de pendientes con verificación vigente completa y guardada. |
| Devueltos | Subsanación VIE activa, pendiente del reenvío investigador. |
| Remitidos al CIE | Existe un evento de remisión formal de VIE al CIE; incluye expedientes que avanzaron posteriormente. |

«Listos» forma parte de «Pendientes»: los indicadores no se suman como categorías excluyentes. Histórico combina estos filtros con los existentes y conserva el filtro al volver del expediente.

## Consulta y guardado

- Propuesta: formulario completo, presupuesto estructurado y anexos desde el botón azul.
- PI: dictamen emitido o certificación fundamentada de no requerimiento.
- Evaluación y oficio del Comité: consolidado confirmado, nota, recomendación, fundamento, fecha y responsable. Se consulta el registro digital existente; no se inventa un PDF.
- Aval: decisión, oficio, fundamento y registro real de comunicación a VIE.
- Respaldos: archivos persistidos y sus versiones descargables. Los históricos sin binario conservan la indicación de indisponibilidad.

Los desplegables conservan sus controles al contraerse. Cada botón de guardado individual persiste solo ese requisito y conserva otros cambios locales pendientes. Recargar conserva únicamente lo guardado. La marca «Documentos de respaldo» confirma la revisión del conjunto de adjuntos; no representa una firma individual por archivo ni una revisión automática de su contenido.

Superadministrador utiliza los mismos componentes al seleccionar la vista Persona Gestora VIE y conserva las precondiciones del flujo. Consultar un respaldo mantiene los controles de acceso por expediente.

## Validación automática

Comando específico: `pnpm regression:gestora-vie`, con `TEST_DATABASE_URL` apuntando exclusivamente a `fondos_vie_test`. Cubre API, archivos descargables, navegación, filtros, persistencia, subsanación, remisión, vista administrativa y ancho móvil de 390 px, sin capturas.

**Resultado:** 15 baterías aprobadas, **298 comprobaciones correctas y 6 casos no aplicables**, incluidas las 10 pruebas específicas de VIE. [Reporte integrado](evidencias/2026-11-13T08-08-29-738Z-validacion-actual/reporte.json) · [Reporte VIE](evidencias/2026-11-13T08-09-38-693Z-gestora-vie/reporte.json). Compilación correcta; lint sin errores, con advertencias preexistentes.

## Ajuste de confirmación · No / Sí

Se sustituyó «He revisado…» por una lista de requisitos con opciones exclusivas **No / Sí**, en ese orden. El estado pendiente/guardado se muestra en una línea independiente y el botón visible se simplificó a «Guardar revisión». Las opciones tienen un área de interacción mínima de 44 px y se distribuyen sin apretar el texto en móvil. El guardado individual y global conserva su funcionamiento. Compilación correcta y 10 pruebas VIE aprobadas, incluida persistencia y controles móviles: [reporte del ajuste](evidencias/2026-11-13T08-17-12-434Z-gestora-vie/reporte.json).

## Revisión manual del usuario

- [ ] Inicio: comprobar los cuatro indicadores y sus filtros de Histórico.
- [ ] Abrir una evaluación y ampliar cada panel; contraer y desplegar respaldos.
- [ ] Revisar PI, nota y oficio del Comité, aval y descargar un adjunto real.
- [ ] Abrir el expediente con el botón azul, revisar presupuesto/documentos y volver a la misma evaluación.
- [ ] Elegir «Sí» en un requisito, guardarlo, recargar y comprobar la persistencia; volver a «No» y guardar para desmarcarlo.
- [ ] Modificar dos marcas, guardar solo una y comprobar que la otra siga pendiente de guardar.
- [ ] Devolver con motivo/secciones, corregir como investigador y comprobar la nueva verificación pendiente en VIE.
- [ ] Completar y guardar requisitos, cancelar una remisión y después confirmarla; comprobar que sale de pendientes.
- [ ] Repetir la consulta en la vista VIE de Superadministrador.
