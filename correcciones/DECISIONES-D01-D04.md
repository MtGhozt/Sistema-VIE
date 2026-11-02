# Decisiones e implementación · D01–D04

**Actualización del 2 de noviembre:** el usuario amplió el alcance. Consultar [DECISIONES-D05-D11.md](DECISIONES-D05-D11.md), que resuelve los pendientes posteriores y el nuevo ciclo del Consejo.

**Fuente original:** instrucciones del usuario del 31 de octubre de 2026. Este documento registra el alcance de aquella etapa (D01–D04); D05–D11 se implementaron después por instrucción del usuario; este documento no los resuelve ni sustituye la aceptación del usuario.

## D01 · Numeración automática anual

- Código **`PROP-AAAA-NNN`**, asignado al crear la propuesta; no se puede imponer ni editar desde la API.
- Se adopta la alternativa **por año**, independiente de la convocatoria y del PK. El año corresponde a la creación, con zona horaria de Costa Rica; `NNN` tiene un mínimo de tres dígitos.
- Un contador anual bloqueado dentro de la transacción y el `UNIQUE` de `propuesta.codigo` protegen la concurrencia. Se toma en cuenta el mayor sufijo histórico existente de ese año.
- Los códigos existentes permanecen intactos. El contador conserva el máximo asignado aunque se elimine una propuesta: no rellena huecos.

**Justificación:** corrige el consecutivo global sin renumerar expedientes ni pedir al investigador que gestione identificadores.

## D02 · Consulta por ámbito

| Identidad | Expedientes visibles |
| --- | --- |
| Investigador | Sus propuestas; las enviadas en las que figure como integrante mediante su usuario registrado. Ser integrante no concede edición. |
| Asistente, Comité, Consejo, Dirección de Escuela, PI, VIE, CIE y Dirección de Investigación | Enviados de su escuela o con asignación expresa a ese usuario y rol. La bandeja mantiene además su filtro de etapa. |
| Admin | Enviados de cualquier ámbito y sus propios borradores. |

**Borradores ajenos: nunca**, incluso para admin, aplicando literalmente la restricción indicada. Listados, histórico, opciones de filtros, detalle y rutas de evaluación usan el ámbito del servidor. Las URL por código también consultan la API; se retiró el acceso directo a expedientes de la plantilla demo.

Cada instancia recibe sus observaciones y eventos propios, más un resumen de estados de las etapas anteriores. Los eventos históricos sin instancia registrada se presentan como resumen, sin revelar sus notas privadas. Investigador y admin conservan la consulta del expediente dentro del ámbito anterior.

Las asignaciones se registran en `propuesta_asignacion`; el CRUD para administrarlas corresponde al alcance pendiente de D07. Los encabezados demo deben corresponder a un usuario activo con ese rol en BD; el sistema continúa usando la autenticación demo existente.

**Justificación:** un filtro visual no impide consultar directamente una API ni protege borradores o comentarios internos.

## D03 · Devolución y subsanación

1. Comité o VIE seleccionan **secciones concretas del formulario** y registran un motivo. La propuesta pasa a **`en_subsanacion`**; se conserva quién devolvió, el ciclo y la instancia de retorno.
2. La persona coordinadora edita únicamente esas secciones. El formulario bloquea las demás y la API rechaza campos fuera del alcance. Código, convocatoria y necesidad de PI permanecen protegidos.
3. Guarda las secciones solicitadas y escribe una respuesta. El reenvío conserva las restricciones vigentes de declaración, resumen y palabras clave.
4. Regresa a **Comité** o **VIE**, según quién devolvió. No reinicia el circuito en otra instancia. VIE debe guardar una nueva verificación antes de remitir al CIE.

Una subsanación activa bloquea las acciones de evaluación y avance, también para admin. Se conservan devoluciones, respuestas y avisos; guardar una sección no certifica que su contenido sea correcto: la instancia debe revisarla de nuevo.

En VIE, **enviar comentario sin devolución** es informativo; **devolver para subsanación** exige secciones, habilita edición controlada y bloquea el avance. La acción informativa no crea una obligación de respuesta imposible de atender.

Los dictámenes y decisiones cerrados no se sobrescriben. Un rechazo formal del Consejo o CIE no puede ser convertido en aprobación por otra instancia. D09 no habilita un override. D11 permite un nuevo ciclo de Consejo con solicitud, fundamento y auditoría; no modifica una resolución CIE cerrada. D05 trata la recomendación negativa del Comité como informe al Consejo.

**Justificación:** devolver debe permitir una corrección real y trazable, sin abrir el expediente completo ni saltarse decisiones previas.

## D04 · Respaldo obligatorio de PI

| `requiere_dictamen_pi` | Evidencia exigida antes del avance |
| --- | --- |
| `true` | Dictamen **emitido**, con emisor y fecha. No se permite sustituirlo por «no requerido». |
| `false` | Certificación explícita de **«PI no requerido»**, con fundamento, responsable y fecha. El flag por sí solo no basta. |

Vinculación registra la evidencia; admin puede realizar la misma operación con su propia identidad y sin omitir requisitos. La API verifica este respaldo en las acciones de avance y decisión.

La certificación se guarda separada del dictamen para **no alterar documentos históricos**. Si un expediente antiguo abierto carece de respaldo válido, Vinculación puede incorporarlo sin retroceder su estado ni modificar una decisión emitida. No se inventan certificaciones durante la migración.

**Justificación:** ningún rol posterior puede decidir unilateralmente omitir PI; la evidencia queda asociada a una persona responsable.

## Instalación y comprobación

Aplicar las migraciones **003 y 004** con el instalador o `pnpm db:migrate`, indicando la base correspondiente. No reinicializar volúmenes para actualizar.

```bash
./instalar.sh --pruebas --verificar
# Comprobación específica sobre el entorno aislado ya preparado:
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:decisions
```

Los resultados ejecutados y sus límites están en [la validación D01–D04](evidencias/D01-D04-validacion.md) y [ESTADO-DE-REVISION.md](ESTADO-DE-REVISION.md). La rúbrica parcial existente se conserva: estas pruebas no certifican D05 ni la incorporación de la rúbrica oficial completa.

## Validación del usuario / equipo

- [ ] **D01:** revisar dos creaciones consecutivas y confirmar que ningún código histórico cambió.
- [ ] **D02:** comprobar dos escuelas, asignaciones, pertenencia al equipo y denegación de un borrador ajeno por URL.
- [ ] **D03:** devolver desde Comité y desde VIE; verificar edición restringida, respuesta, nuevo ciclo y destino del reenvío.
- [ ] **D04:** recorrer las dos ramas de PI y comprobar el bloqueo sin evidencia y la identidad del responsable.

**Responsable:** ____________________ · **Fecha:** ____________________

**Observaciones / aceptación:**

> Pendiente de revisión humana.
