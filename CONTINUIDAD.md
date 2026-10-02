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
3. Los **5 casos de uso** están definidos en `docs/casos-de-uso/CASOS-DE-USO.md` (borrador de equipo; ajustables).
4. Rúbrica prototipo funcional: UI 22% + a11y 28% + 5 CUs con CRUD 50%.
5. Docs académicos se pueden limpiar del entregable al final; por ahora se quedan en `docs/`.

## Próximos pasos (orden)

1. ~~Definir 5 CUs~~ → revisar/aprobar `docs/casos-de-uso/CASOS-DE-USO.md` con el equipo.
2. Fase 0: Postgres + aplicar `database/DisennoDB.sql` + backend TS healthcheck.
3. Fase 1+: CRUD CU1 → frontend Vite → CUs 2–5 → a11y → limpieza SQLite/`backend/public`.

## Referencias rápidas

- Casos de uso: `docs/casos-de-uso/CASOS-DE-USO.md`
- Rúbrica: `docs/rubrica-prototipo-funcional/`
- BD: `database/Diseno_Base_Datos_Fondos_VIE (con cambios).md`
- UI de referencia: `frontend/Fondos-VIE-Prototipo.html`
