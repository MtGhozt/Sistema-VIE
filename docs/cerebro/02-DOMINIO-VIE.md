# 02 — DOMINIO VIE | Flujo, actores, reglas y extractos clave

> Síntesis operativa de la convocatoria Fondos VIE 2027.
> Fuentes: `DOCS info proyecto/` + `ETAPA1/Contexto-Proyecto-Fondos-VIE.md`.
> No reemplaza los PDFs oficiales — son extractos para diseñar.

## 1. Flujo institucional (de punta a punta)

```
VIE publica convocatoria + cronograma
  → Investigadores crean propuesta (formulario + plan + presupuesto)
  → Vinculación: dictamen de PI
  → Comité Técnico: a) asistente revisa completitud
                    b) Coordinador + Director de Escuela + 3 profesores evalúan con rúbrica (nota independiente) + oficio
  → Consejo de Escuela: a) asistente recibe nota del Comité y la pasa al consejo
                        b) consejo de profesores aprueba/rechaza y genera aval
                        c) Dirección comunica el aval a la VIE
  → VIE verifica, dictamina y resuelve:
        a) persona gestora revisa contenidos, completitud y comentarios
        b) CIE evalúa con rúbrica, observa, aprueba o rechaza
        c) Dirección de Investigación notifica el resultado
  → Super Admin: ve y edita todo el flujo sin cerrar sesión
  → Histórica: consultable por escuela / investigador / temática / estado
```

**Escenario mínimo que el prototipo debe demostrar** (alcance oficial §1.6):
crear → completar → enviar → revisar → aprobar / rechazar → localizar en histórico.

## 2. Actores y qué hacen en el sistema

| Actor | Envía | Recibe | Rol prototipo |
|---|---|---|---|
| VIE (publicación) | Convocatoria + cronograma | — | `vie_publica` |
| Investigadora coordinadora + equipo | Propuesta completa | Estado, observaciones, resolución | `investigador` (crea/edita/envía) |
| Centro Vinculación | Dictamen PI | Info PI de la propuesta | `vinculacion` (dictamina) |
| Comité Técnico — asistente | Completitud / devolución | Propuesta + docs | `comite_asistente` |
| Comité Técnico — cuerpo evaluador | Evaluación + oficio | Propuesta completa | `comite` (rúbrica, nota independiente) |
| Consejo — asistente | Expediente a sesión | Calificación del Comité | `consejo_asistente` |
| Consejo de profesores | Aval + oficio | Expediente + nota Comité | `consejo` (aprueba/rechaza) |
| Dirección de Escuela | Comunicación del aval | Oficio de aval | `direccion_escuela` |
| Persona gestora VIE | Comentarios / completitud | Expediente consolidado | `vie_gestora` |
| CIE | Resolución (aprueba/rechaza) | Todo lo anterior | `cie` |
| Dirección de Investigación | Notificación de resolución | Dictámenes CIE | `direccion_investigacion` |
| Super Administrador | Cualquier acción de los roles anteriores | Todo | `superadmin` (ve y edita todo; sin logout entre roles) |

Personas del análisis: **P1** VIE publicación, **P2** profesores, **P3** Vinculación, **P4** Comité Técnico (a. asistente / b. cuerpo evaluador), **P5** Consejo de Escuela (a. asistente / b. consejo / c. dirección), **P6** VIE/CIE (a. gestora / b. CIE / c. Dirección de Investigación), **Super Admin**. Ver `ETAPA1/Analisis-de-Personas-Fondos-VIE.md`.

## 3. Tres módulos oficiales

**Redacción:** formulario por secciones (problema, justificación, objetivos, metodología,
equipo + horas, presupuesto, plan de acción, riesgos, TRL inicial/final). Checklist de
documentos (formulario, plan, presupuesto). Guardado parcial + estado visible.

**Evaluación:** bandeja por etapa, rúbrica CIE digital, **IA que pre-califica + persona que
revisa y modifica** (requisito de clase), dictamen PI, oficio generado, checklist de avales.

**Histórica:** buscador + filtros combinados obligatorios: escuela, investigadora,
temática, estado. Ficha resumen por propuesta.

## 4. Reglas duras (extractos de Disposiciones 2027)

1. **Ingreso solo por Orión** (§2.3.1); cerrada la recepción, nada extemporáneo (§2.3.2).
2. **Nota = 100% Comité Técnico** con rúbrica CIE (§2.3.11).
3. **Productos mínimos por horas semanales totales** (§2.4.1): 1–10h→1, 11–20h→2, 21–30h→3 (+1 por cada 10h).
4. **Presupuesto**: 10h/semana beca asistente obligatorias (§2.3.10); duraderos solo año 1 (§2.3.9).
5. **Riesgos**: mínimo 1 riesgo por actividad + mitigación + responsable (§1.6, §2.11b).
6. **Avales**: toda propuesta requiere acuerdo de consejos coordinadora + participantes con horas, tipo (VIE/VIE-Centros/CONS/REC/DOC/VIESA), periodo y aval de calificación (§2.7).
7. **Tipos de hora**: CONS (consolidado), DOC/ViDa, REC (ad honorem), VIE, VIE-Centros, VIESA (§1.2).
8. **TRL**: básica 1–3, aplicada 3–5, desarrollo 4–7; declarar TRL inicial y final (§2.10.3.4–5).
9. **PI**: identificar potencial desde formulación; si hay, dictamen de Vinculación obligatorio (§2.10.3.1–3).
10. **Ética**: humanos→CEC/CONIS (Ley 9234), biodiversidad→CONAGEBIO (Ley 7788), animales→CICUA/COBAB (Ley 7451). Sin permiso no inicia fase experimental (§2.9.2/2.10).
11. **Quién participa**: solo al día con VIE al cierre (§2.6.1); externos con carta compromiso (§2.6.5); servicios externos ≤30% presupuesto, no sustantivos (§2.6.7).
12. **Evaluación Comité**: equipo, fundamentación, metodología, plan, presupuesto, riesgos, ética, pertinencia/impacto (§2.11a). **Dirección**: morosidad, riesgos, estudiantes, ética, docs (§2.11b). **CIE**: proceso, morosidad, interés estratégico + recursos (§2.11c).
13. **Restricción tecnológica de clase**: base de datos **solo SQL** (ideal Postgres). El prototipo usa SQLite (mismo SQL, cero instalación) para migrar luego a Postgres sin cambiar consultas.

## 5. Rúbrica (estructura Excel — transcribir pesos a DB en Etapa 2)

Dimensiones: equipo investigador · fundamentación · metodología · plan/cronograma ·
presupuesto · riesgos · ética · pertinencia e impacto. Cada una con criterios y puntaje.
El prototipo trae versión de 4 criterios (metodología, fundamentación, plan, impacto)
para no bloquear el flujo — reemplazar por la oficial al tener los pesos.

## 6. Formularios y plantillas (qué campo va a qué pantalla)

- Formulario (.docx) → campos de `index.html#modulo-redactar`.
- Plan + riesgos (.xlsx) → textarea plan + tabla riesgos (v2).
- Presupuesto (.xlsx) → campo número + justificación (v2 desglose).
- Acuerdos 7/8 (.docx) → checklist de avales en evaluación (v2).

## 7. Críticas / riesgos del dominio

- **Orión vs prototipo**: si el flujo real vive en Orión, el valor del prototipo es demostrar evaluación + histórica, no duplicar carga de datos. No prometer integración.
- **IA + rúbrica**: sin pesos oficiales en código, cualquier "nota IA" es ficticia — marcarla como simulada.
- **Avales en papel**: los acuerdos son oficios firmados; el sistema solo registra el check + adjunto.
- **Fotos de clase ausentes**: la evidencia de entrevistas es débil hasta aportarlas.
