# Backend

API Express + TypeScript + PostgreSQL. Código en `src/`.

Desde la raíz: `pnpm db:up` luego `pnpm dev` (o `pnpm dev:backend`).

- Health: `GET /api/health`
- Demo roles: `GET /api/demo/roles`
- Demo login: `POST /api/demo/login` `{ "roleCode": "investigador" }`
- **CU1** convocatorias: `GET/POST /api/convocatorias`, `GET/PATCH /api/convocatorias/:id`
- **CU2** propuestas: `GET/POST /api/propuestas`, `GET/PATCH /api/propuestas/:id`, `POST /api/propuestas/:id/enviar`
  Headers demo: `X-Demo-User-Id`, `X-Demo-Role`

Prototipo SQLite viejo (referencia): `docs/backend-legacy/`.
