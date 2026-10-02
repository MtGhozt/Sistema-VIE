# Instituto Tecnológico de Costa Rica
## Escuela de Ingeniería en Computación
### Curso: Diseño de Software

# Diseño de Base de Datos PostgreSQL
## Sistema de Gestión de Propuestas de Investigación — Fondos VIE

| Campo | Valor |
|---|---|
| **Motor** | PostgreSQL |
| **Base** | `fondos_vie` |
| **Modelo fuente** | `fondos_vie_modelo.dbml` |
| **Tablas** | 38 |
| **Integrantes** | [Completar] |
| **Profesor** | [Completar] |
| **Fecha** | Septiembre 2026 |

**Fuentes oficiales:** Disposiciones Fondos VIE 2027, Formulario de proyecto, Plan de Acción y Gestión del Riesgo, Rúbricas 2027, Plantilla de presupuesto, Formatos de acuerdo (instancia coordinadora/participante).

---

# Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Estándares](#2-estándares)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Diagramas](#4-diagramas)
5. [Análisis del tamaño del registro](#5-análisis-del-tamaño-del-registro)
6. [Análisis del tamaño y crecimiento de las tablas](#6-análisis-del-tamaño-y-crecimiento-de-las-tablas)
7. [Conclusiones](#7-conclusiones)

---

# 1. Introducción

Este documento define el diseño relacional en PostgreSQL del prototipo académico para gestionar el ciclo de vida de propuestas de investigación de los **Fondos VIE** del TEC.

El modelo cubre los tres módulos del proyecto:

1. **Redacción:** convocatoria y cronograma, formulario (problema, metodología, equipo, presupuesto, productos, ética), plan de acción y riesgos.
2. **Evaluación:** dictamen PI, revisión de completitud por ciclos, rúbrica con niveles y justificación, consolidado del Comité, sesión y aval del Consejo, comunicación formal, verificación VIE, resolución CIE.
3. **Consulta histórica:** filtros por escuela, investigador/coordinador, línea de investigación y estatus.

**Principio de diseño:** normalización hasta 3FN en datos de negocio, nombres en español, tipos eficientes y **38 tablas**. Se agregan solo entidades con respaldo en los documentos oficiales o en el flujo institucional del prototipo. Se excluyen a propósito motores de formularios dinámicos, catálogos masivos de logs y desglose presupuestario por objeto de gasto (ese detalle vive en el Excel adjunto, según el formulario).

**Alcance:** diseño de BD (diccionario, ER, estándares, análisis de tamaños). Los binarios (PDF/DOCX/XLSX) se almacenan fuera de PostgreSQL.

---

# 2. Estándares

## 2.1 Nomenclatura

| Regla | Aplicación |
|---|---|
| Idioma | Español |
| Estilo | `snake_case`, minúsculas |
| Tablas | Sustantivo singular |
| PK | `id_<tabla>` |
| FK | Mismo nombre que la PK referenciada |
| Puentes | PK compuesta por las FK |
| Booleanos | Semántica clara (`activo`, `verificado`, `confirmada`) |
| Fechas | Prefijo `fecha_` |
| Montos | Prefijo `monto_` / tipo `NUMERIC` |

## 2.2 Tipos de datos (PostgreSQL)

| Tipo | Uso |
|---|---|
| `INTEGER` + identidad | PK/FK de negocio |
| `SMALLINT` | Orden, TRL, ciclo, puntajes de nivel 0/6/8/10 |
| `NUMERIC(p,s)` | Dinero y puntajes |
| `BOOLEAN` | Banderas |
| `DATE` / `TIMESTAMPTZ` | Fechas y eventos |
| `VARCHAR(n)` | Textos acotados |
| `CHAR(19)` | ORCID |
| `TEXT` | Narrativas y descriptores de rúbrica |

## 2.3 Integridad

- Toda FK referencia una PK/UK válida.
- Ciclos de revisión: `UNIQUE (id_propuesta, etapa, ciclo)` — no se pierde historial al devolver.
- Listas multivaluadas en tablas hijas (objetivos, actividades, riesgos, puntajes, permisos éticos).
- Totales de horas semanales se **derivan** de `propuesta_participante` (no se duplican como única fuente).

## 2.4 Normalización

- **1FN:** sin listas embebidas (OE, actividades, riesgos, niveles de rúbrica).
- **2FN:** puentes sin atributos parciales.
- **3FN:** escuela, rol, línea y descriptores de rúbrica en catálogos; participante TEC referencia `usuario` cuando existe.

---

# 3. Modelo de datos

## 3.1 Inventario (38 tablas)

| # | Tabla | Dominio |
|---|---|---|
| 1 | `escuela` | Institucional |
| 2 | `rol` | Seguridad |
| 3 | `usuario` | Seguridad |
| 4 | `usuario_rol` | Seguridad |
| 5 | `convocatoria` | Convocatoria |
| 6 | `convocatoria_hito` | Convocatoria |
| 7 | `propuesta` | Núcleo |
| 8 | `propuesta_pregunta_general` | Formulario |
| 9 | `propuesta_objetivo_especifico` | Formulario / Plan |
| 10 | `propuesta_participante` | Equipo |
| 11 | `propuesta_presupuesto_anual` | Presupuesto |
| 12 | `propuesta_financiamiento` | Presupuesto |
| 13 | `propuesta_producto` | Productos |
| 14 | `propuesta_documento` | Anexos |
| 15 | `propuesta_historial_estado` | Auditoría |
| 16 | `linea_investigacion` | Histórico |
| 17 | `propuesta_linea` | Histórico |
| 18 | `aspecto_etico` | Ética |
| 19 | `permiso_etico` | Ética |
| 20 | `actividad_plan` | Plan / riesgos |
| 21 | `actividad_participante` | Plan / riesgos |
| 22 | `actividad_riesgo` | Plan / riesgos |
| 23 | `dictamen_pi` | PI |
| 24 | `revision_expediente` | Completitud |
| 25 | `revision_checklist` | Completitud |
| 26 | `observacion` | Correcciones |
| 27 | `observacion_respuesta` | Correcciones |
| 28 | `rubrica` | Evaluación |
| 29 | `rubrica_criterio` | Evaluación |
| 30 | `rubrica_nivel` | Evaluación |
| 31 | `evaluacion` | Evaluación |
| 32 | `evaluacion_puntaje` | Evaluación |
| 33 | `resultado_comite` | Comité |
| 34 | `sesion_consejo` | Consejo |
| 35 | `aval_consejo` | Consejo |
| 36 | `comunicacion_institucional` | Comunicación formal |
| 37 | `resolucion_cie` | CIE |
| 38 | `notificacion` | UI / campana |

## 3.2 Flujo de estados

```text
borrador → enviada → pendiente_dictamen_pi (si aplica)
  → revision_completitud → evaluacion_comite → aval_consejo
  → comunicacion_vie → verificacion_vie → resolucion_cie
  → aprobada | rechazada
```

Las revisiones de Comité y Gestora VIE usan `revision_expediente.etapa` (`comite` | `vie`) con **ciclos** numerados.

## 3.3 Diccionario de datos

### escuela

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_escuela` | INTEGER | PK | Identificador |
| `codigo` | VARCHAR(20) | UNIQUE NOT NULL | Código corto |
| `nombre` | VARCHAR(150) | NOT NULL | Nombre |
| `activo` | BOOLEAN | NOT NULL | Vigente |

**Respaldo:** dependencia académica coordinadora (formulario / rúbricas).

---

### rol / usuario / usuario_rol

| Tabla | Columnas clave |
|---|---|
| `rol` | `id_rol`, `codigo`, `nombre`, `descripcion` |
| `usuario` | `id_usuario`, `correo_institucional`, `clave_hash`, `nombre_completo`, `cedula`, `orcid`, `id_escuela`, `activo`, `fecha_registro` |
| `usuario_rol` | PK (`id_usuario`, `id_rol`), `fecha_asignacion` |

**Respaldo:** perfiles del flujo institucional (investigador, comité, consejo, CIE, admin).

---

### convocatoria

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_convocatoria` | INTEGER | PK | Identificador |
| `nombre` | VARCHAR(200) | NOT NULL | Nombre |
| `descripcion` | TEXT | NULL | Descripción |
| `fecha_apertura` / `fecha_cierre` | DATE | NOT NULL | Ventana de formulación |
| `presupuesto_estimado` | NUMERIC(14,2) | NULL | Presupuesto global |
| `estado` | VARCHAR(20) | NOT NULL | Estado |
| `id_publicada_por` | INTEGER | FK NULL | Publicador |
| `fecha_publicacion` | TIMESTAMPTZ | NULL | Publicación |

---

### convocatoria_hito

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_hito` | INTEGER | PK | Identificador |
| `id_convocatoria` | INTEGER | FK NOT NULL | Convocatoria |
| `nombre` | VARCHAR(200) | NOT NULL | Actividad del cronograma |
| `responsable` | VARCHAR(120) | NOT NULL | Responsable institucional |
| `fecha_inicio` / `fecha_fin` | DATE | NOT NULL | Periodo |
| `orden` | SMALLINT | NOT NULL | Orden de presentación |

**Respaldo:** Disposiciones §6 (cronograma de la convocatoria).

---

### propuesta

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_propuesta` | INTEGER | PK | Identificador |
| `codigo` | VARCHAR(20) | UNIQUE NOT NULL | PROP-AAAA-NNN |
| `id_convocatoria` | INTEGER | FK NOT NULL | Convocatoria |
| `id_coordinador` | INTEGER | FK NOT NULL | Investigador coordinador |
| `id_escuela` | INTEGER | FK NOT NULL | Escuela |
| `titulo` | VARCHAR(500) | NOT NULL | Título |
| `modalidad` | VARCHAR(40) | NOT NULL | Modalidad VIE |
| `fecha_inicio` / `fecha_finalizacion` | DATE | NULL | Periodo del proyecto |
| `fecha_envio` | TIMESTAMPTZ | NULL | Envío |
| `resumen`, `abstract_en`, `problema`, `objetivo_general`, `estado_arte`, `metodologia`, `hoja_ruta`, `referencias`, `divulgacion` | TEXT | NULL | Narrativa |
| `palabras_clave`, `keywords_en` | VARCHAR(300) | NULL | Keywords |
| `nivel_trl` | SMALLINT | NULL | TRL 1–9 |
| `requiere_dictamen_pi` | BOOLEAN | NOT NULL | ¿Requiere PI? |
| `estado_actual` | VARCHAR(40) | NOT NULL | Estado del flujo |
| `etapa_flujo` | SMALLINT | NOT NULL | Etapa numérica |

**Nota:** no se guarda `total_horas_semanales` ni `progreso` como fuente de verdad; se calculan.

---

### propuesta_pregunta_general

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_respuesta` | INTEGER | PK | Identificador |
| `id_propuesta` | INTEGER | FK NOT NULL | Propuesta |
| `numero_pregunta` | SMALLINT | NOT NULL | Orden |
| `codigo_pregunta` | VARCHAR(40) | NOT NULL | Código |
| `respuesta` | VARCHAR(20) | NOT NULL | si/no/parcial/total |
| `detalle` | TEXT | NULL | Detalle |

UNIQUE (`id_propuesta`, `codigo_pregunta`).

---

### propuesta_objetivo_especifico

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_objetivo` | INTEGER | PK | Identificador |
| `id_propuesta` | INTEGER | FK NOT NULL | Propuesta |
| `numero` | SMALLINT | NOT NULL | OE1, OE2… |
| `descripcion` | TEXT | NOT NULL | Texto del OE |

**Respaldo:** Formulario (objetivos específicos) y columna OE del Plan de Acción.

---

### propuesta_participante

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_participante` | INTEGER | PK | Identificador |
| `id_propuesta` | INTEGER | FK NOT NULL | Propuesta |
| `tipo` | VARCHAR(20) | NOT NULL | funcionario_tec \| externo |
| `id_usuario` | INTEGER | FK NULL | Usuario TEC si existe |
| `nombre_completo` | VARCHAR(150) | NOT NULL | Nombre |
| `orcid` | CHAR(19) | NULL | ORCID |
| `instancia_o_institucion` | VARCHAR(200) | NULL | Adscripción |
| `rol_en_proyecto` | VARCHAR(80) | NULL | Rol |
| `tipo_horas` | VARCHAR(30) | NULL | REC, CONS, DOC_VIE… |
| `cantidad_horas` | NUMERIC(5,2) | NULL | Horas |
| `periodo_nombramiento` | VARCHAR(60) | NULL | Periodo |
| `iniciales` | VARCHAR(10) | NULL | Referencia en plan |

**3FN:** si `id_usuario` está presente, nombre/ORCID pueden tomarse de `usuario`; se permiten en la fila para externos y para snapshots legibles del expediente.

---

### propuesta_presupuesto_anual / propuesta_financiamiento

Cuadro 4 (totales anuales) y Cuadro 5 (fuentes adicionales). El desglose por objeto de gasto del Excel **no** se modela: se adjunta como `propuesta_documento`.

---

### propuesta_producto

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_producto` | INTEGER | PK | Identificador |
| `id_propuesta` | INTEGER | FK NOT NULL | Propuesta |
| `id_objetivo` | INTEGER | FK NULL | OE asociado |
| `ambito` | VARCHAR(30) | NOT NULL | Ámbito |
| `codigo_opcion` | VARCHAR(40) | NOT NULL | Opción de producto |
| `descripcion` | VARCHAR(500) | NOT NULL | Descripción |
| `cantidad` | SMALLINT | NOT NULL | Cantidad |
| `dictamen_consecutivo` | VARCHAR(40) | NULL | Activo PI |

---

### propuesta_documento

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_documento` | INTEGER | PK | Identificador |
| `id_propuesta` | INTEGER | FK NOT NULL | Propuesta |
| `nombre` | VARCHAR(200) | NOT NULL | Nombre |
| `tipo` | VARCHAR(40) | NOT NULL | Tipo |
| `estado` | VARCHAR(20) | NOT NULL | completo \| pendiente |
| `ruta_archivo` | VARCHAR(500) | NULL | Ruta |
| `numero_version` | SMALLINT | NOT NULL DEFAULT 1 | Versión simple |
| `fecha_carga` | TIMESTAMPTZ | NULL | Carga |

---

### propuesta_historial_estado / linea_investigacion / propuesta_linea

Timeline del expediente y N:M con líneas de investigación (filtros del histórico).

---

### aspecto_etico / permiso_etico

`aspecto_etico` (1:1): cuatro banderas + justificación de exención.  
`permiso_etico` (1:N): ente (`CEC`, `CONAGEBIO`, `CICUA`, `COBAB`, `ADI`, `OTRO`), detalle y estado del trámite.

**Respaldo:** Formulario — Aspectos éticos; Disposiciones (CEC, CONAGEBIO, CICUA).

---

### actividad_plan / actividad_participante / actividad_riesgo

| Tabla | Contenido |
|---|---|
| `actividad_plan` | OE, número, descripción, resultado esperado, responsabilidad, mes inicio, duración |
| `actividad_participante` | Participante/iniciales y rol en la actividad |
| `actividad_riesgo` | Riesgo, mitigación, responsable de gestión |

**Respaldo:** Excel *Plan de Acción y Gestión del Riesgo*; rúbrica exige ≥1 riesgo por actividad.

---

### dictamen_pi

Dictamen técnico del Centro de Vinculación (1:1 con propuesta), con oficio y campos de análisis PI.

---

### revision_expediente / revision_checklist

| Columna clave | Uso |
|---|---|
| `etapa` | `comite` \| `vie` |
| `ciclo` | 1, 2, 3… (devoluciones) |
| checklist | ítems FORMULARIO, PLAN, PRESUPUESTO, ADJUNTOS, DICTAMEN_PI… |

UNIQUE (`id_propuesta`, `etapa`, `ciclo`).

---

### observacion / observacion_respuesta

Observaciones formales (Comité/VIE/CIE) y respuestas del investigador — ciclos de corrección sin perder historial.

---

### rubrica / rubrica_criterio / rubrica_nivel

| Tabla | Uso |
|---|---|
| `rubrica` | Plantilla por modalidad (3 hojas oficiales) |
| `rubrica_criterio` | Criterio, sección, peso, obligatorio |
| `rubrica_nivel` | Descriptores 0 / 6 / 8 / 10 |

**Respaldo:** *Rúbricas_Investigación_2027*.

---

### evaluacion / evaluacion_puntaje

Evaluación por evaluador e instancia (`comite` \| `cie`).  
En cada puntaje: `puntaje`, `id_nivel`, `puntaje_sugerido_ia` (opcional, editable), `justificacion` (exigida por la rúbrica).

---

### resultado_comite

Oficio **consolidado** del Comité (recomendación, promedio, número de oficio) — separado de las evaluaciones individuales.

---

### sesion_consejo / aval_consejo

Sesión (número, tipo, fecha, escuela) y aval por propuesta, alineado a los formatos de acuerdo 7 y 8.

---

### comunicacion_institucional

Comunicación formal (aval a VIE, notificación de resolución) con emisor, destinatario, documento opcional y confirmación. Distinta de `notificacion` (campana del sistema).

---

### resolucion_cie / notificacion

Resolución final del CIE y notificaciones internas de UI.

## 3.4 Cobertura de módulos

| Módulo | Evidencia en el modelo |
|---|---|
| Redacción | convocatoria + hitos, propuesta, OE, equipo, presupuesto, financiamiento, productos, plan/riesgos, ética, documentos |
| Evaluación | PI, revisión+checklist por ciclo, observaciones, rúbrica/niveles/justificación, consolidado comité, sesión/aval, comunicación, CIE |
| Histórico | escuela, coordinador, `propuesta_linea`, `estado_actual` |

## 3.5 Qué se excluyó a propósito

| Excluido | Motivo |
|---|---|
| Form builder (`formulario_elemento`) | El formulario oficial es plantilla fija Word |
| Desglose por objeto de gasto | El formulario indica Excel adjunto |
| 5 catálogos de log + `log` masivo | Fuera de la rúbrica; basta el historial de estados |
| `asignacion_bandeja` / snapshots JSONB de envío | El estado + historial + revisiones por ciclo bastan |

---

# 4. Diagramas

## 4.1 Diagrama relacional

Generar desde `fondos_vie_modelo.dbml` en [dbdiagram.io](https://dbdiagram.io) e insertar como **Figura 1**.

**Figura 1.** Diagrama relacional `fondos_vie` (38 tablas).  
*[Insertar exportación PNG/PDF]*

### Vista lógica

```text
[escuela]──< [usuario] >──[rol]
[convocatoria]──< [convocatoria_hito]
[convocatoria]──< [propuesta] >──[linea_investigacion]
                     │
     ┌───────────────┼────────────────┬─────────────────┐
     ▼               ▼                ▼                 ▼
  formulario      plan/riesgos     flujo eval.      auditoría
  (OE, equipo,    (actividad_*,    (PI, revisión,   historial
   presupuesto,    riesgos)         rúbrica,        notificacion
   productos,                       consejo, CIE,
   ética)                           comunicación)
```

## 4.2 Componentes (UML)

```text
[Cliente Web] → [API Backend] → [PostgreSQL fondos_vie]
                      ↓
              [Almacén de anexos]
```

## 4.3 Despliegue (UML)

```text
[Navegador] → [Servidor aplicación] → [PostgreSQL]
                      ↓
              [Storage de archivos]
```

Sin integración a Orión (según enunciado del curso).

---

# 5. Análisis del tamaño del registro

**Método (estimación lógica para la rúbrica):**

- Se suma un tamaño **promedio esperado** por columna (no el máximo teórico de cada `VARCHAR(n)` como si siempre estuviera lleno).
- `TEXT` grandes se estiman con promedio; en PostgreSQL pueden ir a **TOAST** y no ocupar ese tamaño completo en la página de la fila.
- Se suma **24 B** de overhead aproximado de fila.

Por tanto, los totales son **órdenes de magnitud para diseño**, no el tamaño físico exacto en disco.

## 5.1 Resumen

| Tabla | Bytes/registro (est.) | Comentario |
|---|---:|---|
| escuela | 120 | Catálogo |
| rol | 200 | Catálogo |
| usuario | 320 | Login |
| usuario_rol | 36 | Puente |
| convocatoria | 400 | +TEXT corto |
| convocatoria_hito | 200 | Cronograma |
| propuesta | 8 500 | Narrativa; TOAST probable |
| propuesta_pregunta_general | 180 | |
| propuesta_objetivo_especifico | 350 | |
| propuesta_participante | 280 | |
| propuesta_presupuesto_anual | 62 | |
| propuesta_financiamiento | 100 | |
| propuesta_producto | 280 | |
| propuesta_documento | 320 | |
| propuesta_historial_estado | 200 | |
| linea_investigacion | 80 | |
| propuesta_linea | 32 | |
| aspecto_etico | 400 | |
| permiso_etico | 120 | |
| actividad_plan | 450 | |
| actividad_participante | 60 | |
| actividad_riesgo | 500 | |
| dictamen_pi | 2 500 | TEXT técnicos |
| revision_expediente | 80 | |
| revision_checklist | 120 | |
| observacion | 400 | |
| observacion_respuesta | 350 | |
| rubrica | 160 | |
| rubrica_criterio | 200 | |
| rubrica_nivel | 400 | Descriptores |
| evaluacion | 400 | |
| evaluacion_puntaje | 220 | + justificación |
| resultado_comite | 350 | |
| sesion_consejo | 100 | |
| aval_consejo | 250 | |
| comunicacion_institucional | 400 | |
| resolucion_cie | 500 | |
| notificacion | 280 | |

### Ejemplo de cálculo — `usuario` (promedios)

| Columna | Estimación (B) |
|---|---:|
| id_usuario | 4 |
| correo_institucional | 40 |
| clave_hash | 60 |
| nombre_completo | 40 |
| cedula | 12 |
| orcid | 19 |
| id_escuela | 4 |
| activo | 1 |
| fecha_registro | 8 |
| overhead | 24 |
| **Total** | **≈ 212–320** (se reporta 320 conservador) |

### Ejemplo — `propuesta`

Campos acotados ≈ 700 B; narrativas `TEXT` con promedio ≈ 7–8 KB útiles (mucho puede ir a TOAST). Total lógico reportado: **≈ 8 500 B/registro**.

---

# 6. Análisis del tamaño y crecimiento de las tablas

## 6.1 Hipótesis

- 120 propuestas **nuevas** en el año 1.
- Crecimiento de altas: 20 % anual.
- **Filas acumuladas** al final del año 5 (sin borrado):

```text
Año1 120 + Año2 144 + Año3 173 + Año4 207 + Año5 249 ≈ 893 propuestas
```

- Usuarios: 400 iniciales, +10 % anual → ≈ 586 al año 5.
- Convocatorias: 2 nuevas/año → ≈ 10 acumuladas.
- Logs genéricos: no aplican (no hay tabla `log`).

## 6.2 Resumen (acumulado al final del año 5)

| Tabla | Filas ≈ año 5 | Tamaño datos ≈ | Nota |
|---|---:|---:|---|
| escuela | 24 | 3 KB | Estable |
| rol | 14 | 3 KB | Fijo |
| usuario | 586 | 180 KB | |
| usuario_rol | 730 | 26 KB | |
| convocatoria | 10 | 4 KB | |
| convocatoria_hito | 80 | 16 KB | ~8 hitos × convocatorias |
| propuesta | 893 | 7.2 MB | Dominante por TEXT |
| propuesta_pregunta_general | 7 144 | 1.2 MB | ~8/prop. |
| propuesta_objetivo_especifico | 3 572 | 1.2 MB | ~4 OE |
| propuesta_participante | 3 572 | 1.0 MB | ~4 |
| propuesta_presupuesto_anual | 2 679 | 160 KB | ~3 años |
| propuesta_financiamiento | 1 340 | 130 KB | |
| propuesta_producto | 3 572 | 950 KB | |
| propuesta_documento | 5 358 | 1.6 MB | ~6 |
| propuesta_historial_estado | 8 930 | 1.7 MB | ~10 tránsitos |
| linea_investigacion | 50 | 4 KB | |
| propuesta_linea | 1 786 | 55 KB | |
| aspecto_etico | 893 | 350 KB | |
| permiso_etico | 450 | 50 KB | Subconjunto |
| actividad_plan | 8 930 | 3.8 MB | ~10 act. |
| actividad_participante | 17 860 | 1.0 MB | |
| actividad_riesgo | 10 716 | 5.1 MB | ≥1/act. |
| dictamen_pi | 300 | 730 KB | ~30 % DT/PI |
| revision_expediente | 1 800 | 140 KB | Ciclos |
| revision_checklist | 9 000 | 1.0 MB | |
| observacion | 2 000 | 780 KB | |
| observacion_respuesta | 1 500 | 510 KB | |
| rubrica | 6 | 1 KB | |
| rubrica_criterio | 70 | 14 KB | |
| rubrica_nivel | 280 | 110 KB | 4 niveles × criterio |
| evaluacion | 5 000 | 1.9 MB | Varias/prop. |
| evaluacion_puntaje | 50 000 | 10.5 MB | |
| resultado_comite | 800 | 270 KB | |
| sesion_consejo | 120 | 12 KB | |
| aval_consejo | 800 | 195 KB | |
| comunicacion_institucional | 1 500 | 570 KB | |
| resolucion_cie | 700 | 340 KB | |
| notificacion | 10 000 | 2.7 MB | |

**Total orientativo del esquema al año 5:** ≈ **45–55 MB** de datos lógicos (sin índices). Adecuado para PostgreSQL en un prototipo institucional.

## 6.3 Lectura

- El volumen lo marcan `propuesta`, plan/riesgos y `evaluacion_puntaje`, no la cantidad de tablas.
- La proyección es **acumulada**; no se confunde “altas del año 5” con “filas en la tabla”.
- No se justifica particionamiento en este horizonte.

---

# 7. Conclusiones

1. El modelo de **38 tablas** cubre el flujo Fondos VIE de punta a punta y los tres módulos del curso, con respaldo en los documentos oficiales del zip.
2. Corrige los huecos críticos del modelo de 26 tablas (plan/riesgos, OE, niveles de rúbrica + justificación, checklist por ciclo, hitos, ética multi-ente, consolidado del Comité, sesión/acuerdo, comunicación formal) **sin** volver a un diseño de 56–100+ tablas.
3. Cumple la relación exigida entre investigadores, escuelas, propuestas, líneas de investigación y evaluaciones.
4. Los estándares, PK/FK y tipos PostgreSQL están documentados de forma uniforme.
5. El análisis de registro y el de crecimiento (acumulado, con nota sobre TOAST) demuestran un diseño eficiente y defendible ante la rúbrica.

---

*Fin del documento — Diseño de Base de Datos Fondos VIE (38 tablas)*
