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
| **Tablas** | 40 |
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

**Principio de diseño:** normalización hasta 3FN en datos de negocio, nombres en español, tipos eficientes y **40 tablas**. Se agregan solo entidades con respaldo en los documentos oficiales o en el flujo institucional del prototipo. Se excluyen a propósito motores de formularios dinámicos, catálogos masivos de logs y desglose presupuestario por objeto de gasto (ese detalle vive en el Excel adjunto, según el formulario).

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
- Totales de horas semanales se **derivan** de `propuesta_participante_hora` (no se duplican como única fuente).

## 2.4 Normalización

- **1FN:** sin listas embebidas (OE, actividades, riesgos, niveles de rúbrica).
- **2FN:** puentes sin atributos parciales.
- **3FN:** escuela, rol, línea y descriptores de rúbrica en catálogos; participante TEC referencia `usuario` cuando existe.

---

# 3. Modelo de datos

## 3.1 Inventario (40 tablas)

| # | Tabla | Dominio |
|---|---|---|
| 1 | `escuela` | Institucional |
| 2 | `rol` | Seguridad |
| 3 | `usuario` | Seguridad |
| 4 | `usuario_rol` | Seguridad |
| 5 | `convocatoria` | Convocatoria |
| 6 | `convocatoria_hito` | Convocatoria |
| 7 | `propuesta` | Núcleo |
| 8 | `propuesta_palabra_clave` | Formulario |
| 9 | `propuesta_pregunta_general` | Formulario |
| 10 | `propuesta_objetivo_especifico` | Formulario / Plan |
| 11 | `propuesta_participante` | Equipo |
| 12 | `propuesta_participante_hora` | Equipo |
| 13 | `propuesta_presupuesto_anual` | Presupuesto |
| 14 | `propuesta_financiamiento` | Presupuesto |
| 15 | `propuesta_producto` | Productos |
| 16 | `propuesta_documento` | Anexos |
| 17 | `propuesta_historial_estado` | Auditoría |
| 18 | `linea_investigacion` | Histórico |
| 19 | `propuesta_linea` | Histórico |
| 20 | `aspecto_etico` | Ética |
| 21 | `permiso_etico` | Ética |
| 22 | `actividad_plan` | Plan / riesgos |
| 23 | `actividad_participante` | Plan / riesgos |
| 24 | `actividad_riesgo` | Plan / riesgos |
| 25 | `dictamen_pi` | PI |
| 26 | `revision_expediente` | Completitud |
| 27 | `revision_checklist` | Completitud |
| 28 | `observacion` | Correcciones |
| 29 | `observacion_respuesta` | Correcciones |
| 30 | `rubrica` | Evaluación |
| 31 | `rubrica_criterio` | Evaluación |
| 32 | `rubrica_nivel` | Evaluación |
| 33 | `evaluacion` | Evaluación |
| 34 | `evaluacion_puntaje` | Evaluación |
| 35 | `resultado_comite` | Comité |
| 36 | `sesion_consejo` | Consejo |
| 37 | `aval_consejo` | Consejo |
| 38 | `comunicacion_institucional` | Comunicación formal |
| 39 | `resolucion_cie` | CIE |
| 40 | `notificacion` | UI / campana |

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
| `trl_actual` | SMALLINT | NULL | TRL actual 1–9 |
| `trl_esperado` | SMALLINT | NULL | TRL esperado 1–9 |
| `requiere_dictamen_pi` | BOOLEAN | NOT NULL | ¿Requiere PI? |
| `estado_actual` | VARCHAR(40) | NOT NULL | Estado del flujo |
| `etapa_flujo` | SMALLINT | NOT NULL | Etapa numérica |

**Nota:** no se guarda `total_horas_semanales` ni `progreso` como fuente de verdad; se calculan.

---

### propuesta_palabra_clave

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_palabra_clave` | INTEGER | PK | Identificador |
| `id_propuesta` | INTEGER | FK NOT NULL | Propuesta |
| `idioma` | CHAR(2) | NOT NULL | `es` \| `en` |
| `palabra` | VARCHAR(100) | NOT NULL | Término descriptor |

UNIQUE (`id_propuesta`, `idioma`, `palabra`).

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
| `periodo_nombramiento` | VARCHAR(60) | NULL | Periodo |
| `iniciales` | VARCHAR(10) | NULL | Referencia en plan |

**3FN:** si `id_usuario` está presente, nombre/ORCID pueden tomarse de `usuario`; se permiten en la fila para externos y para snapshots legibles del expediente.

---

### propuesta_participante_hora

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_participante_hora` | INTEGER | PK | Identificador |
| `id_participante` | INTEGER | FK NOT NULL | Participante |
| `tipo_hora` | VARCHAR(30) | NOT NULL | VIE, VIE-Centros, CONS, REC, DOC o VIESA |
| `cantidad_horas` | NUMERIC(5,2) | NOT NULL | Horas semanales |

UNIQUE (`id_participante`, `tipo_hora`).

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
| Redacción | convocatoria + hitos, propuesta, `propuesta_palabra_clave`, OE, equipo + `propuesta_participante_hora`, presupuesto, financiamiento, productos, plan/riesgos, ética, documentos |
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

**Figura 1.** Diagrama relacional `fondos_vie` (40 tablas).  
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
  (keywords, OE,  (actividad_*,    (PI, revisión,   historial
   equipo+horas,   riesgos)         rúbrica,        notificacion
   presupuesto,                     consejo, CIE,
   productos, ética)                comunicación)
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

**Método:**

- Se estima un tamaño **esperado** por columna (no el máximo teórico de cada `VARCHAR(n)` como si siempre estuviera lleno).
- Tipos fijos: `INTEGER` = 4 B, `SMALLINT` = 2 B, `BOOLEAN` = 1 B, `DATE` = 4 B, `TIMESTAMPTZ` = 8 B, `NUMERIC` ≈ 6–8 B.
- En textos variables se usa un valor **representativo** (ni vacío ni el tope del `VARCHAR`).
- Se suma **24 B** de overhead aproximado de fila.
- Los `TEXT` grandes pueden ir a **TOAST**; el total es **lógico**, no el tamaño físico exacto en disco.

## 5.1 Resumen

Cada fila muestra: (1) el **desglose** de bytes por columna + overhead y el resultado de esa suma, (2) el **aproximado** (rango o valor) usado en proyecciones, y (3) el **comentario** del tipo de tabla. El detalle campo a campo de un caso completo está en §5.2.

| Tabla | Desglose (bytes) | Aproximado | Comentario |
|---|---|---|---|
| escuela | 4 + 12 + 60 + 1 + 24 = 101 | ≈ 100–120 B | Catálogo |
| rol | 4 + 20 + 50 + 100 + 24 = 198 | ≈ 200 B | Catálogo |
| usuario | 4 + 40 + 60 + 40 + 12 + 19 + 4 + 1 + 8 + 24 = 212 | ≈ 212–320 B | Login (ver ejemplo §5.2) |
| usuario_rol | 4 + 4 + 4 + 24 = 36 | 36 B | Puente |
| convocatoria | 4 + 50 + 150 + 4 + 4 + 8 + 12 + 4 + 8 + 24 = 268 | ≈ 200–400 B | +TEXT corto |
| convocatoria_hito | 4 + 4 + 40 + 30 + 4 + 4 + 2 + 24 = 112 | ≈ 100–200 B | Cronograma |
| propuesta | 4 + 15 + 4 + 4 + 4 + 200 + 20 + 4 + 4 + 8 + 7 200 + 2 + 2 + 1 + 25 + 2 + 24 = 7 523 | ≈ 6 500–8 500 B | Narrativa; TOAST probable |
| propuesta_palabra_clave | 4 + 4 + 2 + 80 + 24 = 114 | ≈ 90–130 B | Keyword ES/EN |
| propuesta_pregunta_general | 4 + 4 + 2 + 20 + 8 + 80 + 24 = 142 | ≈ 120–180 B | Respuestas del formulario |
| propuesta_objetivo_especifico | 4 + 4 + 2 + 200 + 24 = 234 | ≈ 200–350 B | OE del plan |
| propuesta_participante | 4 + 4 + 15 + 4 + 40 + 19 + 40 + 25 + 15 + 5 + 24 = 195 | ≈ 160–240 B | Equipo |
| propuesta_participante_hora | 4 + 4 + 10 + 6 + 24 = 48 | 48 B | Tipo/cantidad de horas |
| propuesta_presupuesto_anual | 4 + 4 + 2 + 8 + 8 + 8 + 24 = 58 | ≈ 62 B | Montos anuales |
| propuesta_financiamiento | 4 + 4 + 15 + 2 + 8 + 20 + 24 = 77 | ≈ 80–100 B | Fuentes adicionales |
| propuesta_producto | 4 + 4 + 4 + 18 + 15 + 120 + 2 + 15 + 24 = 206 | ≈ 180–280 B | Productos esperados |
| propuesta_documento | 4 + 4 + 40 + 15 + 10 + 80 + 2 + 8 + 24 = 187 | ≈ 200–320 B | Metadatos de anexos |
| propuesta_historial_estado | 4 + 4 + 20 + 25 + 4 + 8 + 50 + 24 = 139 | ≈ 120–200 B | Timeline del expediente |
| linea_investigacion | 4 + 40 + 24 = 68 | ≈ 60–80 B | Catálogo |
| propuesta_linea | 4 + 4 + 24 = 32 | 32 B | Puente |
| aspecto_etico | 4 + 4 + 1 + 1 + 1 + 1 + 200 + 24 = 236 | ≈ 200–400 B | Declaración ética |
| permiso_etico | 4 + 4 + 10 + 50 + 12 + 24 = 104 | ≈ 80–120 B | Entes regulatorios |
| actividad_plan | 4 + 4 + 4 + 2 + 120 + 100 + 12 + 2 + 4 + 24 = 276 | ≈ 300–450 B | Plan de acción |
| actividad_participante | 4 + 4 + 4 + 5 + 12 + 24 = 53 | ≈ 50–60 B | Participantes por actividad |
| actividad_riesgo | 4 + 4 + 150 + 150 + 40 + 24 = 372 | ≈ 350–500 B | Riesgo + mitigación |
| dictamen_pi | 4 + 4 + 4 + 1 + 1 + 60 + 60 + 1 800 + 15 + 4 + 12 + 24 = 1 989 | ≈ 1 500–2 500 B | TEXT técnicos |
| revision_expediente | 4 + 4 + 6 + 2 + 4 + 10 + 8 + 8 + 24 = 70 | ≈ 80 B | Ciclos de completitud |
| revision_checklist | 4 + 4 + 15 + 40 + 1 + 1 + 20 + 24 = 109 | ≈ 100–120 B | Ítems de checklist |
| observacion | 4 + 4 + 4 + 6 + 20 + 4 + 180 + 1 + 8 + 8 + 24 = 263 | ≈ 250–400 B | Observaciones formales |
| observacion_respuesta | 4 + 4 + 4 + 200 + 8 + 24 = 244 | ≈ 250–350 B | Respuestas del investigador |
| rubrica | 4 + 15 + 40 + 20 + 6 + 24 = 109 | ≈ 120–160 B | Plantilla de evaluación |
| rubrica_criterio | 4 + 4 + 40 + 2 + 50 + 6 + 6 + 1 + 24 = 137 | ≈ 160–200 B | Criterios |
| rubrica_nivel | 4 + 4 + 2 + 12 + 200 + 24 = 246 | ≈ 250–400 B | Descriptores |
| evaluacion | 4 + 4 + 4 + 4 + 6 + 6 + 10 + 150 + 8 + 24 = 220 | ≈ 250–400 B | Evaluación por evaluador |
| evaluacion_puntaje | 4 + 4 + 4 + 4 + 6 + 6 + 100 + 24 = 152 | ≈ 140–220 B | + justificación |
| resultado_comite | 4 + 4 + 15 + 6 + 15 + 150 + 4 + 4 + 24 = 226 | ≈ 250–350 B | Oficio consolidado |
| sesion_consejo | 4 + 4 + 15 + 12 + 4 + 24 = 63 | ≈ 80–100 B | Sesión de consejo |
| aval_consejo | 4 + 4 + 4 + 4 + 10 + 10 + 15 + 100 + 4 + 24 = 179 | ≈ 170–250 B | Aval por propuesta |
| comunicacion_institucional | 4 + 4 + 20 + 4 + 4 + 30 + 4 + 1 + 8 + 8 + 150 + 24 = 261 | ≈ 260–400 B | Comunicación formal |
| resolucion_cie | 4 + 4 + 4 + 10 + 20 + 200 + 4 + 24 = 270 | ≈ 300–500 B | Resolución final |
| notificacion | 4 + 4 + 4 + 50 + 100 + 1 + 8 + 24 = 195 | ≈ 200–280 B | Campana del sistema |

*Notas:* en `propuesta`, el término **7 200** agrupa 9 campos `TEXT` × ≈800 B. En `dictamen_pi`, **1 800** agrupa 6 campos `TEXT` × ≈300 B. El **aproximado** puede ser un rango cuando la longitud real del texto varía; para proyecciones de la §6 se usa el extremo conservador del aproximado.

## 5.2 Ejemplo de cálculo — `usuario`

Detalle campo a campo del desglose usado arriba (`4 + 40 + 60 + … + 24`).

| Campo | Tipo | Bytes estimados |
|---|---|---:|
| id_usuario | INTEGER | 4 |
| correo_institucional | VARCHAR(120) | 40 |
| clave_hash | VARCHAR(255) | 60 |
| nombre_completo | VARCHAR(150) | 40 |
| cedula | VARCHAR(20) | 12 |
| orcid | CHAR(19) | 19 |
| id_escuela | INTEGER | 4 |
| activo | BOOLEAN | 1 |
| fecha_registro | TIMESTAMPTZ | 8 |
| overhead fila | — | 24 |
| **Suma** | | **212** |
| **Aproximado** | | **212–320 B** |

La suma directa es **212 B**. El aproximado **212–320 B** cubre correos/nombres más largos y variación de fila; en la §6 se usa **320 B** (conservador).
---

# 6. Análisis del tamaño y crecimiento de las tablas

## 6.1 Hipótesis

- **1 000 propuestas nuevas por año** (peor caso / promedio indicado por el profesor).
- Sin crecimiento porcentual adicional.
- Acumulado: año 1 = **1 000**, año 3 = **3 000**, año 5 = **5 000** (sin borrado).
- Usuarios: **400** al inicio, +10 % anual → 440 / 532 / 644.
- Convocatorias: 2 nuevas/año → 2 / 6 / 10.
- Catálogos (`escuela`, `rol`, rúbricas, líneas) se cargan al inicio y se mantienen estables.
- Las tablas de negocio (propuesta y relacionadas) parten en **0** e irán creciendo con el volumen de propuestas.
- Logs genéricos: no aplican (no hay tabla `log`).

Fórmula de almacenamiento: **registros × bytes/registro = almacenamiento**.

## 6.2 Propuestas (núcleo)

| Período | Registros | Bytes/registro | Almacenamiento estimado |
|---|---:|---:|---:|
| 1 año | 1 000 | 8 500 | **≈ 8,1 MB** |
| 3 años | 3 000 | 8 500 | **≈ 24,3 MB** |
| 5 años | 5 000 | 8 500 | **≈ 40,5 MB** |

## 6.3 Resumen por tabla

Columnas de registros: **iniciales** (arranque del sistema) y acumulados al final de los años **1, 3 y 5**.  
Columnas de almacenamiento: peso estimado en esos mismos horizontes (`registros × bytes/registro` de la §5.1).

| Tabla | Iniciales | Año 1 | Año 3 | Año 5 | Alm. año 1 | Alm. año 3 | Alm. año 5 |
|---|---:|---:|---:|---:|---:|---:|---:|
| escuela | 24 | 24 | 24 | 24 | 3 KB | 3 KB | 3 KB |
| rol | 14 | 14 | 14 | 14 | 3 KB | 3 KB | 3 KB |
| usuario | 400 | 440 | 532 | 644 | 138 KB | 166 KB | 201 KB |
| usuario_rol | 500 | 550 | 665 | 805 | 19 KB | 23 KB | 28 KB |
| convocatoria | 0 | 2 | 6 | 10 | 1 KB | 2 KB | 4 KB |
| convocatoria_hito | 0 | 16 | 48 | 80 | 3 KB | 9 KB | 16 KB |
| propuesta | 0 | 1 000 | 3 000 | 5 000 | 8,1 MB | 24,3 MB | 40,5 MB |
| propuesta_palabra_clave | 0 | 8 000 | 24 000 | 40 000 | 1,0 MB | 3,0 MB | 5,0 MB |
| propuesta_pregunta_general | 0 | 8 000 | 24 000 | 40 000 | 1,4 MB | 4,1 MB | 6,9 MB |
| propuesta_objetivo_especifico | 0 | 4 000 | 12 000 | 20 000 | 1,3 MB | 4,0 MB | 6,7 MB |
| propuesta_participante | 0 | 4 000 | 12 000 | 20 000 | 0,9 MB | 2,7 MB | 4,6 MB |
| propuesta_participante_hora | 0 | 6 000 | 18 000 | 30 000 | 281 KB | 844 KB | 1,4 MB |
| propuesta_presupuesto_anual | 0 | 3 000 | 9 000 | 15 000 | 182 KB | 545 KB | 908 KB |
| propuesta_financiamiento | 0 | 1 500 | 4 500 | 7 500 | 146 KB | 439 KB | 732 KB |
| propuesta_producto | 0 | 4 000 | 12 000 | 20 000 | 1,1 MB | 3,2 MB | 5,3 MB |
| propuesta_documento | 0 | 6 000 | 18 000 | 30 000 | 1,8 MB | 5,5 MB | 9,2 MB |
| propuesta_historial_estado | 0 | 10 000 | 30 000 | 50 000 | 1,9 MB | 5,7 MB | 9,5 MB |
| linea_investigacion | 50 | 50 | 50 | 50 | 4 KB | 4 KB | 4 KB |
| propuesta_linea | 0 | 2 000 | 6 000 | 10 000 | 63 KB | 188 KB | 313 KB |
| aspecto_etico | 0 | 1 000 | 3 000 | 5 000 | 391 KB | 1,1 MB | 1,9 MB |
| permiso_etico | 0 | 500 | 1 500 | 2 500 | 59 KB | 176 KB | 293 KB |
| actividad_plan | 0 | 10 000 | 30 000 | 50 000 | 4,3 MB | 12,9 MB | 21,5 MB |
| actividad_participante | 0 | 20 000 | 60 000 | 100 000 | 1,1 MB | 3,4 MB | 5,7 MB |
| actividad_riesgo | 0 | 12 000 | 36 000 | 60 000 | 5,7 MB | 17,2 MB | 28,6 MB |
| dictamen_pi | 0 | 300 | 900 | 1 500 | 732 KB | 2,1 MB | 3,6 MB |
| revision_expediente | 0 | 2 000 | 6 000 | 10 000 | 156 KB | 469 KB | 781 KB |
| revision_checklist | 0 | 10 000 | 30 000 | 50 000 | 1,1 MB | 3,4 MB | 5,7 MB |
| observacion | 0 | 2 000 | 6 000 | 10 000 | 781 KB | 2,3 MB | 3,8 MB |
| observacion_respuesta | 0 | 1 500 | 4 500 | 7 500 | 513 KB | 1,5 MB | 2,5 MB |
| rubrica | 6 | 6 | 6 | 6 | 1 KB | 1 KB | 1 KB |
| rubrica_criterio | 70 | 70 | 70 | 70 | 14 KB | 14 KB | 14 KB |
| rubrica_nivel | 280 | 280 | 280 | 280 | 109 KB | 109 KB | 109 KB |
| evaluacion | 0 | 6 000 | 18 000 | 30 000 | 2,3 MB | 6,9 MB | 11,4 MB |
| evaluacion_puntaje | 0 | 60 000 | 180 000 | 300 000 | 12,6 MB | 37,8 MB | 62,9 MB |
| resultado_comite | 0 | 900 | 2 700 | 4 500 | 308 KB | 0,9 MB | 1,5 MB |
| sesion_consejo | 0 | 24 | 72 | 120 | 2 KB | 7 KB | 12 KB |
| aval_consejo | 0 | 900 | 2 700 | 4 500 | 220 KB | 0,7 MB | 1,1 MB |
| comunicacion_institucional | 0 | 1 700 | 5 100 | 8 500 | 664 KB | 1,9 MB | 3,2 MB |
| resolucion_cie | 0 | 800 | 2 400 | 4 000 | 391 KB | 1,1 MB | 1,9 MB |
| notificacion | 0 | 11 000 | 33 000 | 55 000 | 2,9 MB | 8,8 MB | 14,7 MB |

### Totales orientativos (datos lógicos, sin índices)

| Período | Propuestas acumuladas | Almacenamiento total estimado |
|---|---:|---:|
| 1 año | 1 000 | **≈ 53 MB** |
| 3 años | 3 000 | **≈ 158 MB** |
| 5 años | 5 000 | **≈ 263 MB** |

El volumen lo marcan sobre todo `evaluacion_puntaje`, el plan/riesgos y las narrativas de `propuesta`.

## 6.4 Lectura

- Se usa **1 000 propuestas/año** para no subestimar el crecimiento.
- Los horizontes de **1, 3 y 5 años** comparten la misma lógica de acumulación.
- El almacenamiento se obtiene como **registros × bytes/registro**.
- No se justifica particionamiento en este horizonte (menos de ≈0,3 GB lógicos a 5 años).

---

# 7. Conclusiones

1. El modelo de **40 tablas** cubre el flujo Fondos VIE de punta a punta y los tres módulos del curso, con respaldo en los documentos oficiales.
2. Corrige los huecos críticos del modelo de 26 tablas (plan/riesgos, OE, niveles de rúbrica + justificación, checklist por ciclo, hitos, ética multi-ente, consolidado del Comité, sesión/acuerdo, comunicación formal) **sin** volver a un diseño de 56–100+ tablas.
3. Cumple la relación exigida entre investigadores, escuelas, propuestas, líneas de investigación y evaluaciones.
4. Los estándares, PK/FK y tipos PostgreSQL están documentados de forma uniforme.
5. El análisis de registro muestra el método con un ejemplo completo (`usuario`) y el crecimiento usa **1 000 propuestas/año** con horizontes de **1, 3 y 5 años** (`registros × bytes/registro`).

---

*Fin del documento — Diseño de Base de Datos Fondos VIE (40 tablas) — Revisión de capacidad*