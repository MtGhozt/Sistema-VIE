#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
RESET=false
for arg in "$@"; do
 case "$arg" in
  --reiniciar) RESET=true;;
  --help|-h) echo 'Uso: ./verificar-actual.sh [--reiniciar]'; echo 'Compila y valida exclusivamente fondos_vie_test. --reiniciar BORRA la BD de pruebas y carga 16 escenarios antes de validar; al aprobar vuelve a dejar solo esos escenarios limpios.'; exit 0;;
  *) echo 'Opción inválida.' >&2; exit 2;;
 esac
done
cd "$ROOT_DIR"
export TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test}"
node -e 'const u=new URL(process.env.TEST_DATABASE_URL);if(u.pathname!=="/fondos_vie_test"||!["localhost","127.0.0.1","[::1]"].includes(u.hostname))throw new Error("Solo se permite la base local fondos_vie_test")'
if command -v pnpm >/dev/null; then PNPM_CMD=(pnpm)
elif command -v corepack >/dev/null; then PNPM_CMD=(corepack pnpm)
else echo 'Instale pnpm o habilite Corepack.' >&2; exit 2; fi
"${PNPM_CMD[@]}" build
docker compose -p vie-baseline -f docker-compose.test.yml up -d --wait db-test
if "$RESET"; then "$ROOT_DIR/reiniciar-datos-demo.sh" --pruebas
else DATABASE_URL="$TEST_DATABASE_URL" node "$ROOT_DIR/scripts/migrate.mjs"; fi
node "$ROOT_DIR/scripts/verificar-actual.mjs"
if "$RESET"; then "$ROOT_DIR/reiniciar-datos-demo.sh" --pruebas; fi
