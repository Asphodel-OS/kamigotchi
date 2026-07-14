#!/usr/bin/env bash
# auth-roles.sh — who holds which auth role on a Kamigotchi world.
set -euo pipefail

OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KAMIGOTCHI="$(cd "$OPS_DIR/../.." && pwd)"
CONTRACTS="$KAMIGOTCHI/packages/contracts"

# color vars, gated on a tty (repo convention); empty when piped
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; CYAN=$'\033[36m'; RESET=$'\033[0m'
else
  BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; CYAN=""; RESET=""
fi
c()   { printf '%s▸ %s%s\n'   "$CYAN"  "$*" "$RESET"; }
err() { printf '%s  ✗ %s%s\n' "$RED"   "$*" "$RESET" >&2; }

# color-coded -h matching the game2 ops tools' layout
help() {
  printf '%b\n' "
${BOLD}auth-roles${RESET} ${DIM}— who holds which auth role on a Kamigotchi world${RESET}

${BOLD}USAGE${RESET}
  ${CYAN}scripts/ops/auth-roles.sh [local|test|prod]${RESET}   ${DIM}default: local${RESET}

${BOLD}OPTIONS${RESET}
  ${GREEN}-h, --help${RESET}  ${DIM}show this help${RESET}

${BOLD}WHAT IT DOES${RESET}
  ${DIM}Sources RPC + WORLD from packages/contracts/.env.<env>, then runs the
  read-only AuthRolesReport forge script against that world. Role grants are
  LibFlag entities carrying an IDType reverse-index anchor, so holders
  enumerate straight from chain state — no logs or indexer required.${RESET}
"
}

case "${1:-local}" in
  -h|--help)       help; exit 0 ;;
  local)           ENVFILE=".env.local" ;;
  test|testing)    ENVFILE=".env.testing" ;;
  prod|production) ENVFILE=".env.production" ;;
  *) err "unknown env: ${1} (expected local|test|prod)"; exit 1 ;;
esac

[ -f "$CONTRACTS/$ENVFILE" ] || { err "missing $CONTRACTS/$ENVFILE"; exit 1; }
# shellcheck disable=SC1090
. "$CONTRACTS/$ENVFILE"
[ -n "${RPC:-}" ] && [ -n "${WORLD:-}" ] || { err "$ENVFILE must define RPC and WORLD"; exit 1; }

c "auth roles · $ENVFILE · world $WORLD"
( cd "$CONTRACTS" && FOUNDRY_OFFLINE=true forge script \
    deployment/contracts/AuthRolesReport.s.sol:AuthRolesReport \
    --fork-url "$RPC" --skip test --sig 'run(address)' "$WORLD" -vv 2>/dev/null ) \
  | sed -n '/== Logs ==/,$p' | tail -n +2 \
  | sed -e "s/ACTIVE/${GREEN}ACTIVE${RESET}/" \
        -e "s/revoked/${YELLOW}revoked${RESET}/" \
        -e "s/\(ROLE_[A-Z_]*\)/${BOLD}\1${RESET}/"
