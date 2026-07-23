# Notion → CSV diff (`world:notion:diff`)

A **read-only** tool that compares the Notion design databases against the world-data CSVs in `deployment/world/data/`. It is the review gate for a Notion-driven data workflow: edit in Notion, diff here, review, then selectively apply + deploy index-scoped.

## Doctrine (why this is a diff, not an auto-sync)

Per the deploy runbook's "World data: three sources": **the chain is canon, Notion is design intent, the CSVs are the deploy vehicle.** Notion is a *drafting surface* — it carries work-in-progress, shelved ideas, and errors. So this tool **never writes a CSV and never deploys.** It surfaces the delta; a human decides what (if anything) ships.

A blind "sync Notion → CSV → deploy" would ship Shelved/Idea rows and clobber intentional CSV corrections. The July 2026 reconciliation proved drift runs both ways. Hence: diff, review, apply-scoped, deploy-index-scoped, verify-against-chain.

## Usage

```bash
# from packages/contracts
pnpm world:notion:diff:test          # all mapped tables
pnpm world:notion:diff:test --table items      # one table (substring match on label)
pnpm world:notion:diff:prod          # same, prod env file
```

Reads `NOTION_PAT` from `.env.<NODE_ENV>` (see Setup). Output per table:

- `key "X": unique on both sides ✓` — matching is trustworthy (or `! ABORT` if the key repeats).
- `+ only in Notion` / `~ changed` — each row shows `[status: X → <deploy implication>]`, per the world-data flag mechanics (runbook Procedure B): `To Deploy` → bulk-init candidate, `To Update`/`Revise Deployment` → bulk-revise candidate, `In Game` → live, `Ready`/`Test` → staged, everything else → **WIP / inert in bulk**. So you can see at a glance what applying + bulk-deploying a row would do (a `--args` deploy ignores status — you name what ships).
- `! only in CSV` — **reverse drift**: a row in the deploy vehicle that Notion lacks. Suspicious — verify before trusting (this is how a phantom listing gets caught).
- `~ changed` — per-cell value differences on matched rows.
- `not compared (complex types)` — relation/files/people columns are surfaced but not diffed.

## How it works

- **Name-matched, not hand-mapped.** CSV headers are 1:1 with Notion property names, so the engine maps columns to properties by name. Config (`mapping.ts`) only needs `{csv, db, key}`.
- **Self-validating key.** If the key column has duplicate values on either side, the table ABORTS rather than mis-match rows — a wrong key can never silently produce a bad diff.
- **Type-aware extraction.** Handles title, rich_text, number, select, status, multi_select, checkbox, url/email/phone, date, formula, and number/simple-array rollups. Relation-backed rollups stay "complex" (not diffed).
- **Tolerant compare.** Whitespace-collapsed, numeric-equal (`5` == `5.0`), order-insensitive multi-values, and boolean-canonical (CSV `Yes/No` == Notion checkbox `true/false`).

## Coverage (verified against live Notion 2026-07-23)

Diffed: items, item-effects (allos), listings, quests, nodes, npc, factions, recipes, auctions.

**Deliberately excluded** (no safe single-column key — see the comment block in `mapping.ts`): listing-pricing, item-requirements, and the quest sub-tables (objectives/requirements/rewards). These are composite-keyed; diffing them needs composite-key support (future work). Review them by hand for now.

## Extending

Add one line to `MAPPINGS` in `mapping.ts` (`{label, csv, db, key}`), re-run, and confirm the new row prints `key "…": unique on both sides ✓` before trusting its diff. If it ABORTs on a non-unique key, that table needs composite-key support, not this tool.

## Setup

`NOTION_PAT` (the "Asphodel Studios" internal integration token) lives in the gitignored `.env.testing` / `.env.production` — same place the deploy commands read their secrets, never committed. The integration must be shared with each Notion database it reads (Share → add the integration). The loader strips a trailing `# comment` from the token value automatically.
