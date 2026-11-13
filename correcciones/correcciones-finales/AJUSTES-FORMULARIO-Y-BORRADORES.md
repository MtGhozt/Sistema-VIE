# Ajustes de formulario, lectura y borradores

**Fecha local:** 13/11/2026. Implementación y validación integrada completadas. Aceptación manual pendiente. Sin capturas ni reinicio de desarrollo.

## Alcance autorizado

Cambios funcionales en **VIE–Publicación y Persona Investigadora Coordinadora**, sus accesos/datos compartidos y las vistas correspondientes de Superadministrador. La ampliación/reducción de letra también aplica a los demás perfiles que consultan el formulario o expediente con esos controles. No se cambian las atribuciones ni decisiones del resto de roles.

## Cambios y sustento

| Solicitud | Causa / sustento | Implementación |
| --- | --- | --- |
| Ocultar convocatorias borrador | Solo deben estar disponibles para la gestión de publicación. | API filtra listado y rechaza el acceso directo al detalle para roles sin permiso. VIE–Publicación y Superadministrador conservan acceso. Investigador no ve la opción de filtro «Borradores». |
| Letra en todas las secciones | Estilos heredados fijaban tamaños en títulos, ayudas, tablas, contadores y otros elementos. | Escala local compartida para todo el texto de las 17 secciones, sus controles y respaldos de lectura. Mantiene énfasis en títulos y el rango de tamaño base de 14–24 px. |
| Keywords EN 4–6 | Pedido del usuario; D08 mantiene EN opcional y el formulario oficial no indica inequívocamente que sea obligatorio. | Vacío permitido; cuando se completa debe tener 4–6 términos separados por comas. Error específico al avanzar/validar el formulario y en API al enviar. El borrador API conserva la posibilidad de guardar contenido parcial. |
| Agregar tipos de horas | El adaptador eliminaba la nueva fila vacía al reconstruir el formulario. | Conserva filas en edición, normaliza tipos/cantidades y evita que datos auxiliares antiguos sobrescriban horas estructuradas distintas. Funciona para varias personas TEC; persiste las horas completas sin tipos repetidos. |
| Cuadros 2 y 3 sin 1 visible | El formulario oficial reserva el cuadro 1 para la escala TRL, que no se muestra en todas las modalidades. | Títulos de pantalla «Personas investigadoras del TEC» y «Personas colaboradoras externas». No renumera ni modifica el formulario oficial. |
| Riesgo creado automáticamente | Se agregaba una fila vacía junto con cada actividad. | Una actividad nueva empieza sin riesgos. El usuario pulsa «Agregar riesgo»; el nuevo campo recibe foco y se desplaza a la vista. Se respeta movimiento reducido. Puede quitar todas las filas y volver a agregarlas. |
| Importes vacíos | Ausencias y valores vaciados se representaban con cadena vacía. | Montos de presupuesto y financiamiento se muestran como 0; al borrar un importe queda 0. Textos como oficios se conservan como texto, sin ponerles un cero. |
| Superadministrador | Usa las mismas pantallas y componentes de los roles. | Hereda los ajustes de formulario/lectura y conserva la gestión transversal de borradores. No se crea una variante incompleta del formulario. |

**Fuentes:** [Formulario oficial 2027](../../docs/oficiales-vie/markdown/4-%20Formulario%20Proyecto%20Investigacion%20Fondos%20VIE%202027.md) — resumen, equipo y cuadros 1–3; [D05–D11](../DECISIONES-D05-D11.md) — D08; [rúbrica oficial](../../docs/oficiales-vie/markdown/2-Rubricas_Investigacion_2027__Fondos_VIE.md) — riesgo y mitigación por actividad.

## Reglas que se conservan

- ES requiere 4–6 términos. EN sigue opcional, con cardinalidad 4–6 si se utiliza. No se rellenan términos de demostración automáticamente.
- El formulario exige al menos un riesgo completo por actividad antes de avanzar. Que no aparezca una fila automática no elimina ese requisito.
- Las horas siguen siendo enteras y no negativas; los tipos no se repiten dentro de una persona. CONS conserva la identificación de su titular cuando corresponde.
- Cero es un valor válido para una partida. El presupuesto total del proyecto debe seguir siendo mayor que cero; mostrar ceros no sustituye esa validación.
- Las convocatorias borrador no se ocultan solo mediante botones: la restricción está en el servidor. Superadministrador conserva su acceso autorizado transversal.

**Límite documental sobre personas externas:** el cuadro oficial de externos pide nombre, ORCID e institución; los tipos de carga TEC corresponden al cuadro de funcionarios. Se corrigió «Agregar otro tipo de horas» para las personas TEC. Si el equipo quiere incorporar cargas a externos, debe acordarlo explícitamente, porque no es un campo previsto en ese cuadro oficial.

## Validación

Comando específico: `pnpm regression:formulario-permisos`, con `TEST_DATABASE_URL` exclusivamente para `fondos_vie_test`.

**Resultado:** **18 baterías aprobadas, 327 comprobaciones correctas y 6 casos no aplicables**, incluidas las 10 comprobaciones específicas de esta entrega. Compilación correcta y lint sin errores, con advertencias preexistentes. [Reporte integrado](evidencias/2026-11-13T09-06-47-192Z-validacion-actual/reporte.json) · [Reporte específico](evidencias/2026-11-13T09-08-23-606Z-formulario-permisos/reporte.json). Incluyen todos los textos visibles de los 17 pasos, lectura institucional, permisos de listado/detalle, formulario y persistencia de horas de distintas personas, foco/desplazamiento de riesgos, presupuesto y Superadministrador. Las mediciones esperan las transiciones de tamaño de los controles; no usan capturas.

## Revisión manual

- [ ] En VIE–Publicación, consultar y editar un borrador de convocatoria.
- [ ] Como investigador, comprobar que no aparece en listado/filtros ni abre mediante enlace directo.
- [ ] Ampliar y reducir letra en las 17 secciones; revisar títulos, ayudas, contadores, tablas y campos.
- [ ] Comprobar la lectura con otros perfiles y sus respaldos.
- [ ] Probar EN vacío, con 3, con 4–6 y con 7 términos; revisar el error específico.
- [ ] Agregar tipos de horas a dos personas TEC, guardar y recargar.
- [ ] Agregar una actividad y comprobar que no tenga un riesgo automático.
- [ ] Agregar un riesgo y comprobar que se enfoca y queda visible; completar su información.
- [ ] Borrar una partida y comprobar el 0; guardar con un total positivo y recargar.
- [ ] Repetir la consulta en las vistas VIE–Publicación, Investigador y lectura de Superadministrador.
