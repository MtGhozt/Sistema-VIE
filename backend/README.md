# Backend

API Express + TypeScript + PostgreSQL. Código en `src/`.

Desde la raíz: `pnpm db:up` luego `pnpm dev` (o `pnpm dev:backend`).

- Health: `GET /api/health`
- Demo roles: `GET /api/demo/roles`
- Demo login: `POST /api/demo/login` `{ "roleCode": "investigador" }`
- **CU1** convocatorias: `GET/POST /api/convocatorias`, `GET/PATCH /api/convocatorias/:id`, hitos en `/api/convocatorias/:id/hitos`  
  Headers demo: `X-Demo-User-Id`, `X-Demo-Role` (`vie_publicacion` o `admin` para escribir)

Prototipo SQLite viejo (referencia): `docs/backend-legacy/`.
