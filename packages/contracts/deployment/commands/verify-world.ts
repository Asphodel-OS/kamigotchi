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

///////////////
// CONFIG

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

const VALID_STATUSES = ['In Game', 'Ready', 'To Deploy', 'To Update'];

const ENTITY_TYPES = [
  { label: 'Items', indexComp: 'component.index.item', regField: 'registry.item', csv: 'items/items.csv', indexCol: 'Index', nameCol: 'Name' },
  { label: 'Rooms', indexComp: 'component.index.room', regField: 'room', csv: 'rooms/rooms.csv', indexCol: 'Index', nameCol: 'Name' },
  { label: 'NPCs', indexComp: 'component.index.npc', regField: 'NPC', csv: 'npc/npc.csv', indexCol: 'Index', nameCol: 'Name', noStatus: true },
  { label: 'Quests', indexComp: 'component.index.quest', regField: 'quest.instance', csv: 'quests/quests.csv', indexCol: 'Index', nameCol: 'Title' },
  { label: 'Recipes', indexComp: 'component.index.recipe', regField: 'recipe', csv: 'crafting/recipes.csv', indexCol: 'Index', nameCol: 'Name' },
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

  for (const entityType of ENTITY_TYPES) {
    let rows: any[];
    try {
      rows = await readFile(entityType.csv);
    } catch (e) {
      console.log(`\n  ${entityType.label}: CSV not found (${entityType.csv})`);
      continue;
    }

    // Filter by status if applicable
    if (!('noStatus' in entityType && entityType.noStatus)) {
      rows = rows.filter((row: any) => VALID_STATUSES.includes(row['Status']));
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
        results.push({ category: entityType.label, name: `${name} (#${idx})`, passed: false, detail: 'Index component not registered' });
      }
      continue;
    }

    const indexContract = new ethers.Contract(indexAddr, UintCompABI, provider);

    console.log(`\n  ${entityType.label} (${rows.length} entries)`);

    for (const row of rows) {
      const idx = Number(row[entityType.indexCol]);
      if (isNaN(idx) || idx === 0) continue;

      const name = row[entityType.nameCol] || `#${idx}`;
      const entityID = generateRegID(entityType.regField, idx);

      try {
        const exists: boolean = await indexContract.has(entityID);
        results.push({ category: entityType.label, name: `${name} (#${idx})`, passed: exists, detail: exists ? 'OK' : 'Entity not found on-chain' });
        console.log(`    ${exists ? 'PASS' : 'FAIL'}  ${entityType.label} #${idx} (${name})`);
      } catch (e: any) {
        results.push({ category: entityType.label, name: `${name} (#${idx})`, passed: false, detail: `RPC error: ${e.message?.slice(0, 60)}` });
        console.log(`    FAIL  ${entityType.label} #${idx} (${name}) - RPC error`);
      }

      await delay(30);
    }
  }

  // Phase 4: Summary
  const compResults = results.filter((r) => r.category === 'Component');
  const sysResults = results.filter((r) => r.category === 'System');
  const stateResults = results.filter((r) => !['Component', 'System'].includes(r.category));
  const failures = results.filter((r) => !r.passed);

  const compPass = compResults.filter((r) => r.passed).length;
  const sysPass = sysResults.filter((r) => r.passed).length;
  const statePass = stateResults.filter((r) => r.passed).length;

  console.log(`\n========================================`);
  console.log(`         VERIFICATION SUMMARY`);
  console.log(`========================================`);
  console.log(`Components: ${compPass}/${compResults.length} passed`);
  console.log(`Systems: ${sysPass}/${sysResults.length} passed`);
  console.log(`World State: ${statePass}/${stateResults.length} passed`);

  if (failures.length > 0) {
    console.log(`\nFAILURES:`);
    for (const f of failures) {
      console.log(`  ${f.category}: ${f.name} - ${f.detail}`);
    }
    console.log(`\nRESULT: FAIL (${failures.length} failures)`);
    process.exit(1);
  } else {
    console.log(`\nRESULT: PASS`);
  }
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

///////////////
// INTERNAL

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
