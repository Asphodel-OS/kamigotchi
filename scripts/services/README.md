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
 │   └─ client (vite :3000, development mode + .env.local)
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
starts Docker Desktop itself if needed, brings up the Postgres container
(`make start-db`), creates the python venv (recreating it when its shebangs
are stale from a repo move, pinned to python ≤3.12 for psycopg2 wheels) and
deploys the schema on first run (marker: `.local-stack/kamigaze-schema.done`),
then runs `go run ./cmd/indexer -mode local` pointed at the local chain.

Exported env overrides kamigaze's `.env.local` (godotenv doesn't clobber
existing vars), so no `/etc/hosts` alias or config edits are needed:
`DB_HOST=127.0.0.1`, `RPC_HTTP_PROVIDER`/`RPC_WS_PROVIDER` → local anvil, and
`EMITTER_ADDRESS` read live from the world contract (`_emitter()`). The
starting block comes from the snapshot meta's `start` (the world's deploy
block — snapshot-restored chains keep their historical logs, so backfill
works). `INDEXER_OVERRIDE=true stack.sh indexer up` forces a re-backfill,
ignoring the db's last-seen block.

Known kamigaze quirks surfaced by the schema deploy (non-blocking): 
`900_VIEW_Accounts.sql` and `902_VIEW_Kamis.sql` reference `events.values_*`
tables the indexer only creates at runtime, so those two views fail on a
fresh db — rerun them after the first backfill if you need them.

## Notes

- `FOUNDRY_OFFLINE=true` is baked into `deploy:local` — without it forge hangs
  for many minutes after simulation doing network-based trace identification
  (openchain/etherscan lookups) before broadcasting.
- The world address is deterministic on a fresh chain and matches
  `packages/contracts/.env.local` (`WORLD=0xa852...`), which is what
  `smoke:pool` reads.
- "invalid chain id for signer" in the client → your gitignored
  `packages/client/.env.local` predates the 31337 standardization: set
  `VITE_CHAIN_ID=31337` (and check `VITE_WORLD_ADDRESS=0xa852...`), then
  restart vite — dotenv is read at server start, not hot-reloaded.
- Local env files are `.env.local` in both packages (renamed from `.env.puter`;
  the deploy tooling runs with `NODE_ENV=local`). Vite forbids `local` as a
  *mode* name, so `pnpm -F client dev:local` runs `--mode development`. Vite
  also auto-loads `.env.local` in every mode as a low-priority override — any
  key present there must be pinned explicitly in `.env.production`/`.env.testing`
  (done for `VITE_RPC_TRANSPORT_URL`) or prod-mode dev sessions inherit
  localhost values.
- Known data gotcha: fresh deploys crash during init-script generation if
  `deployment/world/data/**/*.csv` contains fractional uint values (e.g. a
  listing priced at `0.05`); the generator feeds `Number(row[...])` straight
  into ABI-encoding. Fix the data or round/scale in
  `deployment/world/state/*.ts`.
