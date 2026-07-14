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
#   scripts/services/stack.sh kamigaze <up|down|status>
#                                                    all three kamigaze services + Postgres (needs
#                                                    Docker and the sibling ../kamigaze repo)
#   scripts/services/stack.sh kamigaze <indexer|snapshot|streamer> <up|down|logs>
#                                                    one kamigaze service ("indexer" alone still
#                                                    works as an alias for the ingestion service)
#   scripts/services/stack.sh fund <address> [eth]   set an address's local ETH balance (default 10)
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
  # `start` = the world's deploy start block — where clients and indexers must
  # begin their event sync (the snapshot block would skip the init events,
  # which DO survive restore). falls back to any previously recorded value
  local start
  start="$(grep -oE 'Start block: [0-9]+' "$LOGS/deploy.log" 2>/dev/null | tail -1 | grep -oE '[0-9]+')" \
    || start="$(meta_get start || echo 0)"
  echo "world=$(world_addr) start=${start:-0} block=$block saved=$(date '+%Y-%m-%d %H:%M:%S')" > "$SNAP_META"
  ok "snapshot saved: $(du -h "$SNAP" | cut -f1) at block $block (sync from ${start:-0})"
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
  # the deploy is deterministic on a fresh chain — verify it actually landed
  # at the address .env.local (and everything downstream) expects
  local deployed
  deployed="$(grep -oiE 'Deployed world at: 0x[0-9a-f]+' "$LOGS/deploy.log" | tail -1 | grep -oiE '0x[0-9a-f]+')"
  if [ -n "$deployed" ] && [ "$(echo "$deployed" | tr 'A-F' 'a-f')" != "$(world_addr | tr 'A-F' 'a-f')" ]; then
    err "deployed world $deployed != WORLD in contracts/.env.local ($(world_addr))"
    err "chain was not fresh, or the deploy changed — update .env.local or rerun with --redeploy"
    exit 1
  fi
  world_up || { err "deploy finished but no code at $(world_addr)"; exit 1; }
  ok "world deployed at $(world_addr)"
  snapshot_save
}

start_client() {
  if client_up; then
    ok "client already up at $CLIENT_URL"
    return
  fi
  c "starting client (vite, local mode)"
  ( cd "$CLIENT" && pnpm dev:local ) > "$LOGS/client.log" 2>&1 &
  save_pid client $!
  for _ in $(seq 1 60); do client_up && break; sleep 1; done
  client_up || { err "client did not come up — see $LOGS/client.log"; exit 1; }
  ok "client up at $CLIENT_URL"
}

##################
# KAMIGAZE (the indexer — one repo, three services)
#   indexer:  chain → Postgres ingestion
#   snapshot: serves client bootstrap state from Postgres (grpc :50051, grpc-web :8080)
#   streamer: serves live event stream (grpc :50061, grpc-web :50062)

KAMIGAZE_SVCS=(indexer snapshot streamer)
SNAPSHOT_HTTP_PORT=8080 # cmd/snapshot defaults its http port to :80 (privileged)
STREAMER_GRPC_PORT=50061 # its grpc-web port is grpc+1 (50062)

svc_pid_alive() { [ -f "$PIDS/kamigaze-$1.pid" ] && kill -0 "$(cat "$PIDS/kamigaze-$1.pid")" 2>/dev/null; }

# start the Docker daemon if it isn't running (macOS: Docker Desktop)
ensure_docker() {
  docker_up && return
  if [ "$(uname)" = "Darwin" ] && [ -d /Applications/Docker.app ]; then
    c "starting Docker Desktop"
    open -a Docker
    for _ in $(seq 1 90); do docker_up && { ok "Docker up"; return; }; sleep 2; done
  fi
  err "Docker is not running (and could not be started) — kamigaze needs it for Postgres"
  exit 1
}

# postgres + one-time schema — shared prerequisite for all three services
kamigaze_db_ensure() {
  [ -d "$KAMIGAZE" ] || { err "kamigaze repo not found at $KAMIGAZE"; exit 1; }
  ensure_docker

  if kamigaze_db_up; then
    ok "kamigaze_db already running"
  else
    c "starting kamigaze Postgres"
    ( cd "$KAMIGAZE" && make start-db ) > "$LOGS/kamigaze-db.log" 2>&1
    # require a real query, not just pg_isready — on a fresh data dir postgres
    # initdb's then restarts, and pg_isready passes during the transient window
    for _ in $(seq 1 30); do
      docker exec kamigaze_db psql -U kami -d dev -qc 'select 1' >/dev/null 2>&1 && break; sleep 1
    done
    docker exec kamigaze_db psql -U kami -d dev -qc 'select 1' >/dev/null 2>&1 \
      || { err "kamigaze_db not ready — see $LOGS/kamigaze-db.log"; exit 1; }
    ok "kamigaze_db up"
  fi

  # one-time schema deploy (marker-gated; rm the marker to force a rerun)
  if [ ! -f "$STATE/kamigaze-schema.done" ]; then
    c "deploying kamigaze db schema (one-time)"
    (
      cd "$KAMIGAZE"
      # venvs hardcode their creation path — recreate if missing OR broken
      # (e.g. stale shebangs after the repo moved). probe pip, not python3:
      # the python3 symlink survives a move but script shebangs don't.
      # pin to an older interpreter when available — psycopg2-binary has no
      # wheels yet for bleeding-edge pythons (e.g. 3.14)
      local py=python3
      for v in 3.12 3.11 3.10; do command -v "python$v" >/dev/null && { py="python$v"; break; }; done
      ./sql/deployment/venv/bin/pip --version >/dev/null 2>&1 \
        || { rm -rf sql/deployment/venv; "$py" -m venv sql/deployment/venv; }
      ./sql/deployment/venv/bin/pip install -q -r sql/deployment/requirements.txt
      # shellcheck disable=SC1091
      # deploy.py confirms interactively; finite printf (not `yes`) since
      # pipefail would turn yes's SIGPIPE into a failure
      source sql/deployment/venv/bin/activate \
        && printf 'y\ny\ny\n' | python3 sql/deployment/deploy.py local dev 127.0.0.1
    ) >> "$LOGS/kamigaze-db.log" 2>&1 \
      && { touch "$STATE/kamigaze-schema.done"; ok "schema deployed"; } \
      || { err "schema deploy failed — see $LOGS/kamigaze-db.log (README one-time steps may be needed)"; exit 1; }
  fi
}

# compose a db connection string aimed at the host-visible postgres, with
# credentials sourced from kamigaze's own .env.local. exported CONN_STRs beat
# the file's (which point at the docker-network hostname and may predate the
# .dist template — e.g. missing DB_RO_CONN_STR entirely)
kamigaze_conn_str() {
  ( . "$KAMIGAZE/.env.local" 2>/dev/null; \
    printf 'host=127.0.0.1 port=%s user=%s password=%s dbname=%s sslmode=disable connect_timeout=10' \
      "${DB_PORT:-5432}" "${DB_USER:-kami}" "${DB_PWD:-}" "${DB_NAME:-dev}" )
}

# run one kamigaze service on the host. exported vars beat .env.local
# (godotenv doesn't override), so we point each at the local chain and the
# host-visible db without touching kamigaze's config
kamigaze_svc_up() {
  local svc="$1"
  kamigaze_db_ensure
  if svc_pid_alive "$svc"; then
    ok "kamigaze $svc already running (pid $(cat "$PIDS/kamigaze-$svc.pid"))"
    return
  fi

  local start emitter=""
  start="$(meta_get start || echo 0)"
  anvil_up && emitter="$(cast call "$(world_addr)" '_emitter()(address)' --rpc-url "$RPC" 2>/dev/null || true)"

  local cmdargs=()
  case "$svc" in
    indexer)
      anvil_up && world_up || { err "anvil/world not up — run start first"; exit 1; }
      # INDEXER_OVERRIDE=true forces reprocessing from the start block,
      # ignoring the db's last-seen block (one-shot repair)
      cmdargs=(./cmd/indexer/main.go -mode local
        -world-addresses "$(world_addr)" -emitter-addresses "$emitter"
        -starting-block "${start:-0}" -override-db-block "${INDEXER_OVERRIDE:-false}") ;;
    snapshot)
      cmdargs=(./cmd/snapshot/main.go -mode local -port 50051 -http-port "$SNAPSHOT_HTTP_PORT") ;;
    streamer)
      anvil_up || { err "anvil not up — run start first"; exit 1; }
      cmdargs=(./cmd/streamer/main.go -mode local -port "$STREAMER_GRPC_PORT" -world-addresses "$(world_addr)") ;;
    *) err "unknown kamigaze service: $svc"; exit 1 ;;
  esac

  c "starting kamigaze $svc"
  local log="$LOGS/kamigaze-$svc.log"
  local logmark; logmark="$(wc -l < "$log" 2>/dev/null || echo 0)"
  local conn; conn="$(kamigaze_conn_str)"
  (
    cd "$KAMIGAZE" \
      && DB_HOST=127.0.0.1 DB_RO_HOST=127.0.0.1 \
         DB_CONN_STR="$conn" DB_RO_CONN_STR="$conn" \
         EMITTER_ADDRESS="$emitter" \
         RPC_HTTP_PROVIDER="http://127.0.0.1:8545" RPC_WS_PROVIDER="ws://127.0.0.1:8545" \
         go run "${cmdargs[@]}"
  ) >> "$log" 2>&1 &
  save_pid "kamigaze-$svc" $!
  # `go run` compiles first, so wait for the app to actually boot before judging
  for _ in $(seq 1 45); do
    svc_pid_alive "$svc" || break
    tail -n +"$((logmark + 1))" "$log" 2>/dev/null | grep -qiE 'configuration loaded|listening|server' && break
    sleep 2
  done
  sleep 3
  svc_pid_alive "$svc" || { err "kamigaze $svc exited — tail of $log:"; tail -10 "$log" >&2; exit 1; }
  ok "kamigaze $svc up (pid $(cat "$PIDS/kamigaze-$svc.pid"), log $log)"
}

kamigaze_svc_down() {
  local svc="$1"
  stop_pid "kamigaze-$svc" || true
  stop_pid "$svc" || true # legacy pid name from before the split
  pkill -f "cmd/$svc/main.go -mode local" 2>/dev/null || true
}

kamigaze_up() { local s; for s in "${KAMIGAZE_SVCS[@]}"; do kamigaze_svc_up "$s"; done; }

kamigaze_down() {
  local s; for s in "${KAMIGAZE_SVCS[@]}"; do kamigaze_svc_down "$s"; done
  if kamigaze_db_up; then
    # not `make stop-db` — kamigaze's target runs `docker compose down db`,
    # which modern compose rejects (services arg unsupported for `down`)
    docker stop kamigaze_db >/dev/null 2>&1 && ok "kamigaze_db stopped" \
      || warn "could not stop kamigaze_db"
  fi
}

kamigaze_status() {
  if kamigaze_db_up; then ok "kamigaze_db: up"; else err "kamigaze_db: down"; fi
  local s
  for s in "${KAMIGAZE_SVCS[@]}"; do
    if svc_pid_alive "$s"; then ok "kamigaze $s: up (pid $(cat "$PIDS/kamigaze-$s.pid"))"
    else err "kamigaze $s: down"; fi
  done
}

##################
# COMMANDS

cmd_start() {
  local redeploy="${1:-}"
  if [ "$redeploy" = "--redeploy" ] && anvil_up; then
    c "redeploy requested — recycling the running chain"
    kill_anvil
    sleep 1
  fi
  if ! anvil_up && [ -f "$SNAP" ] && [ "$redeploy" != "--redeploy" ]; then
    snapshot_restore
  else
    start_anvil
    deploy_world "$redeploy"
  fi
  start_client
  # the client boots via kamigaze's snapshot service when its env points there;
  # warn if it's configured but the services aren't running
  if grep -q 'VITE_KAMIGAZE_URL' "$CLIENT/.env.local" 2>/dev/null && ! svc_pid_alive snapshot; then
    warn "client .env.local points at kamigaze but it isn't running — run: stack.sh kamigaze up"
  fi
  local start; start="$(meta_get start || echo 0)"
  echo
  c "stack is up:"
  echo "  ${BOLD}$CLIENT_URL/?worldAddress=$(world_addr)&initialBlockNumber=${start:-0}${RESET}"
}

cmd_stop() {
  stop_pid client || warn "no client pid recorded"
  # the recorded pid is the pnpm wrapper; kill the vite listener by port
  local vitepid; vitepid="$(lsof -nP -iTCP:3000 -sTCP:LISTEN -t 2>/dev/null | head -1 || true)"
  if [ -n "$vitepid" ]; then kill "$vitepid" 2>/dev/null || true; fi
  kamigaze_down
  stop_pid anvil || warn "no anvil pid recorded"
  kill_anvil
}

# recorded pids go stale across script invocations — the port is the truth
kill_anvil() {
  local pid; pid="$(lsof -nP -iTCP:8545 -sTCP:LISTEN -t 2>/dev/null | head -1 || true)"
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null && ok "stopped anvil (pid $pid)" || warn "could not stop anvil (pid $pid)"
  fi
  rm -f "$PIDS/anvil.pid"
}

cmd_status() {
  if anvil_up; then ok "anvil: up (block $(cast block-number --rpc-url "$RPC"))"; else err "anvil: down"; fi
  if world_up; then ok "world: deployed at $(world_addr)"; else err "world: no code at $(world_addr)"; fi
  if client_up; then ok "client: up at $CLIENT_URL"; else err "client: down"; fi
  snapshot_status
  [ -d "$KAMIGAZE" ] && kamigaze_status
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

# fund an address with local ETH (anvil_setBalance: instant, no sender needed)
cmd_fund() {
  local addr="${1:-}" eth="${2:-10}"
  [ -n "$addr" ] || { err "usage: stack.sh fund <address> [eth-amount, default 10]"; exit 1; }
  anvil_up || { err "anvil is down — run start first"; exit 1; }
  local wei; wei="$(cast to-wei "$eth" eth)"
  cast rpc anvil_setBalance "$addr" "$(cast to-hex "$wei")" --rpc-url "$RPC" >/dev/null
  ok "$addr balance set to $(cast from-wei "$(cast balance "$addr" --rpc-url "$RPC")") ETH"
}

case "${1:-}" in
  start)    cmd_start "${2:-}" ;;
  stop)     cmd_stop ;;
  status)   cmd_status ;;
  smoke)    cmd_smoke ;;
  snapshot) case "${2:-}" in
              save) snapshot_save ;; clear) snapshot_clear ;; *) snapshot_status ;;
            esac ;;
  kamigaze) case "${2:-}" in
              up) kamigaze_up ;; down) kamigaze_down ;;
              indexer|snapshot|streamer)
                case "${3:-}" in
                  up) kamigaze_svc_up "$2" ;; down) kamigaze_svc_down "$2" ;;
                  logs) cmd_logs "kamigaze-$2" ;; *) kamigaze_status ;;
                esac ;;
              *) kamigaze_status ;;
            esac ;;
  # legacy alias for the ingestion service
  indexer)  case "${2:-}" in
              up) kamigaze_svc_up indexer ;; down) kamigaze_svc_down indexer ;;
              logs) cmd_logs kamigaze-indexer ;; *) kamigaze_status ;;
            esac ;;
  fund)     cmd_fund "${2:-}" "${3:-}" ;;
  logs)     cmd_logs "${2:-}" ;;
  *) sed -n '2,23p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
