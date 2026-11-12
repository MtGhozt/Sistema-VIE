#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROFILE=""; COUNT=8; DRY=false
usage(){ cat <<'HELP'
Uso: ./cargar-propuestas-demo.sh (--pruebas | --desarrollo) [--cantidad N] [--simular]
Carga propuestas demostrativas realistas mediante el flujo normal de la API.
  --pruebas     fondos_vie_test, puerto 55432 (TEST_DATABASE_URL si está definida).
  --desarrollo  fondos_vie, puerto 5432 (DATABASE_URL si está definida).
  --cantidad N  Entre 8 y 80, por defecto 8. Cada ejecución crea un lote nuevo.
  --simular     Describe el lote sin conectar ni modificar la base.
No elimina datos, no envía mensajes externos y no cambia propuestas existentes.
Requiere instalación y compilación previas, y los usuarios demo del seed.
Los estados/avales/notificaciones creados son simulaciones identificadas como DEMO.
HELP
}
while (($#)); do case "$1" in
 --pruebas) [[ -z "$PROFILE" ]] || { echo 'Seleccione un único perfil.' >&2; exit 2; };PROFILE=pruebas;shift;;
 --desarrollo) [[ -z "$PROFILE" ]] || { echo 'Seleccione un único perfil.' >&2;exit 2; };PROFILE=desarrollo;shift;;
 --cantidad) [[ $# -ge 2 ]] || { echo 'Falta la cantidad.' >&2;exit 2; };COUNT="$2";shift 2;;
 --simular) DRY=true;shift;;
 --help|-h) usage;exit 0;;
 *) usage >&2;exit 2;;
esac; done
[[ -n "$PROFILE" ]] || { usage >&2;exit 2; }
[[ "$COUNT" =~ ^[0-9]+$ ]] && ((COUNT>=8&&COUNT<=80)) || { echo 'La cantidad debe estar entre 8 y 80.' >&2;exit 2; }
if "$DRY"; then printf 'Simulación: %s propuestas nuevas en perfil %s. Estados: borrador, enviada, en subsanación, dictaminada, avalada, aprobada, rechazada y rechazo de aval.\n' "$COUNT" "$PROFILE";exit 0;fi
[[ -f "$ROOT_DIR/backend/dist/app.js" ]] || { echo 'Ejecute pnpm build antes de cargar datos.' >&2;exit 2; }
DEMO_DB_URL="${DATABASE_URL:-postgresql://vie:vie@127.0.0.1:5432/fondos_vie}"
if [[ "$PROFILE" == pruebas ]];then DEMO_DB_URL="${TEST_DATABASE_URL:-postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test}";fi
DATABASE_URL="$DEMO_DB_URL" node "$ROOT_DIR/scripts/cargar-propuestas-demo.mjs" --perfil "$PROFILE" --cantidad "$COUNT"
