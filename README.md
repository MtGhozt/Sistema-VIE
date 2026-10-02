# Sistema VIE (Fondos VIE — TEC)

Prototipo funcional — Gestión de propuestas Fondos VIE.  
Repo: https://github.com/MatiasBS027/Sistema-VIE

## Empezar aquí (equipo)

1. Leer **`PLAN-MAESTRO.md`** (decisiones Q1–Q4 ya respondidas).  
2. Leer `CONTINUIDAD.md` y `docs/casos-de-uso/CASOS-DE-USO.md`.  
3. Trabajar solo en este repo.

## Estructura

```
Sistema-VIE/
├── backend/     # API Express + TypeScript + PostgreSQL
├── frontend/    # React + TypeScript + Vite
├── database/    # DDL 40 tablas + seed
├── docs/        # Material académico
└── docker-compose.yml
```

## Levantar el entorno (Fase 0)

```powershell
# 1) Postgres (Docker Desktop encendido)
docker compose up -d

# 2) API
cd backend
npm install
npm run dev
# http://localhost:3000/api/health

# 3) UI
cd ../frontend
npm install
npm run dev
# http://localhost:5173
```

Login demo (API): roles en `GET /api/demo/roles`.  
**UI de entrega:** el prototipo HTML (`frontend/public/Fondos-VIE-Prototipo.html`) — mismo look que el diseño original.  
Referencia/copia: `frontend/reference/Fondos-VIE-Prototipo.html`.

## Base de datos

Fuente de verdad: `database/Diseno_Base_Datos_Fondos_VIE (con cambios).md` (40 tablas).  
Credenciales locales Docker: usuario/clave/db = `vie` / `vie` / `fondos_vie` · puerto `5432`.

## Notas Git

No versionar: `node_modules/`, `*.db`, `.env`.  
Sí versionar: SQL, PDF de diseño, documentación del curso.
