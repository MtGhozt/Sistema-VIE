# Frontend

App React + Vite. Código en `src/`. Estáticos en `public/` (favicon).

Desde la raíz: `pnpm db:up` + `pnpm dev`. En dev, Vite proxy `/api` → `:3000`.

Login usa `GET /api/demo/roles` y `POST /api/demo/login` (usuarios seed en Postgres).
