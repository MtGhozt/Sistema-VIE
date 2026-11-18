#!/bin/bash
# Aplica las migraciones incrementales tras DisennoDB.sql + seed.sql en el primer init del volumen.
# Idempotente: registra cada archivo en sistema_vie_migracion (misma semántica que pnpm db:migrate).
set -euo pipefail

echo "[docker-init] Aplicando migraciones incrementales…"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE TABLE IF NOT EXISTS sistema_vie_migracion (
  archivo text PRIMARY KEY,
  aplicado_en timestamptz NOT NULL DEFAULT NOW()
);
SQL

MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "[docker-init] No se encontró $MIGRATIONS_DIR; se omite."
  exit 0
fi

shopt -s nullglob
for file in "$MIGRATIONS_DIR"/*.sql; do
  name="$(basename "$file")"
  already="$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -Atc \
    "SELECT 1 FROM sistema_vie_migracion WHERE archivo = '$name'")"
  if [ "$already" = "1" ]; then
    echo "[docker-init] Ya aplicada: $name"
    continue
  fi
  echo "[docker-init] Aplicando: $name"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$file"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c \
    "INSERT INTO sistema_vie_migracion(archivo) VALUES ('$name')"
done

echo "[docker-init] Migraciones completadas."
