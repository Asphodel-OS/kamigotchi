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
| `pnpm --filter services kamigaze` / `kamigaze:down` | Start / stop all three kamigaze services + Postgres (needs Docker + the sibling `../kamigaze` repo). |
| `pnpm --filter services indexer` / `indexer:down` | Just the kamigaze ingestion service (legacy alias). |
| `pnpm --filter services stop` | Stop everything this script started (client, indexer, db, anvil). |
| `pnpm --filter services logs [svc]` | Tail logs (`anvil` \| `deploy` \| `client` \| `indexer`). |

## Dependency graph

```
anvil (:8545)
 ├─ deploy world (pnpm -F contracts deploy:local, FOUNDRY_OFFLINE=true)
 │   ├─ snapshot (.local-stack/anvil-state.json.gz — auto-saved post-deploy)
 │   └─ client (vite :3000, development mode + .env.local)
 │       → http://localhost:3000/?worldAddress=<world>&initialBlockNumber=<block>
 └─ kamigaze (go, sibling repo — three services)     [optional]
     ├─ kamigaze_db (Docker Postgres :5432)
     ├─ indexer   chain → Postgres ingestion
     ├─ snapshot  client bootstrap state (grpc :50051, grpc-web :8080)
     └─ streamer  live event stream (grpc :50061, grpc-web :50062)
```

With kamigaze up and `VITE_LOCAL_KAMIGAZE_URL` / `VITE_LOCAL_KAMIGAZE_STREAM_URL`
in the client's `.env.local` (pointing at :8080 / :50062), the client boots from
the snapshot service in seconds instead of replaying every event from the node.
Remove those keys to fall back to full replay.

These are deliberately **local-only** keys, distinct from the `VITE_KAMIGAZE_URL`
used by prod/test builds: vite loads `.env` in every mode, so reusing that key
would silently point a local client at the prod indexer, and "remove to replay"
could never reach `undefined`.

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

Targets kamigaze **v1.3+** (post schema-restructure). Bring-up handles the
one-time setup automatically: starts Docker Desktop if needed, brings up the
plv8 Postgres container (`make start-db`, which reads `.env.dev`/`.env.test` —
created from your old `.env.local` if kamigaze's repo lacks them), applies
goose migrations on every run (idempotent; needs
`go install github.com/pressly/goose/v3/cmd/goose@latest`), then runs each
service via `go run ./cmd/<svc> -mode dev` pointed at the local chain. The
indexer runs with `-is-primary-indexer true` (a secondary just sleeps).

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
