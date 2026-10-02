# 00 — ÍNDICE CEREBRO | Proyecto Fondos VIE (TEC)

> Base teórica del proyecto. No es el prototipo final. Es el índice maestro:
> si buscas X, aquí dice en qué archivo/carpeta está.
> Última actualización: 2026-09-09.

## 1. ¿Qué es esto en 30 segundos?

Prototipo académico de sistema web para gestionar **propuestas de investigación
Fondos VIE del TEC**: redactar → evaluar (Comité + VIE + CIE) → consultar histórico.
No sustituye ni se integra con **Orión** en esta etapa. Usa datos semilla realistas.

## 2. Mapa de archivos (dónde está cada cosa)

| Quiero... | Ir a... |
|---|---|
| Ver el índice maestro | `00-INDICE-CEREBRO.md` (este archivo) |
| Saber qué hay en cada carpeta | `01-MAPA-PROYECTO.md` |
| Entender el dominio VIE (flujo, actores, reglas, extractos) | `02-DOMINIO-VIE.md` |
| Colores, logo y reglas marca TEC | `03-MARCA-TEC.md` |
| Prototipo ultra-simple corriendo | `Codigo0.1/` → leer `Codigo0.1/README.md` |
| Documentos oficiales convocatoria 2027 | `DOCS info proyecto/` (ver §3) |
| Análisis etapa 1 (contexto, personas, arquitectura) | `ETAPA1/` (ver §4) |
| Manuales de identidad TEC (PDF) | `Manual Identidad Tec/` (ver §5) |

## 3. DOCS info proyecto/ — qué contiene

| # | Archivo | Qué es | Dónde se usa en el prototipo |
|---|---|---|---|
| 1 | `1-Disposiciones Convocatoria Fondos VIE 2027.pdf` | Reglas oficiales (alcance, horas, productos, avales, evaluación, TRL, PI) | `02-DOMINIO-VIE.md` §2–§5 |
| 2 | `2-Rúbricas_Investigación_2027__Fondos_VIE.xlsx` | Criterios Comité Técnico (equipo, fundamentación, metodología, plan, presupuesto, riesgos, ética, impacto) | Módulo Evaluación |
| 4 | `4- Formulario Proyecto Investigacion Fondos VIE 2027.docx` | Campos oficiales (problema, objetivos, estado del arte, metodología, equipo, horas) | Módulo Redacción |
| 5 | `5- Plan de Acción y Gestión del Riesgo Fondos VIE 2027.xlsx` | 1 riesgo por actividad + mitigación + responsable | Campo plan/riesgos |
| 6 | `6- Plantilla Presupuesto Convocatoria Fondos VIE 2027.xlsx` | Presupuesto operativo (mín. 10h beca asistente) | Campo presupuesto |
| 7–8 | `7- Formato acuerdo coordinadora / 8- participante.docx` | Avales de consejos (horas, tipo, periodo, calificación Comité) | Checklist avales |
| — | `Cronograma_Convocatoria_2027...pdf` | Fechas de recepción/cierre (plataforma cierra y no recibe extemporáneos) | Banner convocatoria |
| — | `Basado en los documentos adjuntos, genera las ins....pdf` | Instructivo derivado | Referencia |

## 4. ETAPA1/ — qué contiene

| Archivo | Qué es | Estado |
|---|---|---|
| `Contexto-Proyecto-Fondos-VIE.md` | Contexto, 3 módulos, actores, alcance, diagrama, apuntes de clase (flujo VIE→Centro→investigadores→Vinculación→VIE, IA con rúbrica + revisión humana, solo SQL/Postgres) | Completo, base del dominio |
| `Analisis-de-Personas-Fondos-VIE.md` | 6 personas (VIE, profesores, Vinculación, Comité, Consejo, VIE/CIE) + Super Admin, matrices de necesidades y permisos | Completo |
| `Arquitectura-de-Informacion-*.md + .pdf + _assets/` | Teoría del curso (análisis existente, proceso, card sorting, wireframes). Fotos de pizarra, no decisiones del sistema | Referencia teórica |
| Anexos fotográficos | Placeholders `[Insertar fotografía]` — **faltan las fotos** | ⚠️ Pendiente aportar |

## 5. Manual Identidad Tec/ — qué contiene

| Archivo | Qué es |
|---|---|
| `30_01_25-manual-tec-1.pdf` (~6 MB) | Libro de marca TEC completo |
| `logotec.pdf`, `firmatec-1.pdf`, `firmatec-2.pdf` | Logo y firmas TEC-1 / TEC-2 |
| Reglas extraídas | Ver `03-MARCA-TEC.md` (PANTONE 295C azul, 032C rojo, 70/20/5/5) |

## 6. Prototipo base (Codigo0.1/)

```
Codigo0.1/
  package.json      → solo dependencia: express (DB usa node:sqlite nativo)
  server.js         → backend ~120 líneas: SQLite + 5 endpoints REST
  public/
    index.html      → 1 página, 3 módulos + login simulado por rol
    styles.css      → colores TEC, sin frameworks
    app.js          → fetch al backend, sin frameworks
```

Cómo correr: ver `Codigo0.1/README.md` (2 comandos con pnpm).

## 7. Preguntas abiertas / críticas (para decidir antes de Etapa 2)

1. **Fotos de clase**: los anexos piden 4 fotos — sin ellas se pierde evidencia de entrevistas. ¿Las aportas?
2. **Rúbrica digital**: ¿qué pesos exactos por criterio? El Excel los tiene — hay que transcribirlos a la DB.
3. **IA evaluadora**: ¿simulada (reglas fijas) o API real? Implica costos/privacidad.
4. **Roles reales**: ¿login real TEC o simulado? Hoy es simulado por selector.
5. **Orión**: confirmado sin integración — ¿se mantiene así todo el semestre?
6. **Horas CONS/DOC/VIESA/REC**: ¿el prototipo valida topes o solo los registra?

## 8. Glosario mínimo

VIE, CIE, Comité Técnico, Consejo de Escuela, Centro de Vinculación, Orión,
TRL 1–7, horas VIE/CONS/DOC/VIESA/REC, dictamen, aval, rúbrica CIE.
Definiciones completas en `02-DOMINIO-VIE.md`.
