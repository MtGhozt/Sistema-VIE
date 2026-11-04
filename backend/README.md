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

Las sugerencias se ejecutan localmente con Ollama. Instale Ollama, inicie su servicio y descargue el modelo:

```bash
ollama pull qwen2.5:7b
```

El backend usa por defecto `http://127.0.0.1:11434`, el modelo `qwen2.5:7b` y un timeout de cinco minutos. Puede cambiarlos en `backend/.env` con `OLLAMA_BASE_URL`, `OLLAMA_MODEL` y `OLLAMA_TIMEOUT_MS`. No se requiere clave ni se envía el expediente a un proveedor externo. Si se usa otra ubicación para el archivo oficial, configure `VIE_OFFICIAL_RUBRIC_PATH`; de lo contrario, el backend lo busca en `docs/oficiales-vie/markdown/2-Rubricas_Investigacion_2027__Fondos_VIE.md`. Las calificaciones humanas, sugerencias y justificativos se guardan por evaluador en `evaluacion` y `evaluacion_puntaje`.

Prototipo SQLite viejo (referencia): `docs/backend-legacy/`.
