import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ethers } from 'ethers';
import { DeployConfig, WorldAddresses } from '../utils';
import { filterDeployConfigByEnv, getCompIDByName, getSystemIDByName } from '../utils/deploy';
import { getCompAddr } from '../utils/addresses';
import { UintCompABI } from '../contracts/mappings/worldABIs';
import { readFile, generateRegID } from '../world/state/utils';
import { getProvider } from '../utils/chain';

///////////////
// TYPES

interface Result {
  category: string;
  name: string;
  passed: boolean;
  detail: string;
}

interface StateResult {
  category: string;
  name: string;
  status: string;       // CSV status
  onChain: boolean;
  state: 'CURRENT' | 'STALE' | 'MISSING' | 'PENDING' | 'ERROR';
  detail: string;
}

///////////////
// CONFIG

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

// Statuses that mean the entity should exist on-chain
const DEPLOYED_STATUSES = ['In Game'];

// Statuses that mean the entity needs a redeploy/update
const STALE_STATUSES = ['To Update', 'To Update Text', 'Revise Deployment'];

// Statuses that mean the entity is queued for first deployment
const PENDING_STATUSES = ['To Deploy', 'Ready', 'Test'];

// All statuses we care about
const ALL_STATUSES = [...DEPLOYED_STATUSES, ...STALE_STATUSES, ...PENDING_STATUSES];

const ENTITY_TYPES = [
  { label: 'Items', indexComp: 'component.index.item', regField: 'registry.item', csv: 'items/items.csv', indexCol: 'Index', nameCol: 'Name' },
  { label: 'Rooms', indexComp: 'component.index.room', regField: 'room', csv: 'rooms/rooms.csv', indexCol: 'Index', nameCol: 'Name' },
  { label: 'NPCs', indexComp: 'component.index.npc', regField: 'NPC', csv: 'npc/npc.csv', indexCol: 'Index', nameCol: 'Name', noStatus: true },
  { label: 'Quests', indexComp: 'component.index.quest', regField: 'registry.quest', csv: 'quests/quests.csv', indexCol: 'Index', nameCol: 'Title' },
  { label: 'Recipes', indexComp: 'component.index.recipe', regField: 'registry.recipe', csv: 'crafting/recipes.csv', indexCol: 'Index', nameCol: 'Name' },
  { label: 'Skills', indexComp: 'component.index.skill', regField: 'registry.skill', csv: 'skills/skills.csv', indexCol: 'Index', nameCol: 'Name' },
  { label: 'Factions', indexComp: 'component.index.faction', regField: 'faction', csv: 'factions/factions.csv', indexCol: 'Index', nameCol: 'Name' },
  { label: 'Nodes', indexComp: 'component.index.node', regField: 'node', csv: 'rooms/nodes.csv', indexCol: 'Index', nameCol: 'Name' },
];

///////////////
// MAIN

async function run() {
  const env = process.env.NODE_ENV || 'testing';
  const worldAddr = process.env.WORLD!;
  const rpc = process.env.RPC!;

  console.log(`\nVerifying World (${env})`);
  console.log(`World: ${worldAddr}`);
  console.log(`RPC: ${rpc}\n`);

  const deploy = filterDeployConfigByEnv(DeployConfig);
  const provider = getProvider();

  const World = new WorldAddresses();
  await World.init();

  const results: Result[] = [];

  // Phase 1: Components
  const compNames = deploy.components.map((comp: any) => comp.comp);
  const compIDs = deploy.components.map((comp: any) => getCompIDByName(comp.comp));

  console.log(`=== COMPONENTS (${compNames.length}) ===`);

  for (let i = 0; i < compNames.length; i++) {
    const addr = await World.getCompAddr(compIDs[i]);
    const passed = addr !== ZERO_ADDR;
    const detail = passed ? addr! : 'Not registered';
    results.push({ category: 'Component', name: compNames[i], passed, detail });
    console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${compNames[i]}  ${detail}`);
    await delay(30);
  }

  // Phase 2: Systems
  const systemNames = deploy.systems.map((sys: any) => sys.name);
  const systemIDs = deploy.systems.map((sys: any) => getSystemIDByName(sys.name));

  console.log(`\n=== SYSTEMS (${systemNames.length}) ===`);

  for (let i = 0; i < systemNames.length; i++) {
    const addr = await World.getSysAddr(systemIDs[i]);
    const passed = addr !== ZERO_ADDR;
    const detail = passed ? addr! : 'Not registered';
    results.push({ category: 'System', name: systemNames[i], passed, detail });
    console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${systemNames[i]}  ${detail}`);
    await delay(30);
  }

  // Phase 3: World State
  console.log(`\n=== WORLD STATE ===`);

  const stateResults: StateResult[] = [];

  for (const entityType of ENTITY_TYPES) {
    let rows: any[];
    try {
      rows = await readFile(entityType.csv);
    } catch (e) {
      console.log(`\n  ${entityType.label}: CSV not found (${entityType.csv})`);
      continue;
    }

    // Filter to relevant statuses (or keep all if no status column)
    const hasStatus = !('noStatus' in entityType && entityType.noStatus);
    if (hasStatus) {
      rows = rows.filter((row: any) => ALL_STATUSES.includes(row['Status']));
    }

    if (rows.length === 0) {
      console.log(`\n  ${entityType.label}: No entries to verify`);
      continue;
    }

    // Get index component address
    const indexAddr = await getCompAddr(entityType.indexComp);
    if (indexAddr === ZERO_ADDR) {
      console.log(`\n  ${entityType.label} (${rows.length} entries) - Index component not registered!`);
      for (const row of rows) {
        const idx = Number(row[entityType.indexCol]);
        const name = row[entityType.nameCol] || `#${idx}`;
        stateResults.push({ category: entityType.label, name: `${name} (#${idx})`, status: row['Status'] || '', onChain: false, state: 'ERROR', detail: 'Index component not registered' });
      }
      continue;
    }

    const indexContract = new ethers.Contract(indexAddr, UintCompABI, provider);

    console.log(`\n  ${entityType.label} (${rows.length} entries)`);

    for (const row of rows) {
      const idx = Number(row[entityType.indexCol]);
      if (isNaN(idx) || idx === 0) continue;

      const name = row[entityType.nameCol] || `#${idx}`;
      const csvStatus = hasStatus ? row['Status'] : 'In Game';
      const entityID = generateRegID(entityType.regField, idx);

      try {
        const onChain: boolean = await indexContract.has(entityID);
        const state = classifyState(csvStatus, onChain);
        const icon = STATE_ICONS[state];
        stateResults.push({ category: entityType.label, name: `${name} (#${idx})`, status: csvStatus, onChain, state, detail: STATE_DETAIL[state] });
        console.log(`    ${icon}  ${entityType.label} #${idx} (${name})  [${state}]`);
      } catch (e: any) {
        stateResults.push({ category: entityType.label, name: `${name} (#${idx})`, status: csvStatus, onChain: false, state: 'ERROR', detail: `RPC error: ${e.message?.slice(0, 60)}` });
        console.log(`    !!  ${entityType.label} #${idx} (${name})  [ERROR]`);
      }

      await delay(30);
    }
  }

  // Phase 4: Summary
  const compResults = results.filter((r) => r.category === 'Component');
  const sysResults = results.filter((r) => r.category === 'System');
  const failures = results.filter((r) => !r.passed);

  const compPass = compResults.filter((r) => r.passed).length;
  const sysPass = sysResults.filter((r) => r.passed).length;

  const current = stateResults.filter((r) => r.state === 'CURRENT');
  const stale = stateResults.filter((r) => r.state === 'STALE');
  const missing = stateResults.filter((r) => r.state === 'MISSING');
  const pending = stateResults.filter((r) => r.state === 'PENDING');
  const errors = stateResults.filter((r) => r.state === 'ERROR');

  console.log(`\n========================================`);
  console.log(`         VERIFICATION SUMMARY`);
  console.log(`========================================`);
  console.log(`Components: ${compPass}/${compResults.length} registered`);
  console.log(`Systems: ${sysPass}/${sysResults.length} registered`);
  console.log(`\nWorld State (${stateResults.length} entries):`);
  console.log(`  CURRENT:  ${current.length}  (In Game + on-chain)`);
  console.log(`  STALE:    ${stale.length}  (needs update on-chain)`);
  console.log(`  MISSING:  ${missing.length}  (should be on-chain but isn't)`);
  console.log(`  PENDING:  ${pending.length}  (not yet deployed, expected)`);
  if (errors.length > 0)
    console.log(`  ERROR:    ${errors.length}  (RPC or component errors)`);

  const hasIssues = failures.length > 0 || stale.length > 0 || missing.length > 0 || errors.length > 0;

  if (stale.length > 0) {
    console.log(`\nSTALE (needs world:state update):`);
    for (const r of stale) {
      console.log(`  ${r.category}: ${r.name}  [${r.status}]`);
    }
  }

  if (missing.length > 0) {
    console.log(`\nMISSING (should be deployed but not found):`);
    for (const r of missing) {
      console.log(`  ${r.category}: ${r.name}`);
    }
  }

  if (failures.length > 0) {
    console.log(`\nUNREGISTERED:`);
    for (const f of failures) {
      console.log(`  ${f.category}: ${f.name}`);
    }
  }

  if (errors.length > 0) {
    console.log(`\nERRORS:`);
    for (const r of errors) {
      console.log(`  ${r.category}: ${r.name} - ${r.detail}`);
    }
  }

  if (pending.length > 0) {
    console.log(`\nPENDING DEPLOY (${pending.length} entries):`);
    // Group by category for compactness
    const grouped = new Map<string, string[]>();
    for (const r of pending) {
      if (!grouped.has(r.category)) grouped.set(r.category, []);
      grouped.get(r.category)!.push(`${r.name} [${r.status}]`);
    }
    for (const [cat, items] of grouped) {
      console.log(`  ${cat}: ${items.length} entries`);
      for (const item of items) {
        console.log(`    ${item}`);
      }
    }
  }

  const isCurrent = !hasIssues;
  console.log(`\nRESULT: ${isCurrent ? 'CURRENT' : 'OUT OF SYNC'}`);
  if (!isCurrent) process.exit(1);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

///////////////
// INTERNAL

const STATE_ICONS: Record<string, string> = {
  CURRENT: 'OK',
  STALE: '!!',
  MISSING: 'XX',
  PENDING: '--',
  ERROR: '??',
};

const STATE_DETAIL: Record<string, string> = {
  CURRENT: 'Deployed and current',
  STALE: 'Needs update on-chain',
  MISSING: 'Should be on-chain but not found',
  PENDING: 'Not yet deployed',
  ERROR: 'Error checking',
};

function classifyState(csvStatus: string, onChain: boolean): StateResult['state'] {
  if (DEPLOYED_STATUSES.includes(csvStatus)) {
    return onChain ? 'CURRENT' : 'MISSING';
  }
  if (STALE_STATUSES.includes(csvStatus)) {
    return 'STALE'; // needs update regardless of on-chain state
  }
  if (PENDING_STATUSES.includes(csvStatus)) {
    return onChain ? 'CURRENT' : 'PENDING';
  }
  return 'ERROR';
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
