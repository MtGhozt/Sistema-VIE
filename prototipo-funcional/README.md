# Prototipo base 0.1 — Fondos VIE (TEC)

Base ultra-simple: **Node + Express + SQLite nativo** (sin ORM, sin frameworks frontend).
Cubre los 3 módulos: redactar → evaluar → histórico.

## Correr (2 pasos, con pnpm)

```powershell
pnpm install
pnpm start
# abrir http://localhost:3000
```

## Qué probar (flujo mínimo del alcance)

1. Redactar: llena el formulario → Guardar borrador.
2. Enviar: en el histórico, botón "Enviar a revisión".
3. Evaluar: en bandeja, pon puntaje → Aprobar / Rechazar.
4. Histórico: filtra por escuela, investigadora o estado.

## Estructura

| Archivo | Qué es |
|---|---|
| `server.js` | Backend: `SCHEMA` (tabla), `SEED` (3 ejemplos), `API` (5 endpoints) |
| `public/index.html` | 3 módulos en 1 página |
| `public/styles.css` | Colores TEC (`--tec-azul #002855`, `--tec-rojo #EF3340`) |
| `public/app.js` | fetch al backend |

## Migrar a Postgres (Etapa 2)

El SQL es estándar. Cambia `node:sqlite` por `pg`, crea la misma tabla
y copia los endpoints. Los `fetch` del frontend no cambian.
