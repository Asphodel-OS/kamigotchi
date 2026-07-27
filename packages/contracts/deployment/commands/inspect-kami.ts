import dotenv from 'dotenv';
import { ethers, JsonRpcProvider, AbiCoder } from 'ethers';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { WorldABI } from '../contracts/mappings/worldABIs';
import { getAddrByID } from '../utils/addresses';

const argv = require('yargs/yargs')(require('yargs/helpers').hideBin(process.argv))
  .usage('Usage: $0 <kami-index> [options]')
  .command('$0 [index]', 'Inspect a kami\'s on-chain data', (yargs: any) => {
    yargs.positional('index', {
      describe: 'Kami index to inspect',
      type: 'number',
    });
  })
  .option('id', {
    alias: 'i',
    type: 'number',
    describe: 'Kami index (alternative to positional arg)',
  })
  .option('no-harvest', {
    type: 'boolean',
    default: false,
    describe: 'Skip harvest entity lookup',
  })
  .option('no-analysis', {
    type: 'boolean',
    default: false,
    describe: 'Skip analysis section',
  })
  .option('raw', {
    alias: 'r',
    type: 'boolean',
    default: false,
    describe: 'Include raw hex values in output',
  })
  .help()
  .argv;

// Support: `ts-node inspect-kami.ts 123`, `-- 123`, or `--id 123`
const KAMI_INDEX: number | undefined =
  argv.index ?? argv.id ?? (argv._.length > 0 ? Number(argv._[0]) : undefined);

if (KAMI_INDEX === undefined || isNaN(KAMI_INDEX)) {
  console.error('Kami index is required. Pass as positional arg or --id');
  process.exit(1);
}

const provider = new JsonRpcProvider(process.env.RPC!);
const world = new ethers.Contract(process.env.WORLD!, WorldABI, provider);
const coder = AbiCoder.defaultAbiCoder();

// Generate entity IDs matching Solidity's keccak256(abi.encodePacked(...))
const kamiEntityID = ethers.solidityPackedKeccak256(['string', 'uint32'], ['kami.id', KAMI_INDEX]);
const harvestEntityID = ethers.solidityPackedKeccak256(['string', 'uint256'], ['harvest', kamiEntityID]);

console.log(`\n=== Investigating Kami #${KAMI_INDEX} ===`);
console.log(`Entity ID: ${kamiEntityID}`);
console.log(`Harvest Entity ID: ${harvestEntityID}`);
console.log(`World: ${process.env.WORLD}`);
console.log(`RPC: ${process.env.RPC}\n`);

// Component string IDs
const COMPONENTS = {
  state: 'component.state',
  health: 'component.stat.health',
  harmony: 'component.stat.harmony',
  power: 'component.stat.power',
  violence: 'component.stat.violence',
  stamina: 'component.stat.stamina',
  slots: 'component.stat.slots',
  timeLast: 'component.Time.Last',
  timeLastAction: 'component.Time.LastAction',
  timeNext: 'component.Time.Next',
  entityType: 'component.type.entity',
  name: 'component.name',
  ownsKami: 'component.id.kami.owns',
  indexKami: 'component.index.kami',
  indexRoom: 'component.index.room',
  level: 'component.level',
  value: 'component.value',
  idHolder: 'component.id.holder',
  idSource: 'component.id.source',
  timeStart: 'component.Time.Start',
  timeReset: 'component.Time.Reset',
};

// Use explicit function signature to avoid ambiguity with overloaded functions
const getRawSig = 'function getRaw(uint256 entity) view returns (bytes)';
const getSig = 'function get(uint256 entity) view returns (uint256)';
const hasSig = 'function has(uint256 entity) view returns (bool)';
const CompReadABI = [getRawSig, getSig, hasSig];
const StatReadABI = [
  getRawSig,
  hasSig,
  'function get(uint256 entity) view returns (int32 base, int32 shift, int32 boost, int32 sync)',
];
type StatValue = { base: number; shift: number; boost: number; sync: number };

function decodeString(raw: string): string {
  try {
    const [str] = coder.decode(['string'], raw);
    return str;
  } catch {
    return `(raw: ${raw.slice(0, 40)}...)`;
  }
}

function calcStatMax(stat: StatValue): number {
  return Math.max(0, Math.floor(((1000 + stat.boost) * (stat.base + stat.shift)) / 1000));
}

async function safeGet(comp: ethers.Contract | null, entityID: string): Promise<bigint | null> {
  if (!comp) return null;
  try {
    const has: boolean = await comp.has(entityID);
    if (!has) return null;
    return await comp.get(entityID);
  } catch (e: any) {
    console.log(`  (get error: ${e.message?.slice(0, 100)})`);
    return null;
  }
}

async function safeGetRaw(comp: ethers.Contract | null, entityID: string): Promise<string | null> {
  if (!comp) return null;
  try {
    const has: boolean = await comp.has(entityID);
    if (!has) return null;
    return await comp.getRaw(entityID);
  } catch (e: any) {
    console.log(`  (getRaw error: ${e.message?.slice(0, 100)})`);
    return null;
  }
}

async function safeGetStat(comp: ethers.Contract | null, entityID: string): Promise<StatValue | null> {
  if (!comp) return null;
  try {
    const has: boolean = await comp.has(entityID);
    if (!has) return null;
    const value = await comp.get(entityID);
    return {
      base: Number(value[0]),
      shift: Number(value[1]),
      boost: Number(value[2]),
      sync: Number(value[3]),
    };
  } catch (e: any) {
    console.log(`  (stat get error: ${e.message?.slice(0, 100)})`);
    return null;
  }
}

async function main() {
  const compsAddr = await world.components();
  console.log(`Component Registry: ${compsAddr}\n`);

  // Resolve all component contracts
  console.log('Resolving component addresses...');
  const comps: Record<string, ethers.Contract | null> = {};
  const statKeys = new Set(['health', 'harmony', 'power', 'violence', 'stamina', 'slots']);
  for (const [key, strID] of Object.entries(COMPONENTS)) {
    const id = ethers.solidityPackedKeccak256(['string'], [strID]);
    const addr = await getAddrByID(provider, compsAddr, id);
    if (addr === '0x0000000000000000000000000000000000000000') {
      comps[key] = null;
    } else {
      const abi = statKeys.has(key) ? StatReadABI : CompReadABI;
      comps[key] = new ethers.Contract(addr, abi, provider);
    }
    if (!comps[key]) console.log(`  WARNING: ${key} (${strID}) not found!`);
  }

  // ===== KAMI ENTITY DATA =====
  console.log('\n--- KAMI ENTITY ---');

  // Entity type (string component)
  const entityTypeRaw = await safeGetRaw(comps.entityType, kamiEntityID);
  console.log(`Entity Type: ${entityTypeRaw ? decodeString(entityTypeRaw) : '(not set)'}`);

  // Name (string component)
  const nameRaw = await safeGetRaw(comps.name, kamiEntityID);
  console.log(`Name: ${nameRaw ? decodeString(nameRaw) : '(not set)'}`);

  // State (THE KEY FIELD - string component)
  const stateRaw = await safeGetRaw(comps.state, kamiEntityID);
  const state = stateRaw ? decodeString(stateRaw) : '(not set)';
  console.log(`State: ${state}`);

  // Index (uint256)
  const indexVal = await safeGet(comps.indexKami, kamiEntityID);
  console.log(`Index: ${indexVal}`);

  // Owner (account ID - uint256)
  const ownerAccID = await safeGet(comps.ownsKami, kamiEntityID);
  console.log(`Owner Account ID: ${ownerAccID}`);

  // Level (uint256)
  const level = await safeGet(comps.level, kamiEntityID);
  console.log(`Level: ${level ?? '(not set)'}`);

  // ===== STATS =====
  console.log('\n--- STATS ---');
  const statNames = ['health', 'harmony', 'power', 'violence', 'stamina', 'slots'] as const;
  for (const statName of statNames) {
    const stat = await safeGetStat(comps[statName], kamiEntityID);
    const raw = argv.raw ? await safeGetRaw(comps[statName], kamiEntityID) : null;
    if (stat !== null) {
      const max = calcStatMax(stat);
      const rawStr = raw ? ` (raw: ${raw})` : '';
      console.log(
        `${statName.toUpperCase().padEnd(10)} base=${String(stat.base).padStart(4)} shift=${String(stat.shift).padStart(4)} boost=${String(stat.boost).padStart(5)} sync=${String(stat.sync).padStart(4)} | max=${max}${rawStr}`
      );
    } else {
      console.log(`${statName.toUpperCase().padEnd(10)} (not set)`);
    }
  }

  // ===== TIMESTAMPS =====
  console.log('\n--- TIMESTAMPS ---');
  const now = Math.floor(Date.now() / 1000);

  const printTs = (label: string, val: bigint | null) => {
    if (!val) { console.log(`${label}: (not set)`); return; }
    const ts = Number(val);
    const ago = now - ts;
    console.log(`${label}: ${ts} (${new Date(ts * 1000).toISOString()}, ${ago}s / ${(ago / 3600).toFixed(1)}h ago)`);
  };

  const timeLast = await safeGet(comps.timeLast, kamiEntityID);
  printTs('TimeLast (kami)', timeLast);

  const timeLastAction = await safeGet(comps.timeLastAction, kamiEntityID);
  printTs('TimeLastAction (kami)', timeLastAction);

  const timeNext = await safeGet(comps.timeNext, kamiEntityID);
  printTs('TimeNext (cooldown end)', timeNext);
  console.log(`Cooldown Active: ${timeNext !== null ? Number(timeNext) > now : false}`);

  // ===== HARVEST ENTITY =====
  if (argv.noHarvest) {
    console.log('\n--- HARVEST ENTITY (skipped) ---');
  }
  const harvestTypeRaw = argv.noHarvest ? null : await safeGetRaw(comps.entityType, harvestEntityID);
  if (!argv.noHarvest) console.log('\n--- HARVEST ENTITY ---');
  if (harvestTypeRaw) {
    console.log(`Harvest Entity Type: ${decodeString(harvestTypeRaw)}`);

    const harvestStateRaw = await safeGetRaw(comps.state, harvestEntityID);
    const harvestState = harvestStateRaw ? decodeString(harvestStateRaw) : '(not set)';
    console.log(`Harvest State: ${harvestState}`);

    const harvestValue = await safeGet(comps.value, harvestEntityID);
    console.log(`Harvest Balance (uncollected musu): ${harvestValue ?? '0'}`);

    const harvestHolder = await safeGet(comps.idHolder, harvestEntityID);
    const holderMatch = harvestHolder?.toString() === BigInt(kamiEntityID).toString();
    console.log(`Harvest Holder (kami): ${harvestHolder} (matches kami: ${holderMatch})`);

    const harvestSource = await safeGet(comps.idSource, harvestEntityID);
    console.log(`Harvest Source (node ID): ${harvestSource}`);

    const harvestTimeLast = await safeGet(comps.timeLast, harvestEntityID);
    printTs('Harvest TimeLast', harvestTimeLast);

    const harvestTimeStart = await safeGet(comps.timeStart, harvestEntityID);
    printTs('Harvest TimeStart', harvestTimeStart);

    const harvestTimeReset = await safeGet(comps.timeReset, harvestEntityID);
    printTs('Harvest TimeReset', harvestTimeReset);
  } else if (!argv.noHarvest) {
    console.log('No harvest entity found');
  }

  // ===== ANALYSIS =====
  if (argv.noAnalysis) {
    console.log('\nDone.');
    return;
  }
  console.log('\n--- ANALYSIS ---');

  const health = await safeGetStat(comps.health, kamiEntityID);
  const hpMax = health ? calcStatMax(health) : 0;

  console.log(`State: ${state}`);
  console.log(`HP: ${health?.sync ?? '?'} / ${hpMax} (stored sync / computed max)`);
  console.log(`Can Eat By State Check: ${state === 'RESTING' || state === 'HARVESTING'}`);
  console.log(`On Cooldown: ${timeNext !== null ? Number(timeNext) > now : false}`);

  let warnings = 0;

  if (health && health.sync > hpMax) {
    console.log(`!! HP sync (${health.sync}) exceeds computed max (${hpMax}). Will clamp on next sync.`);
    warnings++;
  }

  if (health && health.sync <= 0) {
    console.log(`!! HP sync is ${health.sync}. verifyHealthy checks will fail.`);
    warnings++;
  }

  if (timeLast) {
    const lastSyncAgo = now - Number(timeLast);
    if (lastSyncAgo > 86400 * 7) {
      console.log(`!! Last sync was ${(lastSyncAgo / 86400).toFixed(1)} days ago. Risk of int32 overflow in strain calculations.`);
      warnings++;
    }
  }

  if (timeNext !== null && Number(timeNext) > now) {
    console.log(`!! Cooldown active until ${new Date(Number(timeNext) * 1000).toISOString()}`);
    warnings++;
  }

  if (warnings === 0) {
    console.log('No issues detected.');
  }

  console.log('\nDone.');
}

main().catch(console.error);
