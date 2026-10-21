# Sistema VIE (Fondos VIE — TEC)

Prototipo funcional — Gestión de propuestas Fondos VIE.  
Repo: https://github.com/MatiasBS027/Sistema-VIE

**Gestor de paquetes:** `pnpm` (no npm).

## Empezar aquí

1. `PLAN-MAESTRO.md`  
2. `CONTINUIDAD.md`  
3. `docs/casos-de-uso/CASOS-DE-USO.md`

## Estructura

```
Sistema-VIE/
├── backend/     # Solo API (src/)
├── frontend/    # Solo app React (src/ + public/)
├── database/    # Solo SQL (schema + seed)
├── docs/        # Toda la documentación y referencias
├── package.json # Workspace: pnpm dev levanta todo
└── docker-compose.yml
```

## Levantar todo (desde la raíz)

```powershell
# 1) Postgres
pnpm db:up

# 2) Dependencias (una sola vez)
pnpm install

# 3) Frontend + backend juntos
pnpm dev
```

- UI: http://localhost:5173  
- API: http://localhost:3000/api/health  

Solo uno: `pnpm dev:frontend` o `pnpm dev:backend`.

## Dónde está cada cosa

| Qué | Dónde |
|-----|--------|
| App React | `frontend/src` |
| Favicon / estáticos | `frontend/public` |
| Logo TEC (assets de marca) | `frontend/public/brand/` + `docs/manual-identidad-tec/` |
| Scripts de repo | `scripts/` |
| API | `backend/src` |
| SQL | `database/*.sql` |
| Diseño BD (MD/PDF/DBML) | `docs/database/` |
| Prototipo HTML viejo | `docs/prototipo-html-referencia/` |
| API SQLite antigua | `docs/backend-legacy/` |

## Scripts de la raíz

```powershell
pnpm brand          # regenera los PNG del logo TEC desde el manual de marca
pnpm brand:preview  # renderiza los PDF del manual a out/brand-render/ (inspección)
```

Los assets de marca se generan desde los PDF vectoriales que están en
`docs/manual-identidad-tec/`. No hay rutas absolutas ni dependencias de una sola
máquina: cualquier compañero puede correrlos.

## Notas

- Hay **dos** `node_modules` (frontend y backend) porque son dos apps distintas en un monorepo. Eso es normal.  
- `frontend/index.html` lo exige Vite (entrada de la SPA). El backend **no** necesita HTML.  
- No versionar: `node_modules/`, `.env`, `*.db`.
