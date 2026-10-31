# Cosas a discutir · Decisiones del equipo

> Pendientes de acuerdo. No son requisitos nuevos ni autorizaciones implícitas. El usuario autorizó corregir los fallos sustentados sin esperar V0 y separar aquí las ambigüedades; las validaciones del usuario siguen pendientes.

| ID | Tema y evidencia | Decisión que falta | Qué sí puede corregirse sin inventar la regla |
| --- | --- | --- | --- |
| D01 | INC-01: código único con formato `PROP-año-consecutivo`; las fuentes no indican reinicio. | ¿Consecutivo anual o global? ¿Cómo tratar agotamientos/colisiones heredadas? | Transacción, rollback y respuesta controlada; nunca caer la API ni alterar códigos históricos. No se cambia la estrategia de numeración hasta el acuerdo. |
| D02 | GEN-01: todos los roles tienen consulta histórica según análisis de personas. | Alcance por escuela/asignación; acceso a borradores ajenos; permisos del detalle histórico. | Respetar permisos ya definidos y no convertir filtros de UI en autorización. |
| D03 | CTA-02 / ADI-09: el modelo contempla observaciones, respuestas y ciclos, pero edición actual solo en borrador. | Estado de subsanación, campos reabiertos, instancia de retorno, nuevas evaluaciones y reapertura de decisiones. | Conservar observaciones, evitar arrastre entre expedientes y no sobrescribir decisiones cerradas. |
| D04 | FLU-01: recorrido institucional y PI condicional están documentados; enteros actuales agrupan roles. | Matriz de transición exacta, revisión de PI «no requerida» y requisitos para cada remisión/subsanación. | Rechazar acciones de roles ajenos, decisiones después del cierre y notificaciones sin resolución. No inventar nuevas etapas. |
| D05 | CTE-01 / ADI-04: cinco integrantes, notas independientes y rúbrica oficial. | Identidad de cada evaluador demo, reemplazos, consolidación y tratamiento de recomendación negativa. | Guardar criterios y notas humanas; no inventar promedio 80 ni registrar siempre «recomienda». |
| D06 | GEN-04: adjuntos reales ausentes; accesibilidad describe carga binaria fuera del prototipo. | Incluir carga real en esta entrega, tipos/tamaño, almacenamiento, versiones, retención y PDF de oficios. | Identificar documentos simulados, no atribuir adjuntos inexistentes y no ofrecer botones activos sin acción. |
| D07 | ADM-01: administración completa excede CU1–CU5; motor genérico de formularios excluido. | CRUD administrativo incluido, catálogos y versionado de formularios/rúbricas. | Proteger ruta admin y mostrar de forma explícita lo no implementado. |
| D08 | INV-04: resumen máximo 500 palabras y entre 4 y 6 términos; borrador admite guardado parcial. | Otros límites no documentados; obligación y validación de keywords EN. | Contar palabras del resumen, advertir límites y validar al enviar sin impedir guardar un borrador incompleto. |
| D09 | ADM-02: admin opera transversalmente, sin norma de excepciones. | Si existen anulaciones administrativas, motivo, auditoría y autorización. | Mantener identidad administrativa y separar filtro de vista del permiso; no asumir excepción de negocio automática. |
| D10 | INV-01/03: formulario oficial sí exige equipos, plan, presupuesto, productos, ética y hoja de ruta. | Captura estructurada frente a Excel adjunto; elección de personas/catálogos; reglas condicionales no transcritas y propiedad de la dependencia coordinadora. | Habilitar y persistir textos oficiales ya modelados. No crear validaciones arbitrarias de horas/productos sin transcripción verificable. |
| D11 | Notificación de rechazo de Consejo no equivale a resolución CIE. | Quién notifica ese rechazo, plantilla y eventual reconsideración. | No inventar una resolución CIE para notificar un rechazo de aval. |

## Registro de acuerdos

Copiar una fila por acuerdo y citar la fuente o la decisión explícita del equipo.

| Tema | Acuerdo | Participantes / fecha | Fuente o confirmación | Implementación / prueba |
| --- | --- | --- | --- | --- |
| Pendiente | | | | |
