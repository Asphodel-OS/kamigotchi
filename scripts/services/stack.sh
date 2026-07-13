#!/usr/bin/env bash
# stack.sh — one-command local Kamigotchi stack: anvil → world deploy → client,
# with anvil state snapshots and an optional kamigaze indexer.
#
# USAGE
#   scripts/services/stack.sh start [--redeploy]     bring up anvil + world + client
#                                                    (restores the state snapshot when one exists;
#                                                     --redeploy forces a fresh chain + deploy)
#   scripts/services/stack.sh stop                   stop everything this script started
#   scripts/services/stack.sh status                 health-check each resource
#   scripts/services/stack.sh smoke                  run the pool AMM smoke test on the live world
#   scripts/services/stack.sh snapshot <save|clear|status>
#                                                    manage the anvil state snapshot
#   scripts/services/stack.sh indexer <up|down|status|logs>
#                                                    kamigaze indexer + its Postgres (needs Docker
#                                                    and the sibling ../kamigaze repo)
#   scripts/services/stack.sh logs [service]         tail logs (anvil|deploy|client|indexer)
#
# Also runnable as `pnpm --filter services <start|stop|status|smoke|logs|...>`.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

##################
# ANVIL

start_anvil() {
  local load="${1:-}" # optional --load-state file
  if anvil_up; then
    ok "anvil already up at $RPC (block $(cast block-number --rpc-url "$RPC"))"
    return
  fi
  c "starting anvil${load:+ (restoring snapshot)}"
  # same flags as contracts' node:local. the fixed genesis timestamp applies
  # only to fresh chains — a restored chain must keep its own (later) clock or
  # time-dependent contracts (TWAP oracles, cooldowns) underflow
  local args=(--chain-id 1337 -b 1 --base-fee 0 --gas-price 0 --gas-limit 10000000000)
  if [ -n "$load" ]; then args+=(--load-state "$load"); else args+=(--timestamp 1708214400); fi
  anvil "${args[@]}" > "$LOGS/anvil.log" 2>&1 &
  save_pid anvil $!
  for _ in $(seq 1 60); do anvil_up && break; sleep 1; done
  anvil_up || { err "anvil did not come up — see $LOGS/anvil.log"; exit 1; }
  ok "anvil up at $RPC"
}

##################
# SNAPSHOT

snapshot_save() {
  anvil_up || { err "anvil is down — nothing to snapshot"; exit 1; }
  world_up || { err "no world deployed — refusing to snapshot an empty chain"; exit 1; }
  c "saving anvil state snapshot"
  local block; block="$(cast block-number --rpc-url "$RPC")"
  # anvil_dumpState returns hex-encoded gzip JSON; --load-state wants the JSON,
  # so decode now and keep it gzipped on disk
  cast rpc anvil_dumpState --rpc-url "$RPC" | tr -d '"' | sed 's/^0x//' \
    | xxd -r -p | gunzip | gzip > "$SNAP"
  echo "world=$(world_addr) block=$block saved=$(date '+%Y-%m-%d %H:%M:%S')" > "$SNAP_META"
  ok "snapshot saved: $(du -h "$SNAP" | cut -f1) at block $block"
}

snapshot_clear() { rm -f "$SNAP" "$SNAP_META"; ok "snapshot cleared"; }

snapshot_status() {
  if [ -f "$SNAP" ]; then
    ok "snapshot: $(du -h "$SNAP" | cut -f1), $(cat "$SNAP_META")"
  else
    warn "no snapshot saved (run: stack.sh snapshot save)"
  fi
}

# restore path used by cmd_start: gunzip to a temp file and boot anvil from it
snapshot_restore() {
  local tmp="$STATE/anvil-state.restore.json"
  gunzip -c "$SNAP" > "$tmp"
  start_anvil "$tmp"
  rm -f "$tmp"
  world_up || { err "snapshot loaded but no world code — clearing it; rerun start"; snapshot_clear; exit 1; }
  ok "world restored from snapshot ($(cat "$SNAP_META"))"
}

##################
# WORLD + CLIENT

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
  snapshot_save
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

##################
# INDEXER (kamigaze)

indexer_pid_alive() { [ -f "$PIDS/indexer.pid" ] && kill -0 "$(cat "$PIDS/indexer.pid")" 2>/dev/null; }

indexer_up() {
  [ -d "$KAMIGAZE" ] || { err "kamigaze repo not found at $KAMIGAZE"; exit 1; }
  docker_up || { err "Docker is not running — kamigaze needs it for Postgres"; exit 1; }
  anvil_up && world_up || { err "anvil/world not up — run start first"; exit 1; }

  # 1. postgres
  if kamigaze_db_up; then
    ok "kamigaze_db already running"
  else
    c "starting kamigaze Postgres"
    ( cd "$KAMIGAZE" && make start-db ) > "$LOGS/indexer.log" 2>&1
    for _ in $(seq 1 30); do
      docker exec kamigaze_db pg_isready -q 2>/dev/null && break; sleep 1
    done
    docker exec kamigaze_db pg_isready -q 2>/dev/null \
      || { err "kamigaze_db not ready — see $LOGS/indexer.log"; exit 1; }
    ok "kamigaze_db up"
  fi

  # 2. schema (one-time; marker cleared via `indexer down --nuke-schema` by hand)
  if [ ! -f "$STATE/kamigaze-schema.done" ]; then
    c "deploying kamigaze db schema (one-time)"
    (
      cd "$KAMIGAZE"
      if [ ! -d sql/deployment/venv ]; then
        python3 -m venv sql/deployment/venv
        ./sql/deployment/venv/bin/pip install -q -r sql/deployment/requirements.txt
      fi
      # shellcheck disable=SC1091
      source sql/deployment/venv/bin/activate && python3 sql/deployment/deploy.py local dev 127.0.0.1
    ) >> "$LOGS/indexer.log" 2>&1 \
      && { touch "$STATE/kamigaze-schema.done"; ok "schema deployed"; } \
      || { err "schema deploy failed — see $LOGS/indexer.log (README one-time steps may be needed)"; exit 1; }
  fi

  # 3. the indexer itself. exported vars beat .env.local (godotenv doesn't
  # override), so point it at the local chain + host-visible db without
  # touching kamigaze's config
  if indexer_pid_alive; then
    ok "indexer already running (pid $(cat "$PIDS/indexer.pid"))"
    return
  fi
  c "starting kamigaze indexer against $(world_addr)"
  local block; block="$(meta_get block || echo 0)"
  (
    cd "$KAMIGAZE" \
      && DB_HOST=127.0.0.1 RPC_WS_PROVIDER="ws://127.0.0.1:8545" \
         go run ./cmd/indexer/main.go -mode local \
           -world-addresses "$(world_addr)" -starting-block "${block:-0}"
  ) >> "$LOGS/indexer.log" 2>&1 &
  save_pid indexer $!
  sleep 3
  indexer_pid_alive || { err "indexer exited — tail of $LOGS/indexer.log:"; tail -10 "$LOGS/indexer.log" >&2; exit 1; }
  ok "indexer up (pid $(cat "$PIDS/indexer.pid"), log $LOGS/indexer.log)"
}

indexer_down() {
  stop_pid indexer || warn "no indexer pid recorded"
  pkill -f 'cmd/indexer/main.go -mode local' 2>/dev/null || true
  if kamigaze_db_up; then
    ( cd "$KAMIGAZE" && make stop-db ) >/dev/null 2>&1 && ok "kamigaze_db stopped"
  fi
}

indexer_status() {
  if kamigaze_db_up; then ok "kamigaze_db: up"; else err "kamigaze_db: down"; fi
  if indexer_pid_alive; then ok "indexer: up (pid $(cat "$PIDS/indexer.pid"))"; else err "indexer: down"; fi
}

##################
# COMMANDS

cmd_start() {
  local redeploy="${1:-}"
  if ! anvil_up && [ -f "$SNAP" ] && [ "$redeploy" != "--redeploy" ]; then
    snapshot_restore
  else
    start_anvil
    deploy_world "$redeploy"
  fi
  start_client
  local block; block="$(meta_get block || echo 0)"
  echo
  c "stack is up:"
  echo "  ${BOLD}$CLIENT_URL/?worldAddress=$(world_addr)&initialBlockNumber=${block:-0}${RESET}"
}

cmd_stop() {
  stop_pid client || warn "no client pid recorded"
  pkill -f 'vite --force --port 3000 --mode puter' 2>/dev/null || true
  indexer_down
  stop_pid anvil || warn "no anvil pid recorded"
}

cmd_status() {
  if anvil_up; then ok "anvil: up (block $(cast block-number --rpc-url "$RPC"))"; else err "anvil: down"; fi
  if world_up; then ok "world: deployed at $(world_addr)"; else err "world: no code at $(world_addr)"; fi
  if client_up; then ok "client: up at $CLIENT_URL"; else err "client: down"; fi
  snapshot_status
  [ -d "$KAMIGAZE" ] && indexer_status
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
  start)    cmd_start "${2:-}" ;;
  stop)     cmd_stop ;;
  status)   cmd_status ;;
  smoke)    cmd_smoke ;;
  snapshot) case "${2:-}" in
              save) snapshot_save ;; clear) snapshot_clear ;; *) snapshot_status ;;
            esac ;;
  indexer)  case "${2:-}" in
              up) indexer_up ;; down) indexer_down ;; logs) cmd_logs indexer ;; *) indexer_status ;;
            esac ;;
  logs)     cmd_logs "${2:-}" ;;
  *) sed -n '2,19p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
