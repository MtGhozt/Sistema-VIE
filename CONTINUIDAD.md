# Continuidad — Sistema VIE

Última actualización: 2026-10-01

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

- `backend/` — Express (hoy SQLite andamiaje) → migrar a **PostgreSQL**
- `frontend/` — prototipo HTML React empaquetado → **React + TypeScript + Vite**
- `database/` — diseño 40 tablas (fuente de verdad: MD *con cambios* + `DisennoDB.sql`)
- `docs/` — material académico (rúbrica, oficiales VIE, etapa1, marca TEC)

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
7. **UI fuente de verdad = `Fondos-VIE-Prototipo.html`** (1:1). No inventar otra interfaz.

## Próximos pasos (orden)

1. ~~Definir 5 CUs~~ / ~~Q1–Q4~~ / ~~Fase 0 cimientos~~
2. Portar/conectar pantallas del prototipo a API empezando por login demo + **CU1 convocatoria**, siempre clonando el HTML.
3. Fase 1+: CUs restantes + a11y

## Referencias rápidas

- Plan: `PLAN-MAESTRO.md`
- Casos de uso: `docs/casos-de-uso/CASOS-DE-USO.md`
- BD: `database/Diseno_Base_Datos_Fondos_VIE (con cambios).md`
- **UI:** `frontend/public/Fondos-VIE-Prototipo.html`
