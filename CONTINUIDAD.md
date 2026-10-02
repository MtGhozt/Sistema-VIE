# Continuidad — Sistema VIE

Última actualización: 2026-10-01 (noche — limpieza + pnpm + React multiarchivo)

## Lectura para el equipo

1. **`PLAN-MAESTRO.md`** — plan detallado, decisiones, preguntas Q1–Q4, fases  
2. Este `CONTINUIDAD.md` — resumen corto  
3. `docs/casos-de-uso/CASOS-DE-USO.md` — los 5 CUs  

## GitHub

- Remoto: https://github.com/MatiasBS027/Sistema-VIE (privado)
- Rama: `master`

## Repo oficial (local)

`C:\Universidad\ProyectosU\IVSemestre\Diseno\Sistema-VIE`

Estructura:

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

## Bitácora reciente

| Fecha | Qué | Pendiente |
|-------|-----|-----------|
| 2026-10-01 | Login frontend ↔ API demo (`/api/health`, `/api/demo/roles`, `/api/demo/login`) | CU1 convocatorias contra Postgres |
| 2026-10-01 | Repo ordenado: docs fuera de código; monorepo pnpm; frontend React con rutas/roles del prototipo | — |
| 2026-10-01 | Fase 0: Docker Postgres, API health/demo, Vite | — |
| 2026-10-01 | GitHub + plan + 5 CUs | — |

## Próximos pasos (orden)

1. ~~Definir 5 CUs~~ / ~~Q1–Q4~~ / ~~Fase 0 cimientos~~ / ~~frontend multiarchivo sin API~~
2. ~~Login demo ↔ API~~ · **CU1 convocatoria** contra Postgres, clonando el HTML de referencia.
3. Completar port de formularios/rúbricas del prototipo + a11y + CUs restantes.

## Referencias rápidas

- Plan: `PLAN-MAESTRO.md`
- Casos de uso: `docs/casos-de-uso/CASOS-DE-USO.md`
- BD (docs): `docs/database/` · SQL: `database/`
- **UI referencia:** `docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html`
- **App:** desde la raíz `pnpm dev`
