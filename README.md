# Sistema VIE (Fondos VIE — TEC)

Prototipo funcional — Gestión de propuestas Fondos VIE.  
Repo: https://github.com/MatiasBS027/Sistema-VIE

**Gestor de paquetes:** `pnpm` (no npm).

## Empezar aquí

1. `PLAN-MAESTRO.md`  
2. `CONTINUIDAD.md`  
3. `docs/casos-de-uso/CASOS-DE-USO.md`  
4. `docs/a11y/INFORME-WCAG.md` (accesibilidad)

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

### Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org) | 20 o superior | frontend y backend |
| [pnpm](https://pnpm.io/installation) | 9 o superior | gestor de paquetes (usa `corepack enable` si no lo tenés) |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | cualquier versión reciente | PostgreSQL 16 |

### Pasos

```powershell
# 1) Clonar
git clone https://github.com/MatiasBS027/Sistema-VIE
cd Sistema-VIE

# 2) Dependencias (una sola vez)
pnpm install

# 3) Base de datos (Postgres 16 en Docker)
pnpm db:up

# 4) Frontend + backend juntos
pnpm dev
```

`pnpm db:up` levanta el contenedor `sistema-vie-db` en el puerto `5432` y
ejecuta automáticamente `database/DisennoDB.sql` (esquema) y
`database/seed.sql` (datos semilla) **solo la primera vez**, cuando se crea
el volumen por primera vez.

### Resultado

| Qué | URL |
|---|---|
| **App (UI)** | http://localhost:5173 |
| API — health check | http://localhost:3000/api/health |
| API — raíz | http://localhost:3000/api |
| PostgreSQL | `postgresql://vie:vie@localhost:5432/fondos_vie` |

### Login demo

La pantalla de login ofrece los **12 roles institucionales** (VIE publicación,
persona investigadora, Centro de Vinculación, Comité Técnico, Consejo de
Escuela, Dirección de Escuela, Gestora VIE, CIE, Dirección de Investigación y
Super Administrador). El correo es `<codigo_rol>@tec.ac.cr` y la contraseña es
la que se escriba: el prototipo **no valida credenciales** (login demo por
rol, sin token).

> El rol Super Administrador puede cambiar la "Vista actual" en la barra
> superior para operar la app completa como CIE, Comité o Consejo.

### Comandos de la raíz

```powershell
pnpm dev            # frontend + backend en paralelo
pnpm dev:frontend   # solo la UI (Vite, :5173)
pnpm dev:backend    # solo la API (Express, :3000)
pnpm db:up          # levanta Postgres
pnpm db:down        # detiene Postgres (conserva el volumen)
pnpm build          # compila backend (tsc) y frontend (vite build)
pnpm brand          # regenera los PNG del logo TEC desde el manual de marca
pnpm brand:preview  # renderiza los PDF del manual a out/brand-render/
```

### Recargar la base de datos

El seed se ejecuta **únicamente al crear el volumen**. Si cambiaste
`database/seed.sql` y querés volver a aplicarlo:

```powershell
docker compose down -v     # borra el volumen (se pierde lo creado a mano)
docker compose up -d       # recrea la base con el seed actual
```

### Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `ECONNREFUSED` en `/api/health` | Postgres no está arriba → `pnpm db:up` |
| La UI dice "No hay conexión con la API" | el backend no está corriendo → `pnpm dev:backend` |
| `port 5432 is already allocated` | ya hay un Postgres local → cambiá el mapeo en `docker-compose.yml` o apagá el local |
| El login no lista los roles | falta el seed → `docker compose down -v && docker compose up -d` |
| Cambié un `.sql` y no se refleja | el seed solo corre al crear el volumen → `down -v` + `up -d` |
| `pnpm: command not found` | `corepack enable` (o instalá pnpm) |

### Variables de entorno

El backend usa `DATABASE_URL` (por defecto `postgresql://vie:vie@localhost:5432/fondos_vie`)
y `PORT` (por defecto `3000`). Se pueden sobrescribir con un `.env` en
`backend/` — ver `backend/.env.example`. El frontend usa `VITE_API_URL` solo
si necesitás apuntar a otra API; en desarrollo el proxy de Vite ya reenvía
`/api` al backend.

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
