# Backend — Sistema VIE

Servidor del prototipo. **Estado actual:** Express + SQLite nativo (`node:sqlite`) como andamiaje mínimo.

**Objetivo:** API sobre **PostgreSQL** usando el esquema de `../database/DisennoDB.sql` (40 tablas).

## Correr

```powershell
pnpm install
pnpm start
# http://localhost:3000
```

## Contenido actual

| Archivo | Rol |
|---|---|
| `server.js` | Endpoints CRUD simplificados + seed |
| `public/` | UI mínima embebida (se reemplazará / separará del frontend) |
| `package.json` | Solo dependencia: `express` |

No commitear `*.db` ni `node_modules/`.
