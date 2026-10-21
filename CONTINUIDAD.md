# Continuidad — Sistema VIE

Última actualización: 2026-10-02 (parity UI HTML + docs)

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

## Estado UI (2026-10-02) — parity HTML restaurada

Paridad visual/flujo del prototipo HTML recuperada en:

| Área | Qué | Notas |
|------|-----|-------|
| Inicio admin / investigador | `InicioPage` | Admin: acceso por instancia + carriles de flujo; investigador: recientes + timeline |
| Detalle propuesta | `ProposalDetailView` + tabs | Demo `PROP-*` y API numérica; admin ve bloque transversal |
| Wizard 17 pasos | `formWizard` + `FormWizardStepContent` + `PropuestaNuevaPage` | Sidebar con scroll contenido (`.wizard-sidebar`) |
| Evaluaciones por rol | `EvaluacionesPage` + `EvaluationRolePanels` | UI demo local (CU4 pantallas); sin persistencia API aún |

**Se mantiene (no es del HTML 1:1, es avance del producto):**

- Campana de notificaciones + toasts
- Marca TEC (sidebar azul, logos oficiales)
- API **CU1** convocatorias y **CU2** propuestas (bloque inicial)

**CU2 — persistencia real vs UI:**

- API guarda solo el **primer bloque** (título, convocatoria, modalidad, resumen, abstract, keywords).
- Pasos 3–17 del wizard = UI local/demo (estado React); no se persisten al guardar.

**Huecos conocidos (no inventar features ahora):**

- Documento 4 (formulario oficial) sin mapeo campo-a-campo completo
- Impresión / generación de oficios (solo campos en paneles demo)
- Rúbricas = subset por modalidad, no catálogo oficial completo del Excel

## Bitácora reciente

| Fecha | Qué | Pendiente |
|-------|-----|-----------|
| 2026-10-02 | Parity HTML: inicio admin/investigador, detalle, wizard 17 pasos, evaluaciones por rol; edit solo borrador; scroll sidebar wizard | CU3 PI; persistir resto wizard; oficios/PDF; rúbrica completa; a11y |
| 2026-10-01 | **CU2** propuestas: listar/crear borrador/enviar (Postgres) | CU3 PI / más secciones formulario |
| 2026-10-01 | Notificaciones leídas **por usuario**; sin toast al marcar vista | — |
| 2026-10-01 | **CU1** convocatorias persistidas en Postgres (`/api/convocatorias`) | — |
| 2026-10-01 | Logo oficial TEC (`logotec.pdf` → `public/brand/`) en sidebar/login; sidebar azul por contraste | — |
| 2026-10-01 | Login frontend ↔ API demo (`/api/health`, `/api/demo/roles`, `/api/demo/login`) | — |
| 2026-10-01 | Repo ordenado: docs fuera de código; monorepo pnpm; frontend React con rutas/roles del prototipo | — |
| 2026-10-01 | Fase 0: Docker Postgres, API health/demo, Vite | — |
| 2026-10-01 | GitHub + plan + 5 CUs | — |

## Próximos pasos (orden)

1. ~~Definir 5 CUs~~ / ~~Q1–Q4~~ / ~~Fase 0 cimientos~~ / ~~frontend multiarchivo sin API~~
2. ~~Login demo ↔ API~~ · ~~**CU1 convocatoria**~~ · ~~**CU2** formular/enviar (bloque inicial)~~ · ~~parity UI HTML (inicio / detalle / wizard / eval roles)~~
3. **CU3** (dictamen PI) y/o persistir más secciones del wizard CU2.
4. Ampliar rúbricas + oficios/print donde haga falta para demo; a11y; CUs restantes.

## Referencias rápidas

- Plan: `PLAN-MAESTRO.md`
- Casos de uso: `docs/casos-de-uso/CASOS-DE-USO.md`
- BD (docs): `docs/database/` · SQL: `database/`
- **UI referencia:** `docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html`
- **App:** desde la raíz `pnpm dev`
- Claves UI: `frontend/src/pages/InicioPage.tsx`, `PropuestaDetallePage.tsx`, `PropuestaNuevaPage.tsx`, `EvaluacionesPage.tsx`, `components/ProposalDetailView.tsx`, `components/evaluation/`, `data/formWizard.ts`
