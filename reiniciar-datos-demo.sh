#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROFILE=""; COUNT=16; DRY=false
for arg in "$@"; do
 case "$arg" in
  --desarrollo) [[ -z "$PROFILE" ]] || exit 2; PROFILE=desarrollo;;
  --pruebas) [[ -z "$PROFILE" ]] || exit 2; PROFILE=pruebas;;
  --simular) DRY=true;;
  --help|-h) echo 'Uso: ./reiniciar-datos-demo.sh (--desarrollo | --pruebas) [--simular]'; echo 'BORRA todos los datos del esquema público de la base local elegida, restaura usuarios/catálogos y crea 16 escenarios por API. No toca otras bases, archivos ni dependencias.'; exit 0;;
  *) echo 'Opción inválida. Use --help.' >&2; exit 2;;
 esac
done
[[ -n "$PROFILE" ]] || { echo 'Seleccione --desarrollo o --pruebas explícitamente.' >&2; exit 2; }
if "$DRY"; then echo "Simulación: BORRAR esquema público del perfil $PROFILE y crear $COUNT escenarios nuevos. No se cambió nada."; exit 0; fi
[[ -f "$ROOT_DIR/backend/dist/app.js" ]] || { echo 'Ejecute pnpm build antes del reinicio.' >&2; exit 2; }
DB_TARGET="${DATABASE_URL:-postgresql://vie:vie@127.0.0.1:5432/fondos_vie}"
if [[ "$PROFILE" == pruebas ]]; then DB_TARGET="${TEST_DATABASE_URL:-postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test}"; fi
printf 'Se borrarán los datos anteriores del perfil %s y se cargarán 16 escenarios DEMO.\n' "$PROFILE"
DATABASE_URL="$DB_TARGET" node "$ROOT_DIR/scripts/reiniciar-datos-demo.mjs" "$PROFILE" "$COUNT"
