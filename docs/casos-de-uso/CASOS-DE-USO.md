# Casos de uso — Prototipo funcional Sistema VIE

Definidos a partir de:
- `docs/cerebro/02-DOMINIO-VIE.md` (flujo institucional + 3 módulos)
- `docs/etapa1/Contexto-Proyecto-Fondos-VIE.md` y Análisis de Personas
- Alcance mínimo oficial: **crear → completar → enviar → revisar → aprobar/rechazar → histórico**
- Rúbrica: cada CU debe ser **completo**, con **persistencia CRUD** y **proceso comprensible**

> Estos 5 CUs son el alcance **demostrable** del prototipo. No intentan digitalizar cada sub-rol (asistente a/b/c); agrupan el flujo en piezas implementables.

---

## Mapa rápido

| CU | Nombre | Actor principal | Módulo |
|---|---|---|---|
| CU1 | Gestionar convocatoria | VIE (publicación) | Gestión |
| CU2 | Formular y enviar propuesta | Persona investigadora coordinadora | Redacción |
| CU3 | Revisar expediente y dictaminar PI | Vinculación + revisión de completitud | Evaluación (previa) |
| CU4 | Evaluar con rúbrica y resolver | Comité / Consejo / CIE (vista unificada por etapa) | Evaluación |
| CU5 | Consultar histórico de propuestas | Cualquier rol autorizado / consulta | Histórica |

---

## CU1 — Gestionar convocatoria

**Actor:** VIE — publicación  
**Objetivo:** Publicar y administrar la convocatoria Fondos VIE y su cronograma.

### Flujo principal
1. Ingresar como VIE.
2. Crear convocatoria (nombre, fechas, descripción, presupuesto estimado).
3. Agregar/editar hitos del cronograma.
4. Publicar (estado `activa`) o dejar en borrador.
5. Consultar convocatorias existentes; cerrar cuando corresponda.

### CRUD / persistencia
| Operación | Entidades |
|---|---|
| Create | `convocatoria`, `convocatoria_hito` |
| Read | listado y detalle |
| Update | datos, hitos, estado |
| Delete | hitos; convocatoria solo si política lo permite (o soft-delete vía estado) |

### Evidencia rúbrica
- Flujo claro de publicación.
- Datos persisten en PostgreSQL tras recargar.

---

## CU2 — Formular y enviar propuesta

**Actor:** Persona investigadora coordinadora  
**Objetivo:** Crear, completar y enviar una propuesta a la convocatoria vigente.

### Flujo principal
1. Elegir convocatoria activa.
2. Crear borrador de propuesta (título, modalidad, escuela).
3. Completar secciones: problema, objetivos, metodología, equipo + **horas tipificadas**, presupuesto, plan/riesgos, TRL actual/esperado, keywords ES/EN, ética/PI según corresponda.
4. Adjuntar / marcar documentos (formulario, plan, presupuesto).
5. Guardar borrador (parcial) y **enviar** a revisión (cambia estado/etapa).

### CRUD / persistencia
| Operación | Entidades principales |
|---|---|
| Create/Update | `propuesta`, `propuesta_objetivo_especifico`, `propuesta_participante`, `propuesta_participante_hora`, `propuesta_palabra_clave`, `propuesta_presupuesto_anual`, `propuesta_financiamiento`, `propuesta_producto`, `actividad_plan`, `actividad_riesgo`, `propuesta_documento`, `aspecto_etico`… |
| Read | ficha de propuesta en edición |
| Delete | ítems hijos (objetivo, participante, riesgo, etc.) |

### Evidencia rúbrica
- Proceso de redacción entendible por secciones.
- Guardado real (no solo memoria del navegador).

---

## CU3 — Revisar expediente y dictaminar PI

**Actores:** Centro de Vinculación (dictamen PI); rol de revisión de completitud (asistente Comité / gestora — según etapa).  
**Objetivo:** Verificar expediente y registrar dictamen de propiedad intelectual u observaciones de devolución.

### Flujo principal
1. Ver bandeja de propuestas en etapa de revisión previa.
2. Abrir expediente (datos + documentos).
3. Completar checklist de completitud / dejar observación (requiere respuesta si aplica).
4. Si aplica PI: emitir **dictamen PI** (oficio, potencial, recomendaciones).
5. Devolver a investigadora u avanzar etapa.

### CRUD / persistencia
| Operación | Entidades |
|---|---|
| Create/Update | `dictamen_pi`, `revision_expediente`, `revision_checklist`, `observacion`, `observacion_respuesta` |
| Read | expediente + historial de estados |

### Evidencia rúbrica
- Camino “revisar → observar / dictaminar” visible.
- Dictamen y observaciones persistidos.

### Implementación (2026-10-29)
- API: `POST /api/evaluaciones/propuestas/:id/acciones` con `action=pi|committee-ready|return|vie-observation`.
- UI: `EvaluacionesPage` carga bandeja desde Postgres y envía el payload del panel.

---

## CU4 — Evaluar con rúbrica y resolver

**Actores:** pantallas **separadas por rol**, como en `frontend/Fondos-VIE-Prototipo.html` (no una sola UI genérica):
- Cuerpo evaluador del Comité Técnico
- Consejo de profesores (aval)
- CIE (resolución)
- (y roles de apoyo asociados: asistentes, dirección, según el HTML)

**Objetivo:** En cada etapa/rol, calificar o decidir con rúbrica/fundamento (sugerencia IA **editable por humano**), con el mismo patrón de vistas distintas del prototipo HTML.

### Flujo principal (por rol, no unificado)
1. Ingresar con el **rol demo** correspondiente (Comité / Consejo / CIE / …).
2. Ver la bandeja/pantalla de ese rol (como hoy en el HTML).
3. Abrir propuesta en la etapa que le corresponde.
4. Aplicar rúbrica o registrar decisión (aval / resolución) con justificación obligatoria.
5. Guardar; la propuesta avanza de etapa según el flujo institucional.
6. Notificación in-app / registro (correo simulado).

### CRUD / persistencia
| Operación | Entidades |
|---|---|
| Create/Update | `evaluacion`, `evaluacion_puntaje`, `resultado_comite`, `aval_consejo`, `resolucion_cie`, `sesion_consejo`, `comunicacion_institucional`, `notificacion` |
| Read | rúbrica (`rubrica`, `rubrica_criterio`, `rubrica_nivel`) + historial |

### Evidencia rúbrica
- Evaluación + decisión con justificación obligatoria.
- IA solo sugiere; humano confirma (requisito de clase).
- UX por rol alineada al prototipo HTML de referencia.

### Implementación (2026-10-29)
- API: mismas rutas de evaluaciones; acciones `committee-score`, `council-approve|reject`,
  `cie-approve|reject`, `notify-resolution`, etc. Actualizan estado y oficios en BD.
- Pendiente fino: filas en `evaluacion` / `evaluacion_puntaje` por criterio (hoy se guarda
  el consolidado en `resultado_comite.calificacion_promedio`).

---

## CU5 — Consultar histórico de propuestas

**Actor:** Roles autorizados (investigadora, escuela, VIE, admin).  
**Objetivo:** Localizar propuestas por filtros combinados y ver ficha resumen.

### Flujo principal
1. Entrar a módulo Histórico.
2. Filtrar por **escuela**, **investigadora**, **línea/temática** y **estado** (combinables), más **año**.
3. Ver listado; abrir ficha resumen (estado, etapa, notas, oficios clave).
4. (Opcional admin) corregir metadatos menores sin romper el flujo.

### CRUD / persistencia
| Operación | Entidades |
|---|---|
| Read | `propuesta` + joins (`escuela`, `usuario`, `propuesta_linea`, `linea_investigacion`, `propuesta_historial_estado`, `resolucion_cie`, `aval_consejo`, `resultado_comite`, `dictamen_pi`) |
| Update | solo campos permitidos de consulta/admin si se implementa |

### Evidencia rúbrica
- Filtros obligatorios del alcance del curso.
- Resultados desde PostgreSQL, no datos hardcodeados.

### Estado de implementación (2026-10-21)
- `GET /api/historico/propuestas?escuela=&investigadora=&linea=&estado=&anio=` — los
  filtros se aplican en PostgreSQL, no en memoria.
- `frontend/src/pages/HistoricoPage.tsx` consume ese endpoint; ya no existe el
  array `HISTORICO_ITEMS` hardcodeado.
- `database/seed.sql` siembra 6 escuelas, 12 personas investigadoras, 8 líneas y
  16 propuestas (2024–2026) con historial de estados, oficios y resoluciones del CIE.
- El filtro "Temática" de la UI se llama **Línea / Temática** y mapea a
  `linea_investigacion`, que es la tabla real del modelo.

---

## Trazabilidad con módulos oficiales

| Módulo curso | CUs |
|---|---|
| Redacción | CU2 |
| Evaluación | CU3 + CU4 |
| Histórica | CU5 |
| (soporte) Convocatoria | CU1 |

## Fuera de alcance del prototipo (explícito)

- Integración real con Orión.
- Todos los sub-roles a/b/c como apps separadas (se simulan por rol/etapa en la misma UI).
- Motor genérico de formularios dinámicos.
- Envío real de correo (sí: registro / simulación).

## Criterio de “hecho” por CU

Para cada CU, en demo:

1. Recorrido feliz sin callejones sin salida.  
2. Create + Read + Update (y Delete donde aplique) contra Postgres.  
3. Tras F5 / otra sesión, los datos siguen ahí.  
4. Ortografía y flujo alineados a Manual TEC + rúbrica de interfaz/a11y (transversal).

## Próximo paso técnico

Fase 0: levantar PostgreSQL, aplicar `database/DisennoDB.sql`, seed mínimo (convocatoria + usuarios/roles), backend TypeScript con healthcheck y primer endpoint de CU1 o CU2.
