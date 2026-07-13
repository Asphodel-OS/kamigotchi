# `scripts/services/` — local Kamigotchi stack

One-command bring-up of the local dev stack, mirroring
`game2/scripts/services`. Run via `pnpm --filter services <script>` from the
repo root, or invoke `stack.sh` directly.

| Command | What it does |
| --- | --- |
| `pnpm --filter services start` | Bring up the stack: anvil → deploy world → client. Reuses anything already running; skips the deploy when the world already has code. |
| `pnpm --filter services start:fresh` | Same, but force a world redeploy. |
| `pnpm --filter services status` | Health-check anvil / world / client. |
| `pnpm --filter services smoke` | Run the pool AMM smoke test (`deployment/contracts/PoolSmoke.s.sol`) against the live world. |
| `pnpm --filter services stop` | Stop the services this script started. |
| `pnpm --filter services logs [svc]` | Tail logs (`anvil` \| `deploy` \| `client`). |

## Dependency graph

```
anvil (:8545)
 └─ deploy world (pnpm -F contracts deploy:local, FOUNDRY_OFFLINE=true)
     └─ client (vite :3000, puter mode)
         → http://localhost:3000/?worldAddress=<world>&initialBlockNumber=<block>
```

State and logs live in `.local-stack/` at the repo root (gitignored).

## Notes

- `FOUNDRY_OFFLINE=true` is baked into `deploy:local` — without it forge hangs
  for many minutes after simulation doing network-based trace identification
  (openchain/etherscan lookups) before broadcasting.
- The world address is deterministic on a fresh chain and matches
  `packages/contracts/.env.puter` (`WORLD=0xa852...`), which is what
  `smoke:pool` reads.
- The kamigaze indexer (sibling repo, Docker) is not wired in — the client
  runs against anvil directly in local mode. Add a runner here if/when local
  indexing is needed.
- Known data gotcha: fresh deploys crash during init-script generation if
  `deployment/world/data/**/*.csv` contains fractional uint values (e.g. a
  listing priced at `0.05`); the generator feeds `Number(row[...])` straight
  into ABI-encoding. Fix the data or round/scale in
  `deployment/world/state/*.ts`.
