# `scripts/services/` — local Kamigotchi stack

One-command bring-up of the local dev stack, mirroring
`game2/scripts/services`. Run via `pnpm --filter services <script>` from the
repo root, or invoke `stack.sh` directly.

| Command | What it does |
| --- | --- |
| `pnpm --filter services start` | Bring up the stack: anvil → world → client. Restores the anvil state snapshot when one exists (~2s instead of a ~5min deploy); otherwise deploys fresh and auto-saves a snapshot. Reuses anything already running. |
| `pnpm --filter services start:fresh` | Force a fresh chain + redeploy (ignores the snapshot, saves a new one after). |
| `pnpm --filter services status` | Health-check anvil / world / client / snapshot / kamigaze. |
| `pnpm --filter services smoke` | Run the pool AMM smoke test (`deployment/contracts/PoolSmoke.s.sol`) against the live world. |
| `pnpm --filter services snapshot` / `snapshot:clear` | Save / delete the anvil state snapshot manually. |
| `pnpm --filter services indexer` / `indexer:down` | Start / stop the kamigaze indexer + its Postgres (needs Docker + the sibling `../kamigaze` repo). |
| `pnpm --filter services stop` | Stop everything this script started (client, indexer, db, anvil). |
| `pnpm --filter services logs [svc]` | Tail logs (`anvil` \| `deploy` \| `client` \| `indexer`). |

## Dependency graph

```
anvil (:8545)
 ├─ deploy world (pnpm -F contracts deploy:local, FOUNDRY_OFFLINE=true)
 │   ├─ snapshot (.local-stack/anvil-state.json.gz — auto-saved post-deploy)
 │   └─ client (vite :3000, puter mode)
 │       → http://localhost:3000/?worldAddress=<world>&initialBlockNumber=<block>
 └─ kamigaze indexer (go, sibling repo)              [optional]
     └─ kamigaze_db (Docker Postgres :5432)
```

State, logs, pids, and the snapshot live in `.local-stack/` at the repo root
(gitignored).

## Snapshots

A fresh world deploy costs ~5 minutes; the snapshot restore costs ~2 seconds.
`start` auto-saves a snapshot right after every fresh deploy and restores it on
subsequent `start`s when anvil is down. `snapshot save` lets you checkpoint any
later state (e.g. after seeding pools or test accounts).

The restore boots anvil **without** the fixed `--timestamp` — a restored chain
must keep its own clock or time-dependent contracts (TWAP oracles, cooldowns)
underflow.

## kamigaze indexer

`indexer up` handles the one-time setup from kamigaze's README automatically:
starts the Postgres container (`make start-db`), creates the python venv and
deploys the schema on first run (marker: `.local-stack/kamigaze-schema.done`),
then runs `go run ./cmd/indexer -mode local` pointed at the local chain.
Exported env (`DB_HOST=127.0.0.1`, `RPC_WS_PROVIDER=ws://127.0.0.1:8545`)
overrides kamigaze's `.env.local` (godotenv doesn't clobber existing vars), so
no `/etc/hosts` alias or config edits are needed.

## Notes

- `FOUNDRY_OFFLINE=true` is baked into `deploy:local` — without it forge hangs
  for many minutes after simulation doing network-based trace identification
  (openchain/etherscan lookups) before broadcasting.
- The world address is deterministic on a fresh chain and matches
  `packages/contracts/.env.puter` (`WORLD=0xa852...`), which is what
  `smoke:pool` reads.
- Known data gotcha: fresh deploys crash during init-script generation if
  `deployment/world/data/**/*.csv` contains fractional uint values (e.g. a
  listing priced at `0.05`); the generator feeds `Number(row[...])` straight
  into ABI-encoding. Fix the data or round/scale in
  `deployment/world/state/*.ts`.
