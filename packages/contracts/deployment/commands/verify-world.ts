import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
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
  state: 'CURRENT' | 'STALE' | 'NOT_REGISTERED' | 'NO_ARTIFACT' | 'ERROR';
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
  { label: 'Skills', indexComp: 'component.index.skill', regField: 'registry.skill', csv: 'skills/skills.csv', indexCol: 'Index', nameCol: 'Name', noStatus: true },
  { label: 'Factions', indexComp: 'component.index.faction', regField: 'faction', csv: 'factions/factions.csv', indexCol: 'Index', nameCol: 'Name', noStatus: true },
  { label: 'Nodes', indexComp: 'component.index.node', regField: 'node', csv: 'rooms/nodes.csv', indexCol: 'Index', nameCol: 'Name' },
];

///////////////
// MAIN

const argv = require('yargs/yargs')(require('yargs/helpers').hideBin(process.argv)).argv;

// filtering flags:
//   --allcomponents / --allsystems / --allstate   run only those phases (default: all three)
//   --components Name                             check a single component
//   --systems Name                                check a single system
//   --type Label                                  check a single entity type, e.g. Items
//   --index N                                     check a single index within --type
const filterComponent: string | undefined = argv.components;
const filterSystem: string | undefined = argv.systems;
const filterType: string | undefined = argv.type;
const parsedIndex: number | undefined = argv.index != null ? Number(argv.index) : undefined;
if (parsedIndex !== undefined) {
  if (!Number.isInteger(parsedIndex) || parsedIndex <= 0) {
    throw new Error(`invalid --index "${argv.index}": expected a positive integer`);
  }
  if (!filterType) {
    throw new Error('--index requires --type');
  }
}
const filterIndex = parsedIndex;

const runComponents = argv.allcomponents || filterComponent || (!argv.allsystems && !argv.allstate && !filterSystem && !filterType);
const runSystems = argv.allsystems || filterSystem || (!argv.allcomponents && !argv.allstate && !filterComponent && !filterType);
const runState = argv.allstate || filterType || (!argv.allcomponents && !argv.allsystems && !filterComponent && !filterSystem);

async function run() {
  const env = process.env.NODE_ENV || 'testing';
  const worldAddr = process.env.WORLD!;
  const rpc = process.env.RPC!;

  // Recompile artifacts unless --skip-build is passed. Verification only reads
  // system/component/library artifacts, so the test tree (a second full compile
  // of the world at the heavy default profile) is skipped
  if (!argv.skipBuild) {
    console.log('Building artifacts (use --skip-build to skip)...');
    execSync('forge build --skip test', { cwd: path.join(__dirname, '../..'), stdio: 'inherit' });
    console.log('');
  }

  console.log(`\nVerifying World (${env})`);
  console.log(`World: ${worldAddr}`);
  const redactedRpc = (() => {
    try { const u = new URL(rpc); return `${u.protocol}//${u.hostname}/***`; }
    catch { return '(invalid URL, redacted)'; }
  })();
  console.log(`RPC: ${redactedRpc}\n`);

  const deploy = filterDeployConfigByEnv(DeployConfig);
  const provider = getProvider();

  const World = new WorldAddresses();
  await World.init();

  const results: Result[] = [];
  const artifactsDir = path.join(__dirname, '../../out');

  // Phase 1: Components
  if (runComponents) {
  let comps = deploy.components;
  if (filterComponent) {
    comps = comps.filter((c: any) => c.comp === filterComponent);
    if (comps.length === 0) throw new Error(`no components matched --components "${filterComponent}"`);
  }
  const compNames = comps.map((comp: any) => comp.comp);
  const compIDs = comps.map((comp: any) => getCompIDByName(comp.comp));

  console.log(`=== COMPONENTS (${compNames.length}) ===`);

  for (let i = 0; i < compNames.length; i++) {
    if (!compIDs[i]) {
      results.push({ category: 'Component', name: compNames[i], passed: false, state: 'ERROR', detail: 'No mapping ID' });
      console.log(`  ??  ${compNames[i]}  No mapping ID`);
      await delay(30);
      continue;
    }
    const addr = await World.getCompAddr(compIDs[i]);
    const passed = addr !== ZERO_ADDR;
    const detail = passed ? addr! : 'Not registered';
    const state = passed ? 'CURRENT' : 'NOT_REGISTERED';
    results.push({ category: 'Component', name: compNames[i], passed, state, detail });
    console.log(`  ${passed ? 'OK' : 'XX'}  ${compNames[i]}  ${detail}`);
    await delay(30);
  }
  }

  // Phase 2: Systems (with linked library checks)
  if (runSystems) {
  let sysList = deploy.systems;
  if (filterSystem) {
    sysList = sysList.filter((s: any) => s.name === filterSystem);
    if (sysList.length === 0) throw new Error(`no systems matched --systems "${filterSystem}"`);
  }
  const systemNames = sysList.map((sys: any) => sys.name);
  const systemIDs = sysList.map((sys: any) => getSystemIDByName(sys.name));

  // Cache local library artifacts (deployedBytecode.object + linkReferences)
  const libArtifactCache = new Map<string, any | null>();
  function getLibArtifact(libName: string): any | null {
    if (libArtifactCache.has(libName)) return libArtifactCache.get(libName)!;
    const p = path.join(artifactsDir, `${libName}.sol/${libName}.json`);
    let artifact: any | null = null;
    if (fs.existsSync(p)) {
      const a = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if ((a.deployedBytecode?.object?.length || 2) > 2) artifact = a;
    }
    libArtifactCache.set(libName, artifact);
    return artifact;
  }

  // Cache deployed library code by address
  const libDeployedCodeCache = new Map<string, string>();
  async function getLibDeployedCode(addr: string): Promise<string> {
    const key = addr.toLowerCase();
    if (libDeployedCodeCache.has(key)) return libDeployedCodeCache.get(key)!;
    const code = await provider.getCode(addr);
    libDeployedCodeCache.set(key, code);
    return code;
  }

  // Check a system's linked libraries by CONTENT (metadata-stripped, call
  // protection + nested link refs masked). The library address is extracted
  // from the deployed system code at the LOCAL artifact's link offsets, which
  // is only sound while the deployed layout matches — so extraction is gated:
  // every link position must yield the same address and it must hold code,
  // otherwise the lib is reported unverifiable rather than guessed at.
  async function checkSystemLibs(
    sysName: string,
    onChainCode: string
  ): Promise<{ staleLibs: string[]; unverifiable: string[] }> {
    const artifactPath = path.join(artifactsDir, `${sysName}.sol/${sysName}.json`);
    if (!fs.existsSync(artifactPath)) return { staleLibs: [], unverifiable: [] };
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    const links = artifact.deployedBytecode?.linkReferences || {};
    const hex = onChainCode.startsWith('0x') ? onChainCode.slice(2) : onChainCode;
    const staleLibs: string[] = [];
    const unverifiable: string[] = [];

    for (const [file, libs] of Object.entries(links) as [string, any][]) {
      for (const [libName, positions] of Object.entries(libs) as [string, any][]) {
        const libArtifact = getLibArtifact(libName);
        if (!libArtifact) continue;

        // extraction gate: all placeholder positions must be in-bounds and
        // agree on one address
        const slices = new Set<string>();
        let outOfBounds = false;
        for (const p of positions) {
          const s = p.start * 2;
          if (s + 40 > hex.length) {
            outOfBounds = true;
            break;
          }
          slices.add(hex.substring(s, s + 40).toLowerCase());
        }
        if (outOfBounds || slices.size !== 1) {
          if (!unverifiable.includes(libName)) unverifiable.push(libName);
          continue;
        }
        const libAddr = '0x' + [...slices][0];

        try {
          const deployedCode = await getLibDeployedCode(libAddr);
          if (!deployedCode || deployedCode.length <= 2) {
            // extracted address holds no code: layout drift, not a library
            if (!unverifiable.includes(libName)) unverifiable.push(libName);
            continue;
          }

          const localCode = libArtifact.deployedBytecode.object;
          const libLinks = libArtifact.deployedBytecode.linkReferences || {};
          const current = compareLibBytecode(deployedCode, localCode, libLinks);

          const key = `${libName}@${libAddr.toLowerCase()}`;
          if (!libInstanceMap.has(key)) {
            libInstanceMap.set(key, {
              libName,
              addr: libAddr,
              deployedSize: (deployedCode.length - 2) / 2,
              localSize: (localCode.length - 2) / 2,
              current,
              systems: [],
            });
          }
          libInstanceMap.get(key)!.systems.push(sysName);

          if (!current && !staleLibs.includes(libName)) staleLibs.push(libName);
        } catch {}
      }
    }
    return { staleLibs, unverifiable };
  }

  // Track library instances for summary
  const libInstanceMap = new Map<string, { libName: string; addr: string; deployedSize: number; localSize: number; current: boolean; systems: string[] }>();

  // Check and print each system procedurally
  console.log(`\n=== SYSTEMS (${systemNames.length}) ===`);

  for (let i = 0; i < systemNames.length; i++) {
    const sysName = systemNames[i];
    const sysID = systemIDs[i];

    if (!sysID) {
      results.push({ category: 'System', name: sysName, passed: false, state: 'ERROR', detail: 'No mapping ID' });
      console.log(`  ??  ${sysName}  No mapping ID`);
      await delay(30);
      continue;
    }

    const addr = await World.getSysAddr(sysID);
    if (!addr || addr === ZERO_ADDR) {
      results.push({ category: 'System', name: sysName, passed: false, state: 'NOT_REGISTERED', detail: 'Not registered' });
      console.log(`  XX  ${sysName}  Not registered`);
      await delay(30);
      continue;
    }

    const artifactPath = path.join(artifactsDir, `${sysName}.sol/${sysName}.json`);
    if (!fs.existsSync(artifactPath)) {
      results.push({ category: 'System', name: sysName, passed: false, state: 'NO_ARTIFACT', detail: `Registered at ${addr} (no artifact to verify)` });
      console.log(`  --  ${sysName}  ${addr}  (no artifact)`);
      await delay(30);
      continue;
    }

    try {
      const onChainCode = await provider.getCode(addr);
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
      const compiledCode = artifact.deployedBytecode.object;
      const imm = artifact.deployedBytecode.immutableReferences || {};
      const links = artifact.deployedBytecode.linkReferences || {};

      const bytecodeMatch = compareBytecode(onChainCode, compiledCode, imm, links);
      const { staleLibs, unverifiable } = await checkSystemLibs(sysName, onChainCode);
      const hasStaleLib = staleLibs.length > 0;

      if (bytecodeMatch && !hasStaleLib) {
        results.push({ category: 'System', name: sysName, passed: true, state: 'CURRENT', detail: addr });
        console.log(`  OK  ${sysName}  ${addr}`);
      } else {
        // a stale system needs redeploy either way (which ships fresh library
        // instances); lib findings only DRIVE the verdict when the system's
        // own bytecode matches — the "needs redeploy purely to relink" case
        const reasons: string[] = [];
        if (!bytecodeMatch) reasons.push('bytecode differs');
        else if (hasStaleLib) reasons.push(`linked library ${staleLibs.join(', ')} outdated`);
        let detail = reasons.join(' + ') + ' (needs redeploy)';
        if (!bytecodeMatch) {
          const notes: string[] = [];
          if (hasStaleLib) notes.push(`linked ${staleLibs.join(', ')} instance also outdated`);
          if (unverifiable.length > 0) notes.push(`libs unverifiable due to layout drift: ${unverifiable.join(', ')}`);
          if (notes.length > 0) detail += `; ${notes.join('; ')}`;
        }
        results.push({ category: 'System', name: sysName, passed: false, state: 'STALE', detail });
        console.log(`  !!  ${sysName}  ${addr}  STALE (${detail.replace(' (needs redeploy)', '')})`);
      }
    } catch (e: any) {
      results.push({ category: 'System', name: sysName, passed: false, state: 'ERROR', detail: `Bytecode check failed: ${e.message?.slice(0, 60)}` });
      console.log(`  ??  ${sysName}  ${addr}  Error comparing bytecode`);
    }

    await delay(30);
  }

  // Track library results for summary (no output here)
  for (const [key, lib] of libInstanceMap) {
    const isStale = !lib.current;
    const delta = lib.localSize - lib.deployedSize;
    const sysList = [...new Set(lib.systems)].join(', ');
    results.push({
      category: 'Library',
      name: lib.libName,
      passed: !isStale,
      state: isStale ? 'STALE' : 'CURRENT',
      detail: isStale
        ? `${lib.addr} (content differs; deployed ${lib.deployedSize}B, local ${lib.localSize}B, delta ${delta > 0 ? '+' : ''}${delta}) affects: ${sysList}`
        : `${lib.addr}`,
    });
  }
  }

  // Phase 3: World State
  const stateResults: StateResult[] = [];

  if (runState) {
  console.log(`\n=== WORLD STATE ===`);

  let entityTypes = ENTITY_TYPES;
  if (filterType) {
    entityTypes = entityTypes.filter((t) => t.label.toLowerCase() === filterType.toLowerCase());
    if (entityTypes.length === 0) throw new Error(`unknown --type "${filterType}"`);
  }

  for (const entityType of entityTypes) {
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

    // Filter by specific index if provided
    if (filterIndex != null) {
      rows = rows.filter((row: any) => Number(row[entityType.indexCol]) === filterIndex);
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
  }

  // Phase 4: Summary
  const compResults = results.filter((r) => r.category === 'Component');
  const sysResults = results.filter((r) => r.category === 'System');

  const compCurrent = compResults.filter((r) => r.state === 'CURRENT').length;
  const compUnreg = compResults.filter((r) => r.state === 'NOT_REGISTERED');
  const compErrors = compResults.filter((r) => r.state === 'ERROR');

  const sysCurrent = sysResults.filter((r) => r.state === 'CURRENT').length;
  const sysStale = sysResults.filter((r) => r.state === 'STALE');
  const sysUnreg = sysResults.filter((r) => r.state === 'NOT_REGISTERED');
  const sysNoArt = sysResults.filter((r) => r.state === 'NO_ARTIFACT');
  const sysErrors = sysResults.filter((r) => r.state === 'ERROR');

  const wsCurrent = stateResults.filter((r) => r.state === 'CURRENT');
  const wsStale = stateResults.filter((r) => r.state === 'STALE');
  const wsMissing = stateResults.filter((r) => r.state === 'MISSING');
  const wsPending = stateResults.filter((r) => r.state === 'PENDING');
  const wsErrors = stateResults.filter((r) => r.state === 'ERROR');

  console.log(`\n========================================`);
  console.log(`         VERIFICATION SUMMARY`);
  console.log(`========================================`);

  if (runComponents) {
    console.log(`\nComponents (${compResults.length}):`);
    console.log(`  CURRENT:         ${compCurrent}`);
    if (compUnreg.length > 0)
      console.log(`  NOT REGISTERED:  ${compUnreg.length}`);
    if (compErrors.length > 0)
      console.log(`  ERROR:           ${compErrors.length}`);
  }

  if (runSystems) {
    console.log(`\nSystems (${sysResults.length}):`);
    console.log(`  CURRENT:         ${sysCurrent}  (bytecode matches artifact)`);
    if (sysStale.length > 0)
      console.log(`  STALE:           ${sysStale.length}  (bytecode differs, needs redeploy)`);
    if (sysUnreg.length > 0)
      console.log(`  NOT REGISTERED:  ${sysUnreg.length}`);
    if (sysNoArt.length > 0)
      console.log(`  NO ARTIFACT:     ${sysNoArt.length}  (registered but can't verify bytecode)`);
    if (sysErrors.length > 0)
      console.log(`  ERROR:           ${sysErrors.length}`);
  }

  if (runState) {
    console.log(`\nWorld State (${stateResults.length} entries):`);
    console.log(`  CURRENT:  ${wsCurrent.length}  (In Game + on-chain)`);
    if (wsStale.length > 0)
      console.log(`  STALE:    ${wsStale.length}  (needs update on-chain)`);
    if (wsMissing.length > 0)
      console.log(`  MISSING:  ${wsMissing.length}  (should be on-chain but isn't)`);
    if (wsPending.length > 0)
      console.log(`  PENDING:  ${wsPending.length}  (not yet deployed, expected)`);
    if (wsErrors.length > 0)
      console.log(`  ERROR:    ${wsErrors.length}  (RPC or component errors)`);
  }

  // Detailed failure lists
  const libResults = results.filter((r) => r.category === 'Library');
  const libStale = libResults.filter((r) => r.state === 'STALE');

  const hasIssues =
    compUnreg.length > 0 || compErrors.length > 0 || sysStale.length > 0 || sysUnreg.length > 0 || sysNoArt.length > 0 || sysErrors.length > 0 ||
    wsStale.length > 0 || wsMissing.length > 0 || wsErrors.length > 0;

  if (sysStale.length > 0) {
    console.log(`\nSTALE SYSTEMS (needs redeploy):`);
    for (const r of sysStale) {
      console.log(`  ${r.name}  (${r.detail})`);
    }
  }

  if (sysUnreg.length > 0) {
    console.log(`\nUNREGISTERED SYSTEMS:`);
    for (const r of sysUnreg) {
      console.log(`  ${r.name}`);
    }
  }

  if (sysNoArt.length > 0) {
    console.log(`\nNO ARTIFACT (cannot verify bytecode):`);
    for (const r of sysNoArt) {
      console.log(`  ${r.name}`);
    }
  }

  if (compUnreg.length > 0) {
    console.log(`\nUNREGISTERED COMPONENTS:`);
    for (const r of compUnreg) {
      console.log(`  ${r.name}`);
    }
  }

  if (compErrors.length > 0) {
    console.log(`\nCOMPONENT ERRORS:`);
    for (const r of compErrors) {
      console.log(`  ${r.name}  ${r.detail}`);
    }
  }

  if (wsStale.length > 0) {
    console.log(`\nSTALE WORLD STATE (needs world:state update):`);
    for (const r of wsStale) {
      console.log(`  ${r.category}: ${r.name}  [${r.status}]`);
    }
  }

  if (wsMissing.length > 0) {
    console.log(`\nMISSING WORLD STATE (should be deployed but not found):`);
    // Group by category for compactness
    const grouped = new Map<string, string[]>();
    for (const r of wsMissing) {
      if (!grouped.has(r.category)) grouped.set(r.category, []);
      grouped.get(r.category)!.push(r.name);
    }
    for (const [cat, items] of grouped) {
      console.log(`  ${cat} (${items.length}):`);
      for (const item of items) {
        console.log(`    ${item}`);
      }
    }
  }

  if (wsPending.length > 0) {
    console.log(`\nPENDING DEPLOY (${wsPending.length} entries):`);
    const grouped = new Map<string, string[]>();
    for (const r of wsPending) {
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
  console.log(`\nRESULT: ${isCurrent ? 'CURRENT' : 'OUT OF SYNC'}\n`);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

///////////////
// INTERNAL

// Strip CBOR-encoded metadata appended by Solidity compiler
// Last 2 bytes of bytecode encode the metadata length
function stripMetadata(bytecode: string): string {
  const hex = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
  if (hex.length < 4) return hex;
  const metaLen = parseInt(hex.slice(-4), 16);
  const stripLen = (metaLen + 2) * 2; // convert to hex chars
  if (stripLen >= hex.length || metaLen > 1000) return hex; // sanity check
  return hex.slice(0, hex.length - stripLen);
}

// Zero out immutable values and library addresses baked into bytecode
// These differ between deployments but don't represent code changes
function maskRefs(hexNoPrefix: string, imm: any, links: any): string {
  let buf = hexNoPrefix.toLowerCase();
  for (const positions of Object.values(imm) as any[]) {
    for (const { start, length } of positions) {
      const s = start * 2;
      if (s + length * 2 <= buf.length) {
        buf = buf.substring(0, s) + '00'.repeat(length) + buf.substring(s + length * 2);
      }
    }
  }
  for (const libs of Object.values(links) as any[]) {
    for (const positions of Object.values(libs) as any[]) {
      for (const { start, length } of positions) {
        const s = start * 2;
        if (s + length * 2 <= buf.length) {
          buf = buf.substring(0, s) + '00'.repeat(length) + buf.substring(s + length * 2);
        }
      }
    }
  }
  return buf;
}

// Compare on-chain runtime bytecode with compiled artifact bytecode
// Strips metadata and masks immutable/library refs before comparing
function compareBytecode(onChainCode: string, compiledCode: string, immutableRefs: any, linkRefs: any): boolean {
  const strippedOnChain = stripMetadata(onChainCode);
  const strippedCompiled = stripMetadata(compiledCode);
  if (strippedOnChain.length !== strippedCompiled.length) return false;
  const maskedOnChain = maskRefs(strippedOnChain, immutableRefs, linkRefs);
  const maskedCompiled = maskRefs(strippedCompiled, immutableRefs, linkRefs);
  return maskedOnChain === maskedCompiled;
}

// Compare a deployed library's runtime code with its compiled artifact.
// Libraries additionally need CALL PROTECTION masked: solc compiles
// `PUSH20 0x00..00; ADDRESS; EQ ..` as the first instructions and deployment
// substitutes the library's own address, so bytes [1..21) always differ from
// the artifact. Nested link refs (libraries linking libraries) are masked via
// the library's own artifact linkReferences.
function compareLibBytecode(onChainCode: string, compiledCode: string, libLinkRefs: any): boolean {
  const strippedOnChain = stripMetadata(onChainCode);
  const strippedCompiled = stripMetadata(compiledCode);
  if (strippedOnChain.length !== strippedCompiled.length) return false;
  const maskProtection = (hex: string) =>
    hex.length >= 42 && hex.slice(0, 2) === '73' ? hex.slice(0, 2) + '00'.repeat(20) + hex.slice(42) : hex;
  const maskedOnChain = maskRefs(maskProtection(strippedOnChain.toLowerCase()), {}, libLinkRefs);
  const maskedCompiled = maskRefs(maskProtection(strippedCompiled.toLowerCase()), {}, libLinkRefs);
  return maskedOnChain === maskedCompiled;
}

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
