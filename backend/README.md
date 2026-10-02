# Backend — Sistema VIE

API **Express + TypeScript + PostgreSQL**.

## Requisitos

1. Docker Desktop encendido  
2. Desde la raíz del repo: `docker compose up -d`  
3. Node 20+ 

## Config

```powershell
copy .env.example .env
pnpm install   # o: npm install
pnpm dev
```

- Health: `GET http://localhost:3000/api/health`  
- Roles demo: `GET http://localhost:3000/api/demo/roles`  
- Login demo: `POST http://localhost:3000/api/demo/login` body `{ "roleCode": "investigador" }`

## Legacy

El prototipo SQLite anterior quedó en `legacy/` (referencia). No usarlo para desarrollo nuevo.
