#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
MODE=desarrollo
VERIFY=false
DRY_RUN=false
BROWSER=false
usage() {
  cat <<'HELP'
Uso: ./instalar.sh [--pruebas] [--verificar] [--con-navegador] [--simular]

Instala dependencias del proyecto, compila, levanta PostgreSQL y aplica migraciones.
  --pruebas        Base aislada fondos_vie_test, puerto 55432.
  --verificar      Reinicia la BD aislada y ejecuta la batería actual completa; requiere --pruebas.
  --con-navegador  Descarga Chromium de Playwright (implícito con --verificar).
  --simular        Muestra las acciones sin instalar ni modificar datos.
  --help           Muestra esta ayuda.

Requisitos: Node compatible con Vite (20.19+ o 22.12+), pnpm o Corepack,
Docker con Compose y su servicio iniciado. No instala herramientas del sistema.
HELP
}
fail() { printf '%s\n' "$1" >&2; exit 2; }
for arg in "$@"; do
  case "$arg" in
    --pruebas) MODE=pruebas ;;
    --verificar) VERIFY=true; BROWSER=true ;;
    --con-navegador) BROWSER=true ;;
    --simular) DRY_RUN=true ;;
    --help|-h) usage; exit 0 ;;
    *) fail "Opción desconocida: $arg. Consulte --help." ;;
  esac
done
[[ -f "$ROOT_DIR/pnpm-workspace.yaml" && -f "$ROOT_DIR/database/DisennoDB.sql" ]] || fail 'No se encontró la raíz del proyecto.'
if "$VERIFY" && [[ "$MODE" != pruebas ]]; then fail '--verificar requiere --pruebas para no escribir fixtures en desarrollo.'; fi
cd -- "$ROOT_DIR"
PNPM_CMD=(pnpm)
if ! "$DRY_RUN"; then
  command -v node >/dev/null || fail 'Instale Node.js antes de continuar.'
  node -e 'const [m,n]=process.versions.node.split(".").map(Number);process.exit((m===20&&n>=19)||(m===22&&n>=12)||m>22?0:1)' || fail 'Node no compatible: use 20.19+ o 22.12+.'
  if command -v pnpm >/dev/null; then PNPM_CMD=(pnpm)
  elif command -v corepack >/dev/null; then PNPM_CMD=(corepack pnpm)
  else fail 'Instale pnpm o habilite Corepack antes de continuar.'; fi
  command -v docker >/dev/null || fail 'Instale Docker con Compose antes de continuar.'
  docker compose version >/dev/null || fail 'Docker Compose no está disponible.'
  docker info >/dev/null 2>&1 || fail 'Docker no está iniciado o la cuenta no tiene acceso. Inícielo y vuelva a ejecutar.'
fi
COMPOSE=(docker compose -f "$ROOT_DIR/docker-compose.yml")
DB_URL="${DATABASE_URL:-postgresql://vie:vie@127.0.0.1:5432/fondos_vie}"
if [[ "$MODE" == pruebas ]]; then
  COMPOSE=(docker compose -p vie-baseline -f "$ROOT_DIR/docker-compose.test.yml")
  DB_URL="${TEST_DATABASE_URL:-postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test}"
  if ! "$DRY_RUN"; then
    TEST_DATABASE_URL="$DB_URL" node -e 'if(new URL(process.env.TEST_DATABASE_URL).pathname!=="/fondos_vie_test")process.exit(1)' || fail 'El modo pruebas requiere la base fondos_vie_test.'
  fi
fi
run() {
  if "$DRY_RUN"; then printf 'Simular: '; printf '%q ' "$@"; printf '\n'; else "$@"; fi
}
run "${PNPM_CMD[@]}" install --frozen-lockfile
run "${PNPM_CMD[@]}" build
run "${COMPOSE[@]}" up -d --wait
if "$DRY_RUN"; then printf 'Simular: aplicar migraciones al perfil %s (sin mostrar credenciales).\n' "$MODE"
else DATABASE_URL="$DB_URL" "${PNPM_CMD[@]}" db:migrate; fi
if "$BROWSER"; then run "${PNPM_CMD[@]}" exec playwright install chromium; fi
if "$VERIFY"; then
  if "$DRY_RUN"; then printf 'Simular: reiniciar fondos_vie_test, cargar 16 escenarios y ejecutar verificar-actual.sh secuencialmente, sin capturas.\n'
  else
    TEST_DATABASE_URL="$DB_URL" "$ROOT_DIR/verificar-actual.sh" --reiniciar
  fi
fi
if "$DRY_RUN"; then printf 'Simulación completada; no se instaló ni modificó el proyecto.\n'; exit 0; fi
if [[ "$MODE" == pruebas ]]; then
  printf 'Perfil de pruebas preparado. PostgreSQL: puerto 55432. Los fixtures y reportes se conservan para inspección.\n'
else
  printf 'Proyecto preparado. Ejecute pnpm dev y abra http://localhost:5173.\n'
  printf 'Si personaliza DATABASE_URL, use esa misma URL al iniciar el backend.\n'
fi
