#!/usr/bin/env bash
# stack.sh — one-command local Kamigotchi stack: anvil → world deploy → client.
#
# USAGE
#   scripts/services/stack.sh start [--redeploy]   bring up anvil + world + client
#   scripts/services/stack.sh stop                 stop everything this script started
#   scripts/services/stack.sh status               health-check each resource
#   scripts/services/stack.sh smoke                run the pool AMM smoke test on the live world
#   scripts/services/stack.sh logs [service]       tail logs (anvil|deploy|client, default all)
#
# Also runnable as `pnpm --filter services <start|stop|status|smoke|logs>`.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

start_anvil() {
  if anvil_up; then
    ok "anvil already up at $RPC (block $(cast block-number --rpc-url "$RPC"))"
    return
  fi
  c "starting anvil"
  # same flags as contracts' node:local
  anvil --chain-id 1337 -b 1 --base-fee 0 --gas-price 0 \
    --gas-limit 10000000000 --timestamp 1708214400 \
    > "$LOGS/anvil.log" 2>&1 &
  save_pid anvil $!
  for _ in $(seq 1 30); do anvil_up && break; sleep 1; done
  anvil_up || { err "anvil did not come up — see $LOGS/anvil.log"; exit 1; }
  ok "anvil up at $RPC"
}

deploy_world() {
  local redeploy="${1:-}"
  if world_up && [ "$redeploy" != "--redeploy" ]; then
    ok "world already deployed at $(world_addr) (use --redeploy to force)"
    return
  fi
  c "deploying world (this takes a few minutes on a fresh chain)"
  # FOUNDRY_OFFLINE is set inside deploy:local — keeps forge from hanging on
  # network-based trace identification
  ( cd "$CONTRACTS" && pnpm deploy:local ) > "$LOGS/deploy.log" 2>&1 \
    || { err "deploy failed — tail of $LOGS/deploy.log:"; tail -20 "$LOGS/deploy.log" >&2; exit 1; }
  world_up || { err "deploy finished but no code at $(world_addr)"; exit 1; }
  ok "world deployed at $(world_addr)"
}

start_client() {
  if client_up; then
    ok "client already up at $CLIENT_URL"
    return
  fi
  c "starting client (vite, puter mode)"
  ( cd "$CLIENT" && pnpm dev:puter ) > "$LOGS/client.log" 2>&1 &
  save_pid client $!
  for _ in $(seq 1 60); do client_up && break; sleep 1; done
  client_up || { err "client did not come up — see $LOGS/client.log"; exit 1; }
  ok "client up at $CLIENT_URL"
}

cmd_start() {
  start_anvil
  deploy_world "${1:-}"
  start_client
  local block; block="$(grep -oE 'Start block: [0-9]+' "$LOGS/deploy.log" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo 0)"
  echo
  c "stack is up:"
  echo "  ${BOLD}$CLIENT_URL/?worldAddress=$(world_addr)&initialBlockNumber=$block${RESET}"
}

cmd_stop() {
  stop_pid client || warn "no client pid recorded"
  stop_pid anvil || warn "no anvil pid recorded"
  # vite children sometimes survive their pnpm parent
  pkill -f 'vite --force --port 3000 --mode puter' 2>/dev/null || true
}

cmd_status() {
  if anvil_up; then ok "anvil: up (block $(cast block-number --rpc-url "$RPC"))"; else err "anvil: down"; fi
  if world_up; then ok "world: deployed at $(world_addr)"; else err "world: no code at $(world_addr)"; fi
  if client_up; then ok "client: up at $CLIENT_URL"; else err "client: down"; fi
}

cmd_smoke() {
  anvil_up || { err "anvil is down — run start first"; exit 1; }
  world_up || { err "no world deployed — run start first"; exit 1; }
  c "running pool AMM smoke test"
  ( cd "$CONTRACTS" && pnpm smoke:pool ) 2>&1 | grep -E 'pool created|account registered|swap out|final reserves|player shares|SMOKE|[Ee]rror|[Rr]evert' || true
}

cmd_logs() {
  local svc="${1:-}"
  if [ -n "$svc" ]; then tail -f "$LOGS/$svc.log"; else tail -f "$LOGS"/*.log; fi
}

case "${1:-}" in
  start)  cmd_start "${2:-}" ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  smoke)  cmd_smoke ;;
  logs)   cmd_logs "${2:-}" ;;
  *) sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
