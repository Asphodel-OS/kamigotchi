// Notion database <-> world-data CSV mapping for the notion-diff tool.
//
// Doctrine (see /dev KAMIGOTCHI_DEPLOY_RUNBOOK "World data: three sources"):
// the CHAIN is canon, Notion is design intent (a DRAFTING surface that carries
// WIP + errors), the CSVs are the deploy vehicle. This tool DIFFS Notion against
// the CSVs — it never auto-writes and never deploys. A human reviews the diff,
// then selectively applies + deploys index-scoped, as always.
//
// CSV headers are 1:1 with Notion property NAMES (verified 2026-07-15), so the
// engine auto-maps columns to properties by name — no per-column config. Each
// entry only needs the CSV path, the Notion database name, and the row key.

export type Mapping = {
  label: string; // human label for the report
  csv: string; // path relative to deployment/world/data
  db: string; // exact Notion database title (resolved to an id at runtime)
  key: string; // CSV column + Notion property used to match rows (usually Index)
};

// Every mapping below was VERIFIED against live Notion 2026-07-23: the db title
// resolves, the key column exists on BOTH sides, and it is a unique per-row
// identifier. The engine additionally aborts cell-diffing for a table if the key
// has duplicate values (self-validating — a mis-key can never silently mis-diff).
// Extend freely; re-run and confirm the new row reports `key: unique` before
// trusting its diff.
export const MAPPINGS: Mapping[] = [
  { label: 'items', csv: 'items/items.csv', db: 'Item Registry', key: 'Index' },
  { label: 'item-effects (allos)', csv: 'items/allos.csv', db: 'Item Effects', key: 'Name' },
  { label: 'listings', csv: 'listings/listings.csv', db: 'Listings', key: 'Name' },
  { label: 'quests', csv: 'quests/quests.csv', db: 'Quests', key: 'Index' },
  { label: 'nodes', csv: 'rooms/nodes.csv', db: 'Nodes', key: 'Index' },
  { label: 'npc (characters)', csv: 'npc/npc.csv', db: 'Characters', key: 'Index' },
  { label: 'factions', csv: 'factions/factions.csv', db: 'Faction Reputation', key: 'Index' },
  { label: 'recipes', csv: 'crafting/recipes.csv', db: 'Crafting Recipes', key: 'Index' },
  { label: 'auctions', csv: 'auctions/auctions.csv', db: 'Auctions', key: 'Name' },
];

// DELIBERATELY EXCLUDED — no safe single-column unique key, so row-matching would
// be unreliable (all verified against live Notion 2026-07-23; the engine's dup-key
// guard independently ABORTS any of these if added by mistake):
//   - listings/pricing.csv (Listing Pricing): Name repeats — multiple listings share
//     a pricing curve (e.g. "GDA 20 Daily 50% Decay"). Needs a listing-scoped key.
//   - items/requirements.csv (Item Requirements): keyed by item+requirement; Notion
//     uses a `Key` formula, and Name repeats across items.
//   - quests/objectives.csv, quests/requirements.csv, quests/rewards.csv
//     (Quest Objectives/Requirements/Rewards): keyed by quest+index via a `Key`/`QKey`
//     formula; the CSVs don't even carry a quest-reference column.
// Diffing these needs composite-key support (match on the Notion Key/QKey formula) —
// future work. Until then they are NOT auto-diffed; review them by hand.
