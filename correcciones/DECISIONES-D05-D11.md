# Decisiones e implementación · D05–D11

**Fecha:** 2 de noviembre de 2026. **Fuente de autorización:** indicaciones del usuario para implementar el resto de las correcciones. Este acuerdo amplía el alcance inicial de D01–D04; conserva sus restricciones de numeración, ámbito y decisiones cerradas.

## Acuerdos aplicados

| ID | Decisión y comportamiento implementado |
| --- | --- |
| **D05 · Comité** | **Tres evaluadores demo independientes**, cada uno con nota y justificación por criterio. Se importa la rúbrica completa: **22 criterios** básica/aplicada, **23** desarrollo tecnológico y **15** fortalecimiento; cada modalidad suma **100 puntos**. La asistencia confirma el dictamen consolidado después de las tres entregas. El Consejo no recibe expedientes sin consolidar. |
| **D06 · Archivos** | Carga real de **PDF/DOCX/XLSX**, máximo **10 MiB**, con binario en disco, metadatos, SHA-256, versiones y permisos por expediente. Cargar el mismo nombre crea otra versión. Retirar es una baja lógica; no borra versiones anteriores. Los documentos del seed sin binario no tienen descarga disponible. |
| **D08 · Idiomas** | **4–6 términos ES** y **abstract EN obligatorios al enviar**; los borradores pueden estar incompletos. **Keywords EN opcionales**, editables y persistidas; sin sustitución por ejemplos. |
| **D07 · Administración** | Alta, edición y baja lógica de usuarios, roles asignados y escuela; catálogos de escuelas, modalidades y líneas; publicación y retirada de rúbricas versionadas. Las modificaciones requieren motivo y auditoría. **No hay motor genérico de formularios**: su pestaña está deshabilitada y señalada fuera de alcance. |
| **D09 · Admin** | **No se implementa un override**. Admin mantiene las mismas precondiciones del negocio. No aprueba borradores, no omite PI ni subsanación y no reescribe resoluciones. |
| **D10 · Formulario** | Captura estructurada como fuente de verdad; Excel oficial descargable y adjuntable como respaldo. Coordinación/dependencia solo se reasignan por admin o VIE, con motivo, antes de iniciar evaluación, para conservar decisiones y ámbito. También se guardan TRL, líneas y titularidad de horas CONS. |
| **D11 · Rechazos** | Recomendación del Comité, aval del Consejo y resolución CIE son decisiones distintas. Un rechazo de aval se comunica al investigador y conserva estado **`rechazo_aval`** en Consejo. Reconsiderar exige solicitud motivada del coordinador y autorización motivada del Consejo; inicia otro ciclo y conserva íntegra la decisión anterior en auditoría. Solo CIE cierra como aprobada/rechazada con fundamento. |

## D05 · Cálculo, productos y ciclos

La nota individual se calcula en servidor como `Σ(peso × valoración / 10)`. El consolidado es el promedio de las tres notas ponderadas; no usa un promedio enviado por el navegador. Las valoraciones son **0, 6, 8 o 10**. Un requisito obligatorio con **0 o 6** determina recomendación desfavorable, aunque el promedio supere 70.

Los productos se verifican fuera de la suma de puntos: confirmación humana y cantidades estructuradas según horas. Para desarrollo tecnológico se aplica la **disposición 5.5**: un activo de la lista 5.5.a **más** productos académicos por cada diez horas, redondeando hacia arriba. El ámbito `activo_pi` identifica los productos de esa lista; los demás ámbitos registran los académicos. La elegibilidad y correspondencia con las opciones oficiales siguen requiriendo revisión humana.

Una recomendación desfavorable **informa al Consejo**, no crea una resolución CIE ni impide por sí sola su remisión. Se sigue la advertencia expresa de la rúbrica sobre conocimiento del Consejo y trámite posterior; no se inventa una decisión CIE automática.

Las notas entregadas son inmutables. Si Comité devuelve antes de confirmar su dictamen, la subsanación abre **otro ciclo de evaluaciones**, conservando las notas anteriores. La misma rúbrica permanece asociada al expediente. Cada guardado identifica el ciclo; una pantalla antigua recibe conflicto y debe recargarse. Una devolución de VIE no reabre el dictamen del Comité.

La asistencia puede sustituir a un evaluador **que aún no entregó**, con motivo y auditoría. Se mantienen sus borradores, sin contarlos en el consolidado. No se sustituyen notas entregadas ni miembros de un dictamen cerrado.

## Botones revisados

| Acción | Resultado real |
| --- | --- |
| **Guardar borrador** | Guarda y permite seguir editando el mismo expediente, sin crear otro. Indica guardado/error y evita salir por el enlace del expediente mientras está guardando. |
| **Guardar y salir** | Guarda y abre el expediente persistido. |
| **Enviar / reenviar** | Guarda, valida y cambia el circuito; el reenvío vuelve a la instancia que devolvió. |
| **Adjuntar / descargar / retirar** | Operan sobre binarios y versiones reales, con autorización del servidor. |
| **Descargar plantilla de presupuesto** | Descarga el XLSX oficial del repositorio. |
| **Guardar / completar evaluación** | Guarda el borrador individual o entrega la evaluación del ciclo actual. Completar no equivale a confirmar al Comité. |
| **Confirmar consolidado** | Verifica las tres entregas y registra dictamen y fundamento antes de mostrarlo al Consejo. |
| **Solicitar / autorizar nuevo ciclo de Consejo** | Registra solicitud, autorización, motivo y decisión anterior; nunca convierte directamente un rechazo en aprobación. |
| **Guardar registro / publicar versión** | Persiste cambios de administración y su auditoría; las versiones anteriores no se modifican. |

Se retiró el camino de “éxito demo local” de las evaluaciones. El estado y los mensajes operativos dependen de respuestas reales de la API. Las funciones excluidas permanecen deshabilitadas con explicación: motor de formularios, carga de imágenes/videos y generación automática de PDF de oficios. Registrar un número de oficio no se presenta como generar un PDF.

## Uso de los tres evaluadores

Seleccionar el rol **Comité · Evaluador** y escribir el correo correspondiente:

- `comite_evaluador@tec.ac.cr`
- `comite_evaluador2@tec.ac.cr`
- `comite_evaluador3@tec.ac.cr`

En una instalación demo usan `prototipo2026`. Las nuevas cuentas se crean copiando el hash del evaluador inicial; no se almacena una contraseña en texto plano. Se asignan tres evaluadores activos de la escuela al iniciar el Comité. Si faltan, admin debe completar sus cuentas/roles antes de continuar; no se inventan evaluadores.

## Persistencia e instalación

Aplicar migraciones **005, 006 y 007**, además de las anteriores. No reinicializar el volumen para actualizar.

```bash
./instalar.sh --pruebas --verificar
```

El instalador verifica API, D01–D04, D05–D11 y ambas baterías de navegador. Los archivos se conservan en `var/documentos/` para desarrollo y `var/documentos-pruebas/` para pruebas; `DOCUMENTOS_DIR` permite otra ubicación. Los directorios no se suben a Git. La desinstalación conserva documentos; `--purgar-datos` afecta al volumen PostgreSQL, no a los binarios guardados.

## Fuentes y revisión del equipo

- [Rúbricas oficiales](../docs/oficiales-vie/markdown/2-Rubricas_Investigacion_2027__Fondos_VIE.md): criterios, pesos, niveles, umbral, requisitos obligatorios y dictamen desfavorable.
- [Disposiciones](<../docs/oficiales-vie/markdown/1-Disposiciones Convocatoria Fondos VIE 2027.md>): 2.4, escala por horas; 5.5, productos de desarrollo; titularidad CONS.
- [Formulario oficial](<../docs/oficiales-vie/markdown/4- Formulario Proyecto Investigacion Fondos VIE 2027.md>): resumen, términos para indexación Orión, abstract y captura estructurada.

**Para discutir sobre la fuente, sin alterar sus datos silenciosamente:** los descriptores de “Experiencia académica del equipo sobre el tema” parecen invertidos en algunas hojas oficiales. Se conservaron literalmente; cualquier corrección debe acordarse y publicarse como nueva versión. Tres evaluadores es una decisión del prototipo autorizada por el usuario, no una afirmación sobre el quórum institucional real.

## Aceptación humana

- [ ] Revisar guardado parcial, reapertura del formulario y ausencia de duplicados.
- [ ] Subir, descargar y retirar archivos; revisar permisos y persistencia al reiniciar.
- [ ] Usar las tres cuentas, comprobar las notas y confirmar el consolidado.
- [ ] Devolver después de una entrega; comprobar el nuevo ciclo y las notas anteriores.
- [ ] Revisar productos por horas y las tres modalidades de rúbrica.
- [ ] Recorrer rechazo de aval, solicitud y autorización de nuevo ciclo; verificar auditoría.
- [ ] Verificar usuarios, bajas, catálogos, versiones y reasignación autorizada.
- [ ] Completar la revisión de pantallas, teclado, móvil y contenido institucional.

**Responsable:** ____________________ · **Fecha:** ____________________

**Observaciones / aceptación:** pendiente de revisión humana.
