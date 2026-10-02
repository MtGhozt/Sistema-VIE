# Backend

API Express + TypeScript + PostgreSQL. Código en `src/`.

Desde la raíz: `pnpm db:up` luego `pnpm dev` (o `pnpm dev:backend`).

- Health: `GET /api/health`
- Demo roles: `GET /api/demo/roles`
- Demo login: `POST /api/demo/login` `{ "roleCode": "investigador" }`

Prototipo SQLite viejo (referencia): `docs/backend-legacy/`.
