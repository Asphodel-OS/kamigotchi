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
  key: string | string[]; // CSV column(s) + Notion property(ies) matching rows; array = composite key
  // duplicate-key policy. Default 'abort': a repeated key makes matching ambiguous,
  // so the table is not diffed. 'first-wins' mirrors the deploy pipeline's own
  // semantics for LOOKUP tables (quest/item sub-rows are fetched by name from a
  // first-wins map; listings use .find()) — the diff keeps the FIRST occurrence
  // like deploy does, and reports extras: identical dups are dead rows, CONFLICTING
  // dups mean deploy silently ships only the first version.
  dupPolicy?: 'abort' | 'first-wins';
  // pin the exact database when the title is duplicated in the workspace (stale
  // copies exist). The engine verifies the pinned db's live title still equals
  // `db` — a silent retitle/swap fails loudly instead of diffing the wrong table.
  dbId?: string;
  // only diff Notion rows where property `prop` equals `equals` — for one Notion
  // db that fans out into several filtered CSVs (e.g. Droptables by Type).
  filter?: { prop: string; equals: string };
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
  // pinned: a stale 2023 db is also titled exactly "Rooms"
  { label: 'rooms', csv: 'rooms/rooms.csv', db: 'Rooms', key: 'Index', dbId: '1b90220c-3884-8033-8ce5-f198a895904a' },
  { label: 'skills (kami skill tree)', csv: 'skills/skills.csv', db: 'Kami Skill Tree Tables', key: 'Index' },
  { label: 'portal-tokens', csv: 'portal/tokens.csv', db: 'Token Portal Registry', key: 'Item Index' },
  // roles are per-environment: Name AND Address repeat across envs (izanami is in
  // both), so row identity is the composite (Name, Environment)
  { label: 'auth-roles', csv: 'auth/roles.csv', db: 'Role Addresses', key: ['Name', 'Environment'] },

  // TRAITS — five CSVs, five dbs. dbId pins are REQUIRED here: the workspace has
  // a second "Body" (2026 redesign, different schema) and a "Hands" (vs "Hand",
  // schema mismatch: Typing vs Affinity, no Slots/BPs). Provenance is provable —
  // each CSV's Image paths embed the source db id (e.g. "Body%2037ffb229...").
  { label: 'trait-backgrounds', csv: 'traits/backgrounds.csv', db: 'Background', key: 'Index', dbId: '3e7cd623-60dd-4f33-afd4-83b2f3e0b7f7' },
  { label: 'trait-bodies', csv: 'traits/bodies.csv', db: 'Body', key: 'Index', dbId: '37ffb229-7474-4a24-8c6d-42ba98c90963' },
  { label: 'trait-colors', csv: 'traits/colors.csv', db: 'Color', key: 'Index', dbId: '9bd250d1-329b-4e1d-9e24-8cb0b090db60' },
  { label: 'trait-faces', csv: 'traits/faces.csv', db: 'Face', key: 'Index', dbId: '56d32cbb-9f97-48d7-a241-fb622148a4e5' },
  { label: 'trait-hands', csv: 'traits/hands.csv', db: 'Hand', key: 'Index', dbId: 'c3f0ea61-4317-49da-b62a-867a500a4c3e' },

  // LOOKUP TABLES — sub-rows referenced BY NAME from a parent table's list column
  // (quests.csv Objectives/Requirements/Rewards, items.csv Requirements, listings.csv
  // Buy/Sell Price + requirement keys). The deploy pipeline resolves these with a
  // first-wins map / .find(), so 'first-wins' here is deploy-faithful: the diff keeps
  // the first occurrence exactly like a deploy would, and flags extras (a CONFLICTING
  // duplicate = deploy silently ships only the first version). The parent→child
  // LINKAGE is already diffed on the parent table's list column; these diff CONTENT.
  // dbId pins: each quest sub-table title ALSO exists as a stale 2023 copy
  // (7-10 rows, dead page) — pinned to the live dbs on the Quests parent page.
  { label: 'quest-objectives', csv: 'quests/objectives.csv', db: 'Quest Objectives', key: 'Description', dupPolicy: 'first-wins', dbId: '1b40220c-3884-802a-a645-e69b68180179' },
  { label: 'quest-requirements', csv: 'quests/requirements.csv', db: 'Quest Requirements', key: 'Description', dupPolicy: 'first-wins', dbId: '1b40220c-3884-80a9-af58-d39dc27e1ab2' },
  { label: 'quest-rewards', csv: 'quests/rewards.csv', db: 'Quest Rewards', key: 'Description', dupPolicy: 'first-wins', dbId: '1b40220c-3884-8026-a1b2-ff19a8f54342' },
  { label: 'item-requirements', csv: 'items/requirements.csv', db: 'Item Requirements', key: 'Name', dupPolicy: 'first-wins' },
  { label: 'listing-requirements', csv: 'listings/requirements.csv', db: 'Listing Requirements', key: 'Key', dupPolicy: 'first-wins' },
  { label: 'listing-pricing', csv: 'listings/pricing.csv', db: 'Listing Pricing', key: 'Key', dupPolicy: 'first-wins' },
  // skill bonuses are looked up from skills.csv Effect -> effects.csv Key via
  // .find(). NB the Notion db is "Kami Bonus Effects" — the db titled "Skill
  // Effects" is a stale 2024 table with a different schema.
  { label: 'skill-effects', csv: 'skills/effects.csv', db: 'Kami Bonus Effects', key: 'Key', dupPolicy: 'first-wins' },
  // DROPTABLES — ONE Notion db fans out into three filtered CSV copies; the Type
  // property discriminates. All three are Name-keyed lookup tables (scavenges +
  // npc use a first-wins map, item allos use .find()). NB Indices/Tiers are
  // ORDER-CORRELATED lists (index[i] pairs with tier[i]) — if they diff as sets
  // (rollup type), a same-set re-pairing would not be caught; review pairings by
  // eye when a droptable row changes.
  { label: 'droptables-items', csv: 'items/droptables.csv', db: 'Droptables', key: 'Name', dupPolicy: 'first-wins', filter: { prop: 'Type', equals: 'Item' } },
  { label: 'droptables-npc', csv: 'npc/droptables.csv', db: 'Droptables', key: 'Name', dupPolicy: 'first-wins', filter: { prop: 'Type', equals: 'NPC' } },
  { label: 'droptables-nodes', csv: 'rooms/droptables.csv', db: 'Droptables', key: 'Name', dupPolicy: 'first-wins', filter: { prop: 'Type', equals: 'Node' } },
];

// NOT MAPPED: snapshot/ + auth whitelists are chain-derived (no Notion source).
// For a table with NO single unique column, use a composite key (key: ['A', 'B'])
// — the engine joins the columns into one match key and the dup guard still applies.
