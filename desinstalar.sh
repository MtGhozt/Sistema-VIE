#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
MODE=desarrollo
PURGE=false
KEEP_DEPS=false
DRY_RUN=false
usage() {
  cat <<'HELP'
Uso: ./desinstalar.sh [--pruebas] [--purgar-datos] [--conservar-dependencias] [--simular]

Detiene el perfil elegido y elimina dependencias/compilaciones locales del proyecto.
Conserva código, .env, documentos, evidencias y volumen PostgreSQL por defecto.
  --pruebas                Selecciona los contenedores/volumen de vie-baseline.
  --purgar-datos            Borra también el volumen del perfil elegido (irreversible).
  --conservar-dependencias  Solo detiene contenedores; conserva dependencias y builds.
  --simular                Muestra acciones sin ejecutar ninguna.
  --help                   Muestra esta ayuda.

No desinstala Node, pnpm, Docker ni cachés compartidas de otras aplicaciones.
Las dependencias locales se comparten entre desarrollo y pruebas.
Cierre antes pnpm dev u otros procesos de este proyecto que haya iniciado a mano.
HELP
}
fail() { printf '%s\n' "$1" >&2; exit 2; }
for arg in "$@"; do
  case "$arg" in
    --pruebas) MODE=pruebas ;;
    --purgar-datos) PURGE=true ;;
    --conservar-dependencias) KEEP_DEPS=true ;;
    --simular) DRY_RUN=true ;;
    --help|-h) usage; exit 0 ;;
    *) fail "Opción desconocida: $arg. Consulte --help." ;;
  esac
done
[[ "$ROOT_DIR" != / && -f "$ROOT_DIR/pnpm-workspace.yaml" && -f "$ROOT_DIR/database/DisennoDB.sql" ]] || fail 'No se encontró la raíz del proyecto; no se elimina nada.'
cd -- "$ROOT_DIR"
COMPOSE=(docker compose -f "$ROOT_DIR/docker-compose.yml")
if [[ "$MODE" == pruebas ]]; then COMPOSE=(docker compose -p vie-baseline -f "$ROOT_DIR/docker-compose.test.yml"); fi
if ! "$DRY_RUN"; then
  command -v docker >/dev/null || fail 'Docker no está disponible. No se eliminaron archivos.'
  docker info >/dev/null 2>&1 || fail 'Docker no está iniciado o no tiene acceso. No se eliminaron archivos.'
fi
run() {
  if "$DRY_RUN"; then printf 'Simular: '; printf '%q ' "$@"; printf '\n'; else "$@"; fi
}
if "$PURGE"; then
  printf 'Se eliminará el volumen PostgreSQL del perfil %s por --purgar-datos.\n' "$MODE"
  run "${COMPOSE[@]}" down --volumes
else
  run "${COMPOSE[@]}" down
fi
if ! "$KEEP_DEPS"; then
  # Lista cerrada de directorios generados. No usar globs ni borrar la raíz.
  for target in node_modules frontend/node_modules backend/node_modules frontend/dist backend/dist; do
    run rm -rf -- "$ROOT_DIR/$target"
  done
fi
printf 'Desinstalación del perfil %s completada%s.\n' "$MODE" "$(if "$DRY_RUN"; then printf ' (simulada)'; fi)"
