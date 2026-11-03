# Backend

API Express + TypeScript + PostgreSQL. Código en `src/`.

Desde la raíz: `pnpm db:up` luego `pnpm dev` (o `pnpm dev:backend`).

- Health: `GET /api/health`
- Demo roles: `GET /api/demo/roles`
- Demo login: `POST /api/demo/login` `{ "email": "investigador@tec.ac.cr", "password": "prototipo2026", "roleCode": "investigador" }`
- **CU1** convocatorias: `GET/POST /api/convocatorias`, `GET/PATCH /api/convocatorias/:id`
- **CU2** propuestas: `GET/POST /api/propuestas`, `GET/PATCH /api/propuestas/:id`, `POST /api/propuestas/:id/enviar`
  Headers demo: `X-Demo-User-Id`, `X-Demo-Role`
- **Evaluación IA**: `GET /api/evaluaciones/propuestas/:id/rubrica`, `GET /api/evaluaciones/propuestas/:id/evaluacion-individual`, `POST /api/evaluaciones/propuestas/:id/sugerencia-ia`

Para habilitar sugerencias, configure en el `.env` de la raíz del proyecto:

```env
OPENROUTER_API_KEY=tu_clave_del_servidor
OPENROUTER_MODEL=openrouter/free
```

La clave no debe tener prefijo `VITE_` ni enviarse al navegador. Si se usa otra ubicación para el archivo oficial, configure `VIE_OFFICIAL_RUBRIC_PATH`; de lo contrario, el backend lo busca en `docs/oficiales-vie/markdown/2-Rubricas_Investigacion_2027__Fondos_VIE.md`. Las sugerencias requieren salida JSON y filtran proveedores mediante la política `data_collection: deny`; según la disponibilidad de modelos gratuitos, OpenRouter puede rechazar una solicitud sin un proveedor que cumpla esa política. Las calificaciones humanas, sugerencias y justificativos se guardan por evaluador en `evaluacion` y `evaluacion_puntaje`.

Prototipo SQLite viejo (referencia): `docs/backend-legacy/`.
