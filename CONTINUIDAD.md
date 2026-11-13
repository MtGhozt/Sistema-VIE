# Continuidad — Sistema VIE

> **Actualización de correcciones · 2026-10-31:** [estado técnico, evidencias y decisiones pendientes](correcciones/ESTADO-DE-REVISION.md). Instalación y limpieza por `instalar.sh` / `desinstalar.sh`; uso actualizado en README. El resto de este documento conserva contexto anterior y no sustituye ese seguimiento.
>
> **UI demo · 2026-11-04:** detalle = wizard en solo lectura, KPIs reales, filtros, line sidebar de pasos. Ver [docs/ui-demo-noviembre-2026.md](docs/ui-demo-noviembre-2026.md).
>
> **Post-auditoría · 2026-11-09:** CU2 (equipo, plan, presupuesto, adjuntos) y CU3/CU4 están **persistidos** (D01–D11 + MERGE-IAN). CaseFile de Evaluaciones carga el detalle real vía API. Prioridad de cierre: [correcciones/PRIORIDAD-POST-AUDITORIA.md](correcciones/PRIORIDAD-POST-AUDITORIA.md). Este resumen corto no sustituye ESTADO-DE-REVISION ni MERGE-IAN.
>
> **Correcciones finales · 2026-11-11:** perfil VIE Publicación — pantallas propias, validación en español, fechas `DD/MM/YYYY`, presupuesto/cronograma obligatorios. Ver [correcciones/correcciones-finales/README.md](correcciones/correcciones-finales/README.md) y `pnpm regression:vie-final`.


Última actualización: 2026-11-11 (VIE Publicación + docs alineados post-pull)

## Lectura para el equipo

1. **`PLAN-MAESTRO.md`** — plan detallado, decisiones, preguntas Q1–Q4, fases  
2. Este `CONTINUIDAD.md` — resumen corto  
3. `docs/casos-de-uso/CASOS-DE-USO.md` — los 5 CUs  

## GitHub

- Remoto: https://github.com/MatiasBS027/Sistema-VIE (privado)
- Rama: `master`

## Repo oficial

Clon desde GitHub (repo privado → pedir acceso a Matias):

```powershell
git clone https://github.com/MatiasBS027/Sistema-VIE
cd Sistema-VIE
pnpm install
```

Estructura (todas las rutas son relativas a la raíz del repo):

- `backend/` — **solo código** API Express + TS + PostgreSQL
- `frontend/` — **solo código** React + TS + Vite
- `database/` — **solo SQL** (`DisennoDB.sql`, `seed.sql`)
- `docs/` — toda la documentación (BD, prototipo HTML, legado, CUs…)
- Raíz: monorepo **pnpm** → `pnpm install` + `pnpm dev` levanta front y back

## Decisiones acordadas con Matias

1. GitHub / trabajo = **Sistema-VIE** (opción B), no `TEC_No_Git` ni solo docs.
2. Stack objetivo:
   - Backend: **Node.js + TypeScript + Express + PostgreSQL (`pg`)**
   - Frontend: **React + TypeScript + Vite**
   - Sin Nest/Prisma/GraphQL al inicio
3. Los **5 casos de uso** están definidos y **aprobados** en `docs/casos-de-uso/CASOS-DE-USO.md`.
4. Rúbrica prototipo funcional: UI 22% + a11y 28% + 5 CUs con CRUD 50%.
5. Docs académicos se pueden limpiar del entregable al final; por ahora se quedan en `docs/`.
6. **Postgres = Docker Compose**; **auth = login demo por rol**; **CU4 = pantallas por rol** (como el HTML).
7. **UI fuente de verdad = `docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html`** (1:1). Código en `frontend/src`. Docs fuera de frontend/backend/database.
8. **pnpm** en la raíz; no usar npm en este repo (D17).
9. **Sidebar azul TEC** + **logo oficial** de `docs/manual-identidad-tec/logotec.pdf` (`frontend/public/brand/logotec-blanco.png`). La variante blanca del manual exige fondo azul/oscuro; por eso la barra no es blanca.
10. **Edición de propuesta:** solo si `estadoActual === "borrador"`. Enviada / en flujo = solo lectura (botón Editar oculto; ruta `?edit=` redirige).

## Estado UI (2026-10-21) — accesibilidad + CU5 con datos reales

Paridad visual/flujo del prototipo HTML recuperada en:

| Área | Qué | Notas |
|------|-----|-------|
| Inicio admin / investigador | `InicioPage` | Admin: acceso por instancia + carriles de flujo; investigador: recientes + timeline |
| Detalle propuesta | `PropuestaDetallePage` (wizard RO 17 pasos) | API numérica; CaseFile en Evaluaciones con detalle enriquecido |
| Wizard 17 pasos | `formWizard` + `FormWizardStepContent` + `PropuestaNuevaPage` | Sidebar con scroll contenido (`.wizard-sidebar`) |
| Evaluaciones por rol | `EvaluacionesPage` + `EvaluationRolePanels` | **CU3/CU4 persistidos** vía `/api/evaluaciones/*` (bandeja + acciones) |
| **Histórico (CU5)** | `HistoricoPage` | **Datos desde Postgres** con filtros combinables por escuela, investigadora, línea, estado y año |

**Accesibilidad (Sprint 3) — `docs/a11y/INFORME-WCAG.md`:**

- Capa CSS nueva `frontend/src/styles/a11y.css` (cargada al final): tokens de contraste
  con ratios AA, anillo de foco global `:focus-visible`, skip-link, `prefers-reduced-motion`
  y `forced-colors`. El CSS del prototipo **no se editó**.
- Modales con trampa de foco + `Escape` + nombre accesible (`SimpleModal`).
- Regiones `aria-live` permanentes: los toasts y los errores ahora se anuncian.
- Pestañas con patrón APG, jerarquía `h1→h2→h3`, landmarks `main`/`footer`, `htmlFor` explícito.

**CU5 — persistencia real:**

- `GET /api/historico/propuestas?escuela=&investigadora=&linea=&estado=&anio=` con JOINs a
  `escuela`, `usuario`, `propuesta_linea`, `linea_investigacion`, `resolucion_cie`,
  `aval_consejo`, `resultado_comite` y `dictamen_pi`.
- `database/seed.sql` ampliado: 6 escuelas, 12 personas investigadoras, 8 líneas,
  16 propuestas (2024–2026) con historial de estados, oficios y resoluciones del CIE.
- El filtro "Temática" de la UI se llama **Línea / Temática** y mapea a
  `linea_investigacion` (la tabla real del modelo).

**Se mantiene (no es del HTML 1:1, es avance del producto):**

- Campana de notificaciones + toasts
- Marca TEC (sidebar azul, logos oficiales)
- API **CU1** convocatorias y **CU2** propuestas (bloque inicial)

**CU2 — persistencia real (actualizado 2026-11-09):**

- API guarda bloque narrativo (`problema`, `objetivo_general`, `metodologia`, …) **y**
  equipo/horas tipificadas, plan/riesgos, presupuesto anual, productos, ética, complementos Ian
  (`formulario_detalle`) y adjuntos PDF/DOCX/XLSX versionados.
- Wizard de redacción: `FormWizardIan` + hidratación desde `GET /propuestas/:id`.
- Edición solo en `borrador` o secciones autorizadas en `en_subsanacion`.

**CU3 / CU4 — persistencia real (2026-10-29 → 2026-11-09):**

- `GET /api/evaluaciones/bandeja` — expedientes no-borrador filtrados por rol/etapa.
- `POST /api/evaluaciones/propuestas/:id/acciones` — `{ action, payload }` escribe en
  `dictamen_pi`, `revision_expediente`, `observacion`, `resultado_comite`,
  `aval_consejo`, `resolucion_cie`, `comunicacion_institucional`, `notificacion`
  y avanza `estado_actual` + `etapa_flujo` + `propuesta_historial_estado`.
- Rúbricas oficiales de 100 puntos; tres evaluadores independientes + consolidación;
  puntajes en `evaluacion` / `evaluacion_puntaje`.
- CaseFile en Evaluaciones carga el expediente completo desde la API (no plantilla demo).
- UI: bandeja vacía = mensaje de vacío; **ya no** se inventan expedientes locales.

**Huecos conocidos (no inventar features ahora):**

- Revisión humana campo-a-campo del formulario oficial (aceptación V02 / I07)
- Impresión / generación automática de oficios PDF (números de oficio sí se registran; botones etiquetados «fuera de alcance»)
- Imágenes/videos fuera de alcance (solo PDF/DOCX/XLSX)
- Aceptación humana V01–V06 aún pendiente del equipo

**a11y rúbrica (2026-10-29):** toggle alto contraste · alt text editable en
recursos del wizard · checklist NVDA en `docs/a11y/INFORME-WCAG.md`.

**Fuentes oficiales en Markdown:** `docs/oficiales-vie/markdown/` (markitdown).

## Bitácora reciente

| Fecha | Qué | Pendiente |
|-------|-----|-----------|
| 2026-11-11 | **VIE Publicación:** rutas/crear/editar/revisar, filtros como histórico, vigencia presupuesto y ≥1 actividad; evidencia en `correcciones-finales/` | Firma manual REVISION-MANUAL + V01–V06 |
| 2026-11-09 | **Post-auditoría:** CaseFile enriquecido desde `GET /propuestas/:id`; limpieza de adapters/demo muertos; eliminado `ProposalDetailView`; docs CONTINUIDAD + WCAG + guion V01 | Firma humana V01–V06 |
| 2026-10-29 | **CU3/CU4 API + UI**: bandeja y acciones persistidas; flujo investigador→evaluador→histórico demostrable | `evaluacion_puntaje` fino; oficios PDF |
| 2026-10-29 | **CU2 ampliación**: problema / objetivo general / metodología en create+patch | equipo, plan, presupuesto en tablas hijas |
| 2026-10-29 | **CU2 enviar desde UI**: wizard «Enviar a revisión» + detalle de borrador llaman `POST /propuestas/:id/enviar` | — |
| 2026-10-29 | **a11y**: control alto contraste, alt text en Documentación, checklist lector de pantalla | axe/Playwright |
| 2026-10-29 | **fix evaluaciones**: modo demo ya no finge persistencia; actualiza UI y avisa; Confirmar aval exige justificación visible | — |
| 2026-10-29 | **smoke API**: `pnpm smoke` → `scripts/smoke-e2e.mjs` (CU1/CU2/CU5 + bandeja). Los FAIL viejos de `out-e2e-smoke.txt` eran falsos (PowerShell `H`=`Get-History`) | — |
| 2026-10-29 | Oficiales VIE convertidos a Markdown (`docs/oficiales-vie/markdown/`) | — |
| 2026-10-21 | **Sprint 3 — a11y WCAG AA**: contraste, foco visible, modales accesibles, live regions, roles ARIA, skip-link, jerarquía de encabezados | Toggle alto contraste; alt text uploads; NVDA/JAWS |
| 2026-10-21 | **Sprint 1 — CU5 histórico**: endpoint con filtros combinables en Postgres, frontend conectado, seed realista (6 escuelas · 12 investigadoras · 16 propuestas · 8 líneas) | — |
| 2026-10-02 | Parity HTML: inicio admin/investigador, detalle, wizard 17 pasos, evaluaciones por rol; edit solo borrador; scroll sidebar wizard | CU3 PI; persistir resto wizard; oficios/PDF; rúbrica completa |
| 2026-10-01 | **CU2** propuestas: listar/crear borrador/enviar (Postgres) | CU3 PI / más secciones formulario |
| 2026-10-01 | Notificaciones leídas **por usuario**; sin toast al marcar vista | — |
| 2026-10-01 | **CU1** convocatorias persistidas en Postgres (`/api/convocatorias`) | — |
| 2026-10-01 | Logo oficial TEC (`logotec.pdf` → `public/brand/`) en sidebar/login; sidebar azul por contraste | — |
| 2026-10-01 | Login frontend ↔ API demo (`/api/health`, `/api/demo/roles`, `/api/demo/login`) | — |
| 2026-10-01 | Repo ordenado: docs fuera de código; monorepo pnpm; frontend React con rutas/roles del prototipo | — |
| 2026-10-01 | Fase 0: Docker Postgres, API health/demo, Vite | — |
| 2026-10-01 | GitHub + plan + 5 CUs | — |

> **Seed:** el script de `database/seed.sql` corre solo al crear el volumen de Docker.
> Para reaplicarlo sobre una base existente: `docker compose down -v && docker compose up -d`.

## Próximos pasos (orden)

1. ~~Definir 5 CUs~~ / ~~Q1–Q4~~ / ~~Fase 0 cimientos~~ / ~~frontend multiarchivo sin API~~
2. ~~Login demo ↔ API~~ · ~~**CU1 convocatoria**~~ · ~~**CU2** formular/enviar (bloque inicial)~~ · ~~parity UI HTML~~ · ~~**a11y WCAG AA**~~ · ~~**CU5 histórico con datos reales**~~
3. ~~**CU3/CU4** persistencia (dictamen, aval, resolución) + avance de estado~~
4. ~~a11y rúbrica: toggle alto contraste, checklist lector~~ · ~~wizard completo persistido (Ian + D01–D11)~~ · ~~CaseFile con detalle API~~
5. Firma humana V01–V06 + NVDA presencial (ver [correcciones/GUIION-DEMO-V01.md](correcciones/GUIION-DEMO-V01.md)).
6. Firma manual VIE Publicación ([REVISION-MANUAL.md](correcciones/correcciones-finales/REVISION-MANUAL.md)); adaptar 2 pruebas merge-ian del investigador.
7. Opcional / diferido: seed de adjuntos, UNIQUE evaluación, `propuesta_asignacion`, PDF oficios.

## Referencias rápidas

- Plan: `PLAN-MAESTRO.md`
- Casos de uso: `docs/casos-de-uso/CASOS-DE-USO.md`
- Accesibilidad: `docs/a11y/INFORME-WCAG.md`
- BD (docs): `docs/database/` · SQL: `database/`
- **UI referencia:** `docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html`
- **App:** desde la raíz `pnpm dev`
- Claves UI: `frontend/src/pages/InicioPage.tsx`, `PropuestaDetallePage.tsx`, `PropuestaNuevaPage.tsx`, `ConvocatoriasPage.tsx`, `EvaluacionesPage.tsx`, `HistoricoPage.tsx`, `components/evaluation/CaseFile.tsx`, `data/formWizardIan.ts`
- Prioridad post-auditoría: `correcciones/PRIORIDAD-POST-AUDITORIA.md` · Guion V01: `correcciones/GUIION-DEMO-V01.md`
- Correcciones finales VIE: `correcciones/correcciones-finales/`
