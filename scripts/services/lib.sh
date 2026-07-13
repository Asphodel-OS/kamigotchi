#!/usr/bin/env bash
# lib.sh — shared paths, config, and helpers for the local dev scripts.
#
# SOURCE this (do not execute). Mirrors game2/scripts/services/lib.sh: every
# path resolves relative to this file's location so the scripts work
# regardless of the caller's cwd.

DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$(cd "$DEV_DIR/.." && pwd)"
KAMIGOTCHI="$(cd "$SCRIPTS_DIR/.." && pwd)"
CONTRACTS="$KAMIGOTCHI/packages/contracts"
CLIENT="$KAMIGOTCHI/packages/client"
STATE="$KAMIGOTCHI/.local-stack"
LOGS="$STATE/logs"
PIDS="$STATE/pids"
mkdir -p "$LOGS" "$PIDS"

RPC="${RPC:-http://127.0.0.1:8545}"
CLIENT_URL="http://localhost:3000"

# anvil default keys: #0 deployer/admin (matches contracts/.env.puter),
# #1/#2 smoke-test player owner/operator
ANVIL0=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ANVIL1=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
ANVIL2=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

# color vars, gated on a tty; empty when piped
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; CYAN=$'\033[36m'; RESET=$'\033[0m'
else
  BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; CYAN=""; RESET=""
fi
c()   { printf '%s▸ %s%s\n'   "$CYAN"  "$*" "$RESET"; }
ok()  { printf '%s  ✓ %s%s\n' "$GREEN" "$*" "$RESET"; }
warn(){ printf '%s  ~ %s%s\n' "$YELLOW" "$*" "$RESET"; }
err() { printf '%s  ✗ %s%s\n' "$RED"   "$*" "$RESET" >&2; }

world_addr() { (. "$CONTRACTS/.env.puter" && printf '%s' "$WORLD"); }
anvil_up()   { cast block-number --rpc-url "$RPC" >/dev/null 2>&1; }
client_up()  { curl -sf -o /dev/null "$CLIENT_URL" 2>/dev/null; }
world_up()   { [ "$(cast code "$(world_addr)" --rpc-url "$RPC" 2>/dev/null)" != "0x" ]; }

# record/reap background service pids ($1 = service name)
save_pid()  { echo "$2" > "$PIDS/$1.pid"; }
stop_pid()  {
  local f="$PIDS/$1.pid"
  [ -f "$f" ] || return 1
  local pid; pid="$(cat "$f")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    ok "stopped $1 (pid $pid)"
  fi
  rm -f "$f"
}
