# Validación del flujo · Registro de pruebas y revisión del usuario

> **Plan asociado:** [PLAN-DE-CORRECCIONES.md](PLAN-DE-CORRECCIONES.md)  
> **Estado inicial:** pruebas funcionales y visuales pendientes. La revisión estática, el build fallido y el lint ejecutado se documentan en el plan.  
> Este archivo se completa **antes de corregir**, por bloque y en la aceptación final. Un checkbox vacío no significa aprobado.

## Datos de cada ejecución

Copiar este bloque por ejecución; conservar la línea base original.

| Campo | Valor por completar |
| --- | --- |
| Tipo | Línea base / bloque / regresión / aceptación final |
| Fecha y hora · Costa Rica | |
| Rama y SHA | |
| Responsable de prueba | |
| URL frontend y API | |
| BD y conjunto de datos de prueba | |
| Versión/migraciones aplicadas | |
| Navegador, versión, ancho/alto y zoom | |
| Roles autenticados y vistas utilizadas | |
| Carpeta de evidencias | `correcciones/evidencias/<ejecucion>/` |
| Incidencias conocidas antes de empezar | |

Preparación:

- [ ] Confirmar que la BD es de prueba y no contiene trabajo compartido que se pueda alterar.
- [ ] Registrar estado de compilación, typecheck y lint.
- [ ] Verificar health con BD conectada; identificar API/demo en la pantalla.
- [ ] Preparar cuentas de los 12 roles y al menos dos personas investigadoras de dependencias distintas.
- [ ] Preparar escenarios con PI requerida y no requerida, aprobación, rechazo Consejo, rechazo CIE, subsanación y control de acceso.
- [ ] Usar expedientes nuevos para recorridos completos; los fixtures preavanzados solo verifican tareas aisladas.

## Casos funcionales antes y después

Valores permitidos: **PENDIENTE**, **PASA**, **FALLA**, **BLOQUEADO** o **NO APLICA — motivo aprobado**. Separar el resultado inicial del final; no borrar evidencia de fallos. Si el caso no es alcanzable, anotar la dependencia que lo bloquea e intentar los demás casos independientes.

| Caso | Acción y resultado esperado | Antes | Después / SHA / evidencia |
| --- | --- | --- | --- |
| F01 | Login de cada rol, contraseña incorrecta, sesión ausente y cierre de sesión: permisos y mensajes correctos. | PENDIENTE | |
| F02 | VIE Publicación crea/edita convocatoria e hitos, publica y cierra; se recuperan los cambios. | PENDIENTE | |
| F03 | Investigadora crea borrador con un único ID y vuelve a abrirlo tras F5. | PENDIENTE | |
| F04 | Guardar los 17 pasos, incluidos fechas, preguntas, arte, referencias, declaración, ética y hoja de ruta; comparar valores. | PENDIENTE | |
| F05 | Resumen 500/501 palabras; 3/4/6/7 términos clave; ES/EN no se mezclan ni se borran. | PENDIENTE | |
| F06 | Agregar/editar/quitar integrantes internos y externos, horas, tipos y periodos; no arrastrar ejemplos. | PENDIENTE | |
| F07 | Objetivos, actividades, cronograma y riesgos conservan responsables y relaciones tras recarga. | PENDIENTE | |
| F08 | Presupuesto anual, duraderos y financiamiento: totales correctos, negativos rechazados y valores persistidos. | PENDIENTE | |
| F09 | Productos y resguardo coherentes con modalidad/horas; ética y permisos condicionales. | PENDIENTE | |
| F10 | Subir, abrir, descargar y sustituir un archivo; recuperar versión y alt text después de reiniciar servicios. | PENDIENTE | |
| F11 | Guardar borrador y Guardar y salir: éxito solo tras persistencia; error conserva datos y no crea duplicados. | PENDIENTE | |
| F12 | Envío incompleto desde wizard y detalle rechazado; envío válido cambia estado e historial una sola vez. | PENDIENTE | |
| F13 | PI requerida: dictamen completo, oficio, emisión y recuperación; no avanzar si falta. | PENDIENTE | |
| F14 | PI no requerida: ruta explícita y justificada, sin exigir oficio innecesario. | PENDIENTE | |
| F15 | Asistente Comité persiste checklist y remite solo si el expediente está completo. | PENDIENTE | |
| F16 | Devolución → corrección → respuesta → nueva revisión; repetir y conservar ambos ciclos y motivos. | PENDIENTE | |
| F17 | Cada integrante del Comité guarda notas/justificaciones; F5 y sesión distinta recuperan las suyas. | PENDIENTE | |
| F18 | Consolidado solo con evaluaciones necesarias; pesos oficiales, recomendación negativa y obligatorio deficiente correctos. | PENDIENTE | |
| F19 | Asistente Consejo prepara sesión y remite expediente con nota/oficio reales. | PENDIENTE | |
| F20 | Consejo aprueba aval con fundamento; queda consultable y deja de ofrecer acciones indebidas. | PENDIENTE | |
| F21 | Consejo rechaza aval con fundamento; no se continúa como avalado y se conserva la trazabilidad. | PENDIENTE | |
| F22 | Dirección de Escuela comunica aval existente; vista previa corresponde al expediente y no es un botón inerte. | PENDIENTE | |
| F23 | VIE verifica checklist real; observación se registra, llega, se responde y se resuelve antes de remitir si bloquea. | PENDIENTE | |
| F24 | CIE guarda rúbrica y aprueba con fundamento propio; recuperar resolución y criterios. | PENDIENTE | |
| F25 | CIE rechaza con fundamento propio; vacío no pasa; error no cierra el diálogo ni borra texto. | PENDIENTE | |
| F26 | Dirección de Investigación comunica cada resolución; aviso llega a la coordinadora y no se duplica por reintento. | PENDIENTE | |
| F27 | Campana/página muestran avisos reales del destinatario; marcar leído y cambiar de sesión no mezcla usuarios. | PENDIENTE | |
| F28 | Histórico filtra escuela, investigadora, línea, estado y año, solos/combinados, con resultados conocidos y ámbito correcto. | PENDIENTE | |
| F29 | Detalle y ficha histórica muestran datos/documentos del expediente, sin plantilla demo ni oficios ficticios. | PENDIENTE | |
| F30 | Admin cambia vista y bandeja manteniendo identidad; no puede saltar etapas ni resolver borradores. | PENDIENTE | |
| F31 | Usuario no autorizado intenta URL directa, detalle/archivo ajeno y acción API de otro rol: se rechaza. | PENDIENTE | |
| F32 | Dos decisiones concurrentes, doble clic y repetición tras cierre: sin sobrescritura ni efectos duplicados. | PENDIENTE | |
| F33 | API vacía o desconectada: mensaje inequívoco; no aparece trabajo demo como si fuese real. | PENDIENTE | |
| F34 | Cambiar expediente A→B no conserva dictamen, checks, notas, fundamento ni observaciones de A. | PENDIENTE | |
| F35 | Inicio y progreso reflejan datos reales o simulación identificada; no anuncian completitud falsa. | PENDIENTE | |
| F36 | Administración cumple operaciones aprobadas; cambios persisten y se protegen referencias en uso. | PENDIENTE | |
| F37 | Actualizar una BD existente aplica migraciones sin borrar datos; también funciona una instalación nueva. | PENDIENTE | |

### Registro de un fallo

- **Caso / hallazgo del informe:**
- **Rol autenticado / vista / expediente / origen API o demo:**
- **Pasos exactos:**
- **Resultado esperado:**
- **Resultado observado:**
- **Respuesta HTTP o error de consola, si corresponde:**
- **Evidencia y SHA:**
- **Prioridad / dependencia bloqueada:**
- **Corrección y resultado de repetición:**

## Cobertura de los 17 pasos

En cada fila comprobar captura, guardado y relectura por API, F5, salida/reingreso y presentación en detalle donde aplique. Para datos no aplicables, guardar la condición y su motivo; no insertar contenido de ejemplo.

| Paso | Captura / validación | Guardado y F5 | Observaciones del usuario |
| --- | --- | --- | --- |
| 1 · Datos y preguntas generales | PENDIENTE | PENDIENTE | |
| 2 · Resumen y palabras clave | PENDIENTE | PENDIENTE | |
| 3 · Equipo de investigación | PENDIENTE | PENDIENTE | |
| 4 · Problema y objetivos | PENDIENTE | PENDIENTE | |
| 5 · Estado del arte | PENDIENTE | PENDIENTE | |
| 6 · Metodología | PENDIENTE | PENDIENTE | |
| 7 · Plan de acción y riesgos | PENDIENTE | PENDIENTE | |
| 8 · Presupuesto y financiamiento | PENDIENTE | PENDIENTE | |
| 9 · Compromisos de productos | PENDIENTE | PENDIENTE | |
| 10 · Resguardo de productos | PENDIENTE | PENDIENTE | |
| 11 · Divulgación y socialización | PENDIENTE | PENDIENTE | |
| 12 · Aspectos éticos | PENDIENTE | PENDIENTE | |
| 13 · Hoja de ruta | PENDIENTE | PENDIENTE | |
| 14 · Referencias | PENDIENTE | PENDIENTE | |
| 15 · Declaración jurada | PENDIENTE | PENDIENTE | |
| 16 · Documentación | PENDIENTE | PENDIENTE | |
| 17 · Revisión y envío | PENDIENTE | PENDIENTE | |

## Revisión visual y accesibilidad

Probar al menos escritorio 1440×900, tableta 768×1024 y móvil 390×844, y zoom de navegador 100 % y 200 %. Son condiciones de prueba propuestas, no una declaración de compatibilidad total. Registrar navegador y ampliar tamaños si aparece un problema.

| Pantalla / panel | Lectura y textos | Sin recortes/superposición | Teclado, foco y contraste | Evidencia / observación |
| --- | --- | --- | --- | --- |
| Login y mensajes de error | PENDIENTE | PENDIENTE | PENDIENTE | |
| Inicio por rol y admin | PENDIENTE | PENDIENTE | PENDIENTE | |
| Convocatorias, editor y cronograma | PENDIENTE | PENDIENTE | PENDIENTE | |
| Propuestas, búsqueda y estados | PENDIENTE | PENDIENTE | PENDIENTE | |
| Wizard completo: cada uno de sus 17 pasos | PENDIENTE | PENDIENTE | PENDIENTE | |
| Detalle, pestañas, documentos y actividad | PENDIENTE | PENDIENTE | PENDIENTE | |
| Vinculación | PENDIENTE | PENDIENTE | PENDIENTE | |
| Asistente Comité y modal devolución | PENDIENTE | PENDIENTE | PENDIENTE | |
| Cuerpo evaluador y rúbrica | PENDIENTE | PENDIENTE | PENDIENTE | |
| Asistente Consejo | PENDIENTE | PENDIENTE | PENDIENTE | |
| Consejo y modales de aval/rechazo | PENDIENTE | PENDIENTE | PENDIENTE | |
| Dirección de Escuela y vista previa | PENDIENTE | PENDIENTE | PENDIENTE | |
| Gestora VIE | PENDIENTE | PENDIENTE | PENDIENTE | |
| CIE y modales aprobación/rechazo | PENDIENTE | PENDIENTE | PENDIENTE | |
| Dirección de Investigación | PENDIENTE | PENDIENTE | PENDIENTE | |
| Histórico, filtros y modal de detalle | PENDIENTE | PENDIENTE | PENDIENTE | |
| Campana, popover y notificaciones | PENDIENTE | PENDIENTE | PENDIENTE | |
| Administración y cambio de vista | PENDIENTE | PENDIENTE | PENDIENTE | |

Comprobar Tab/Shift+Tab, flechas en pestañas/radios, Escape, foco inicial y de retorno, anuncio de errores y lector de pantalla disponible. Para cada superposición guardar captura antes/después, elemento que tapa el diálogo, posición de scroll y condición reproducible. Las comprobaciones automáticas no reemplazan la lectura y navegación manual.

## Espacios de validación del usuario

Solo el usuario o una confirmación explícita suya puede completar una aceptación. Antes de cada pausa, el implementador debe adjuntar evidencia y pasos de prueba. Si se rechaza, corregir y repetir la validación del mismo bloque antes de seguir.

### V0 · Línea base y políticas

**Momento:** Antes de C03 y del bloque B.

| Campo | Espacio para completar |
| --- | --- |
| SHA / rango de commits entregados | |
| Casos ejecutados y resultados | |
| Enlaces a evidencia y datos para probar | |
| Qué debe comprobar el usuario | |
| Fecha de revisión del usuario | |
| Observaciones del usuario | |
| Cambios solicitados | |
| Respuesta y nueva evidencia del implementador | |

- [ ] El usuario validó este bloque y autorizó continuar.
- [ ] El usuario solicitó ajustes; continuar pendiente.

**Confirmación textual del usuario:**

> Pendiente.

### V1 · Decisiones y permisos

**Momento:** Después de C07.

| Campo | Espacio para completar |
| --- | --- |
| SHA / rango de commits entregados | |
| Casos ejecutados y resultados | |
| Enlaces a evidencia y datos para probar | |
| Qué debe comprobar el usuario | |
| Fecha de revisión del usuario | |
| Observaciones del usuario | |
| Cambios solicitados | |
| Respuesta y nueva evidencia del implementador | |

- [ ] El usuario validó este bloque y autorizó continuar.
- [ ] El usuario solicitó ajustes; continuar pendiente.

**Confirmación textual del usuario:**

> Pendiente.

### V2 · Formulario y persistencia

**Momento:** Después de C17.

| Campo | Espacio para completar |
| --- | --- |
| SHA / rango de commits entregados | |
| Casos ejecutados y resultados | |
| Enlaces a evidencia y datos para probar | |
| Qué debe comprobar el usuario | |
| Fecha de revisión del usuario | |
| Observaciones del usuario | |
| Cambios solicitados | |
| Respuesta y nueva evidencia del implementador | |

- [ ] El usuario validó este bloque y autorizó continuar.
- [ ] El usuario solicitó ajustes; continuar pendiente.

**Confirmación textual del usuario:**

> Pendiente.

### V3 · Archivos, PI y subsanación

**Momento:** Después de C21.

| Campo | Espacio para completar |
| --- | --- |
| SHA / rango de commits entregados | |
| Casos ejecutados y resultados | |
| Enlaces a evidencia y datos para probar | |
| Qué debe comprobar el usuario | |
| Fecha de revisión del usuario | |
| Observaciones del usuario | |
| Cambios solicitados | |
| Respuesta y nueva evidencia del implementador | |

- [ ] El usuario validó este bloque y autorizó continuar.
- [ ] El usuario solicitó ajustes; continuar pendiente.

**Confirmación textual del usuario:**

> Pendiente.

### V4 · Evaluación y cierre institucional

**Momento:** Después de C27.

| Campo | Espacio para completar |
| --- | --- |
| SHA / rango de commits entregados | |
| Casos ejecutados y resultados | |
| Enlaces a evidencia y datos para probar | |
| Qué debe comprobar el usuario | |
| Fecha de revisión del usuario | |
| Observaciones del usuario | |
| Cambios solicitados | |
| Respuesta y nueva evidencia del implementador | |

- [ ] El usuario validó este bloque y autorizó continuar.
- [ ] El usuario solicitó ajustes; continuar pendiente.

**Confirmación textual del usuario:**

> Pendiente.

### V5 · Presentación y soporte

**Momento:** Después de C31.

| Campo | Espacio para completar |
| --- | --- |
| SHA / rango de commits entregados | |
| Casos ejecutados y resultados | |
| Enlaces a evidencia y datos para probar | |
| Qué debe comprobar el usuario | |
| Fecha de revisión del usuario | |
| Observaciones del usuario | |
| Cambios solicitados | |
| Respuesta y nueva evidencia del implementador | |

- [ ] El usuario validó este bloque y autorizó continuar.
- [ ] El usuario solicitó ajustes; continuar pendiente.

**Confirmación textual del usuario:**

> Pendiente.

### V6 · Aceptación del flujo completo

**Momento:** Candidato C32.

| Campo | Espacio para completar |
| --- | --- |
| SHA / rango de commits entregados | |
| Casos ejecutados y resultados | |
| Enlaces a evidencia y datos para probar | |
| Qué debe comprobar el usuario | |
| Fecha de revisión del usuario | |
| Observaciones del usuario | |
| Cambios solicitados | |
| Respuesta y nueva evidencia del implementador | |

- [ ] El usuario validó este bloque y autorizó continuar.
- [ ] El usuario solicitó ajustes; continuar pendiente.

**Confirmación textual del usuario:**

> Pendiente.

## Bitácora de commits reales

Completar durante la implementación; estos renglones no crean commits. Si cambia el alcance, actualizar también el plan y mantener al menos 20 commits sustantivos.

| Plan | SHA real | Pruebas / evidencia | Hallazgos cerrados | Validación del usuario |
| --- | --- | --- | --- | --- |
| C01 | | | | |
| C02 | | | | |
| C03 | | | | |
| C04 | | | | |
| C05 | | | | |
| C06 | | | | |
| C07 | | | | |
| C08 | | | | |
| C09 | | | | |
| C10 | | | | |
| C11 | | | | |
| C12 | | | | |
| C13 | | | | |
| C14 | | | | |
| C15 | | | | |
| C16 | | | | |
| C17 | | | | |
| C18 | | | | |
| C19 | | | | |
| C20 | | | | |
| C21 | | | | |
| C22 | | | | |
| C23 | | | | |
| C24 | | | | |
| C25 | | | | |
| C26 | | | | |
| C27 | | | | |
| C28 | | | | |
| C29 | | | | |
| C30 | | | | |
| C31 | | | | |
| C32 | | | | |
