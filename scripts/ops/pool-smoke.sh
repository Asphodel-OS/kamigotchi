#!/usr/bin/env bash
# pool-smoke.sh — end-to-end smoke of the item-pool AMM on the local world.
set -euo pipefail

OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KAMIGOTCHI="$(cd "$OPS_DIR/../.." && pwd)"
CONTRACTS="$KAMIGOTCHI/packages/contracts"

# anvil default keys #1/#2 — smoke-test player owner/operator (overridable).
# sourced from the canonical shared file so the raw literals live in one place.
# shellcheck disable=SC1091
. "$OPS_DIR/../services/anvil-keys.sh"
OWNER_KEY="${SMOKE_OWNER_KEY:-$ANVIL1}"
OPERATOR_KEY="${SMOKE_OPERATOR_KEY:-$ANVIL2}"

if [ -t 1 ]; then BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; CYAN=$'\033[36m'; RESET=$'\033[0m'
else BOLD=""; DIM=""; RED=""; GREEN=""; CYAN=""; RESET=""; fi
c()   { printf '%s▸ %s%s\n'   "$CYAN" "$*" "$RESET"; }
err() { printf '%s  ✗ %s%s\n' "$RED"  "$*" "$RESET" >&2; }

help() {
  printf '%b\n' "
${BOLD}pool-smoke${RESET} ${DIM}— end-to-end smoke of the item-pool AMM on the local world${RESET}

${BOLD}USAGE${RESET}
  ${CYAN}scripts/ops/pool-smoke.sh${RESET}

${BOLD}OPTIONS${RESET}
  ${GREEN}-h, --help${RESET}  ${DIM}show this help${RESET}

${BOLD}WHAT IT DOES${RESET}
  ${DIM}Sources RPC/WORLD/PRIV_KEY from packages/contracts/.env.local and runs
  deployment/contracts/PoolSmoke.s.sol: create/reuse a MUSU-Stone pool as the
  admin, register a test account, swap with slippage bounds, add and remove
  liquidity, and assert the k-invariant. Player keys default to anvil #1/#2
  (override with SMOKE_OWNER_KEY / SMOKE_OPERATOR_KEY).${RESET}
"
}
case "${1:-}" in -h|--help) help; exit 0 ;; esac

[ -f "$CONTRACTS/.env.local" ] || { err "missing $CONTRACTS/.env.local"; exit 1; }
# shellcheck disable=SC1091
. "$CONTRACTS/.env.local"
[ -n "${RPC:-}" ] && [ -n "${WORLD:-}" ] && [ -n "${PRIV_KEY:-}" ] \
  || { err ".env.local must define RPC, WORLD and PRIV_KEY"; exit 1; }

c "pool smoke · world $WORLD"
( cd "$CONTRACTS" && FOUNDRY_OFFLINE=true forge script \
    deployment/contracts/PoolSmoke.s.sol:PoolSmoke --broadcast --fork-url "$RPC" \
    --priority-gas-price=0 --with-gas-price=0 --skip test \
    --sig 'run(uint256,uint256,uint256,address)' \
    "$PRIV_KEY" "$OWNER_KEY" "$OPERATOR_KEY" "$WORLD" ) 2>&1 \
  | grep -E 'pool created|account registered|swap out|final reserves|player shares|SMOKE|Error|revert' \
  | sed -e "s/SMOKE PASSED/${GREEN}SMOKE PASSED${RESET}/" -e "s/SMOKE FAIL/${RED}SMOKE FAIL${RESET}/"
