#!/usr/bin/env bash
# vault-audit.sh — audit KamiMarketVault authorizedCallers on a Kamigotchi world.
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

help() {
  printf '%b\n' "
${BOLD}vault-audit${RESET} ${DIM}— audit KamiMarketVault authorizedCallers on a Kamigotchi world${RESET}

${BOLD}USAGE${RESET}
  ${CYAN}scripts/ops/vault-audit.sh [local|test|prod] [-- <vaultAudit.ts flags>]${RESET}   ${DIM}default: local${RESET}

${BOLD}OPTIONS${RESET} ${DIM}(flags after -- pass through to vaultAudit.ts)${RESET}
  ${GREEN}-h, --help${RESET}       ${DIM}show this help${RESET}
  ${GREEN}--calls${RESET}          ${DIM}replay the grant ledger (needs RPC_ARCHIVE) — most complete${RESET}
  ${GREEN}--archive${RESET}        ${DIM}scan registry system history (needs RPC_ARCHIVE) — systems only${RESET}
  ${GREEN}--deployers <csv>${RESET} ${DIM}crawl mode: extra deployer EOAs to nonce-crawl${RESET}
  ${GREEN}--from-block / --to-block${RESET} ${DIM}calls mode: bound the scanned range${RESET}
  ${GREEN}--revoke-stale${RESET}   ${DIM}unauthorizeCaller each stale grant (needs owner PRIV_KEY)${RESET}
  ${GREEN}--vault <addr>${RESET}   ${DIM}override the world-config vault address${RESET}

${BOLD}WHAT IT DOES${RESET}
  ${DIM}The vault has no authorize events and the default yominet RPC prunes logs,
  so authorizedCallers can't be enumerated from its own history. This audit
  (1) verifies the live market + newbie-vendor systems (and only them) hold
  grants, and (2) surfaces stale grants. Three ways to find them, most to least
  complete:
    --calls    replay every authorizeCaller/unauthorizeCaller ever sent to the
               vault (from ownership history + each owner's txs). Catches grants
               to ANY address — EOAs, multisigs, non-system contracts.
    --archive  enumerate every system ever written to the registry. Systems only.
    (default)  sweep the deploy keys' CREATE-address ranges. No archive node
               needed, but blind to addresses the audited keys never deployed.
  Read-only unless --revoke-stale is passed.${RESET}
"
}

case "${1:-local}" in
  -h|--help)       help; exit 0 ;;
  local)           NODE_ENV="local" ;;
  test|testing)    NODE_ENV="testing" ;;
  prod|production) NODE_ENV="production" ;;
  *) err "unknown env: ${1} (expected local|test|prod)"; exit 1 ;;
esac
shift $(( $# > 0 ? 1 : 0 ))
[ "${1:-}" = "--" ] && shift

[ -f "$CONTRACTS/.env.$NODE_ENV" ] || { err "missing $CONTRACTS/.env.$NODE_ENV"; exit 1; }

c "vault audit · .env.$NODE_ENV"
( cd "$CONTRACTS" && NODE_ENV="$NODE_ENV" pnpm exec ts-node deployment/commands/vaultAudit.ts "$@" ) \
  | sed -e "s/\(STALE GRANT\|MISMATCH\|FAIL\)/${RED}\1${RESET}/" \
        -e "s/^CLEAN/${GREEN}CLEAN${RESET}/" \
        -e "s/^\(  ok  \)/${GREEN}\1${RESET}/"
