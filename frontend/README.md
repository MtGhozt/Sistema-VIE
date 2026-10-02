# Frontend — Sistema VIE

## Fuente de verdad de UI (obligatorio)

El diseño visual y de interacción es **exactamente**:

`public/Fondos-VIE-Prototipo.html`  
(= copia de `reference/Fondos-VIE-Prototipo.html`)

- `npm run dev` abre **ese** prototipo (no un shell inventado).
- Cualquier pantalla nueva en React/TS debe **portarse 1:1** desde ese HTML (mismos layouts, clases, flujos, labels).
- Está **prohibido** inventar otra estética “temporal”.

CSS extraído para el port gradual: `src/styles/prototipo-extraido.css`.

## Correr

```powershell
cd frontend
npm install
npm run dev
```

Abrí la URL de Vite → verás el prototipo original.

## App Vite (`src/`)

Reserva para ir **reemplazando** pantallas del HTML monolítico por componentes React+TS **clonando** el prototipo.
Mientras tanto, la entrada (`index.html`) redirige al HTML de referencia.

Para abrir el playground experimental de Vite (no es la UI de entrega):

```
http://localhost:5173/src-dev.html
```

(solo si existe; no usar para demos de curso)

## API

Cuando una pantalla se porte a React, consumirá `http://localhost:3000` (`VITE_API_URL`).
El HTML de referencia hoy sigue en localStorage hasta que se conecte endpoint por endpoint.
