# Sistema VIE — Frontend

React + TypeScript + **Vite**.

## Correr

```powershell
# Terminal 1 (raíz del repo): Docker Postgres
docker compose up -d

# Terminal 2: API
cd backend
pnpm install
pnpm dev

# Terminal 3: UI
cd frontend
npm install
npm run dev
```

Abrí la URL que imprime Vite (suele ser `http://localhost:5173`).

## Referencia

El prototipo HTML multi-rol quedó en `reference/Fondos-VIE-Prototipo.html` (no es el app Vite).

## API

Por defecto llama a `http://localhost:3000`.  
Podés definir `VITE_API_URL` en `.env` si cambia el puerto.
