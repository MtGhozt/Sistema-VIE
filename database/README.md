# Database — solo SQL ejecutable

| Archivo / carpeta | Uso |
|---------|-----|
| `DisennoDB.sql` | DDL base + overlay idempotente 003–014 (esquema completo en init) |
| `seed.sql` | Datos demo |
| `migrations/` | Incrementos 001–N (idempotentes; datos/backfill + upgrade de volúmenes viejos) |
| `docker-init/03-aplicar-migraciones.sh` | En el **primer** `docker compose up`, aplica `migrations/` tras el seed |

Documentación del modelo (MD, DBML, PDF): `docs/database/`.

## Arranque

```powershell
# Desde la raíz
docker compose up -d
# o: pnpm db:up
```

En un volumen **nuevo**, el contenedor ejecuta en orden:

1. `01-schema.sql` ← `DisennoDB.sql` (incluye DDL de migraciones 003–014 al final)
2. `02-seed.sql`
3. `03-aplicar-migraciones.sh` ← backfills/datos + registro en `sistema_vie_migracion` (DDL ya presente = no-op)

En un volumen **ya existente**, Docker no re-ejecuta el init. Use:

```powershell
$env:DATABASE_URL='postgresql://vie:vie@localhost:5432/fondos_vie'; pnpm db:migrate
```

El instalador (`./instalar.sh`) también aplica migraciones tras levantar Compose.
