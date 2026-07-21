const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ethers, JsonRpcProvider } from 'ethers';
import { getAddrByID } from '../utils/addresses';
import { getProvider, getSigner } from '../utils/chain';
import { WorldABI } from '../contracts/mappings/worldABIs';

// KamiMarketVault has no authorize/unauthorize events and the default yominet
// RPC prunes logs, so the authorizedCallers mapping cannot be enumerated from
// its own history. This audit finds candidate authorized addresses two ways:
//
//   --calls (most complete): reconstruct the vault's whole grant ledger. Read
//     the ownership history from OwnershipTransferred, then for each owner
//     enumerate its transactions to the vault (via nonce binary search on an
//     archive node) and replay every authorizeCaller/unauthorizeCaller in block
//     order. This is the only method that sees grants to non-system addresses
//     (EOAs, multisigs, helpers), since it reads the actual calls, not a guess.
//   --archive: read every system address ever written to the system registry
//     from the World's ComponentValueSet events. Fast, but only covers systems.
//   default (crawl): derive every CREATE address from the deploy keys' full
//     nonce ranges (system deploys are plain CREATEs) and probe each. Works
//     without an archive node but is slow and blind to grants made to any
//     address the audited keys never deployed — keep --deployers complete.
//
// Either way, an address that is authorized but is not a current market/vendor
// system is a stale grant. Pass --revoke-stale (with a signer that owns the
// vault) to unauthorizeCaller each one.
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [--calls|--archive] [--vault <addr>] [--deployers <csv>] [--revoke-stale]')
  .option('vault', { type: 'string', describe: 'vault address (default: world config KAMI_MARKET_VAULT)' })
  .option('calls', { type: 'boolean', default: false, describe: 'replay the ownership+call ledger (needs RPC_ARCHIVE) — most complete' })
  .option('archive', { type: 'boolean', default: false, describe: 'scan registry system history (needs RPC_ARCHIVE) — systems only' })
  .option('deployers', { type: 'string', describe: 'crawl mode: extra deployer EOAs to nonce-crawl, comma-separated' })
  .option('max-nonce', { type: 'number', describe: 'crawl mode: cap crawled nonces per deployer (default: full range)' })
  .option('from-block', { type: 'number', describe: 'calls mode: lower block bound (default: vault creation)' })
  .option('to-block', { type: 'number', describe: 'calls mode: upper block bound (default: latest)' })
  .option('revoke-stale', { type: 'boolean', default: false, describe: 'send unauthorizeCaller for each stale grant (needs owner PRIV_KEY)' })
  .parse();

// grant/revoke selectors (keccak256(sig)[:4]) — the vault emits no events, so
// its ledger is reconstructed by decoding these calls from its inbound txs.
const SEL_AUTHORIZE = '0x2c388d5d'; // authorizeCaller(address)
const SEL_UNAUTHORIZE = '0x4ac8c5ae'; // unauthorizeCaller(address)

const VaultABI = [
  'function owner() view returns (address)',
  'function WETH() view returns (address)',
  'function KAMI721() view returns (address)',
  'function authorizedCallers(address) view returns (bool)',
  'function unauthorizeCaller(address caller) external',
];
const ValueCompABI = ['function get(uint256 entity) view returns (uint256)'];

// World.ComponentValueSet(componentId, component, entity indexed, data)
const COMPONENT_VALUE_SET = 'ComponentValueSet(uint256,address,uint256,bytes)';

// systems expected to hold grants: everything calling getVault/transferWETH/
// transferKami (grep src/systems), i.e. the market systems authorized by
// deployVault.ts plus the newbie vendor. The registry must NOT hold one.
const EXPECTED_SYSTEMS = [
  'system.kamimarket.list',
  'system.kamimarket.buy',
  'system.kamimarket.offer',
  'system.kamimarket.acceptoffer',
  'system.kamimarket.cancel',
  'system.newbievendor.buy',
];
const UNEXPECTED_SYSTEMS = ['system.kamimarket.registry'];

const BATCH = 1000; // eth_calls in flight per slice (provider sub-batches them)

const toAddress = (v: bigint) => ethers.getAddress('0x' + v.toString(16).padStart(40, '0'));
const addrFromWord = (word: string) => ethers.getAddress('0x' + word.slice(-40));

function getArchiveProvider(): JsonRpcProvider {
  if (!process.env.RPC_ARCHIVE) throw new Error('this mode requires RPC_ARCHIVE in the env file');
  return new JsonRpcProvider(process.env.RPC_ARCHIVE);
}

// run async thunks with bounded concurrency, preserving input order
async function mapPool<T, R>(items: T[], limit: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function resolveVault(provider: JsonRpcProvider): Promise<string> {
  if (argv.vault) return ethers.getAddress(argv.vault);
  const world = new ethers.Contract(process.env.WORLD!, WorldABI, provider);
  const compsAddr = await world.components();
  const valueCompAddr = await getAddrByID(
    provider,
    compsAddr,
    ethers.solidityPackedKeccak256(['string'], ['component.value'])
  );
  const valueComp = new ethers.Contract(valueCompAddr, ValueCompABI, provider);
  const configID = ethers.solidityPackedKeccak256(['string'], ['is.configKAMI_MARKET_VAULT']);
  const raw: bigint = await valueComp.get(configID);
  if (raw === 0n) throw new Error('KAMI_MARKET_VAULT not set in world config; pass --vault');
  return toAddress(raw);
}

async function getSystemAddresses(provider: JsonRpcProvider): Promise<Map<string, string>> {
  const world = new ethers.Contract(process.env.WORLD!, WorldABI, provider);
  const sysRegAddr = await world.systems();
  const out = new Map<string, string>();
  for (const sysID of [...EXPECTED_SYSTEMS, ...UNEXPECTED_SYSTEMS]) {
    const id = ethers.solidityPackedKeccak256(['string'], [sysID]);
    const addr = await getAddrByID(provider, sysRegAddr, id);
    out.set(sysID, addr);
  }
  return out;
}

// check authorizedCallers for a batch of addresses; returns the authorized subset
async function checkAuthorized(vault: ethers.Contract, addrs: string[]): Promise<string[]> {
  const results = await Promise.all(addrs.map((a) => vault.authorizedCallers(a) as Promise<boolean>));
  return addrs.filter((_, i) => results[i]);
}

async function crawlDeployer(
  vault: ethers.Contract,
  provider: JsonRpcProvider,
  deployer: string
): Promise<string[]> {
  const nonce = await provider.getTransactionCount(deployer);
  const limit = argv.maxNonce ? Math.min(nonce, argv.maxNonce) : nonce;
  console.log(`\ncrawling ${deployer} — ${limit} nonces`);

  const authorized: string[] = [];
  for (let start = 0; start < limit; start += BATCH) {
    const slice: string[] = [];
    for (let n = start; n < Math.min(start + BATCH, limit); n++) {
      slice.push(ethers.getCreateAddress({ from: deployer, nonce: n }));
    }
    authorized.push(...(await checkAuthorized(vault, slice)));
    process.stdout.write(`\r  checked ${Math.min(start + BATCH, limit)}/${limit}`);
  }
  process.stdout.write('\n');
  return authorized;
}

// Archive mode: enumerate every system address ever written to the system
// registry via the World's ComponentValueSet events, then probe each against
// authorizedCallers. This is the exact historical system set — no derivation.
async function archiveScan(vault: ethers.Contract): Promise<string[]> {
  const provider = getArchiveProvider();
  const world = new ethers.Contract(process.env.WORLD!, WorldABI, provider);
  const sysRegAddr: string = await world.systems();

  // topic filter: ComponentValueSet with component == system registry (topic[2])
  const topics = [
    ethers.id(COMPONENT_VALUE_SET),
    null,
    ethers.zeroPadValue(sysRegAddr, 32),
  ];
  console.log(`\nreading system-registry history from archive (${sysRegAddr})`);
  const logs = await provider.getLogs({
    address: process.env.WORLD!,
    topics,
    fromBlock: 0,
    toBlock: 'latest',
  });

  // each event's data is abi-encoded bytes whose last 32 bytes hold the value
  // (the system's address as a uint256); collect the distinct set
  const seen = new Set<string>();
  for (const log of logs) {
    const tail = log.data.slice(-40);
    if (tail === '0'.repeat(40)) continue; // removals / zero writes
    seen.add(ethers.getAddress('0x' + tail));
  }
  console.log(`  ${logs.length} registry writes -> ${seen.size} distinct system addresses`);

  const all = [...seen];
  const authorized: string[] = [];
  for (let i = 0; i < all.length; i += BATCH) {
    authorized.push(...(await checkAuthorized(vault, all.slice(i, i + BATCH))));
  }
  return authorized;
}

// ---- calls mode: replay the vault's grant ledger from its inbound txs ----

type OwnerWindow = { owner: string; fromBlock: number; toBlock: number };
type VaultCall = { block: number; txIndex: number; grant: boolean; target: string; caller: string; hash: string };

// Ownership history from OwnershipTransferred(previous indexed, new indexed).
// Only the current owner's authorizeCaller succeeds, so each owner is only
// relevant within [its transfer block, the next transfer block).
async function ownershipWindows(provider: JsonRpcProvider, vaultAddr: string, latest: number): Promise<OwnerWindow[]> {
  const logs = await provider.getLogs({
    address: vaultAddr,
    topics: [ethers.id('OwnershipTransferred(address,address)')],
    fromBlock: 0,
    toBlock: 'latest',
  });
  logs.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);
  return logs.map((log, i) => ({
    owner: addrFromWord(log.topics[2]),
    fromBlock: log.blockNumber,
    toBlock: i + 1 < logs.length ? logs[i + 1].blockNumber : latest,
  }));
}

// Smallest block in [lo, hi] at which `owner` has sent > k txs — i.e. the block
// that mined the owner's nonce-k transaction. Assumes such a tx exists in range.
async function blockOfNonce(provider: JsonRpcProvider, owner: string, k: number, lo: number, hi: number): Promise<number> {
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const count = await provider.getTransactionCount(owner, mid);
    if (count > k) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// Every authorizeCaller/unauthorizeCaller call an owner sent to the vault in its
// window, located by binary-searching each nonce (no trace_filter on this node).
async function ownerVaultCalls(provider: JsonRpcProvider, w: OwnerWindow, vaultAddr: string): Promise<VaultCall[]> {
  const vault = vaultAddr.toLowerCase();
  const nStart = await provider.getTransactionCount(w.owner, w.fromBlock);
  const nEnd = await provider.getTransactionCount(w.owner, w.toBlock);
  const nonces = Array.from({ length: nEnd - nStart }, (_, i) => nStart + i);
  console.log(`  ${w.owner} — ${nonces.length} txs in [${w.fromBlock}, ${w.toBlock}]`);

  let done = 0;
  const found = await mapPool(nonces, 16, async (k) => {
    const blk = await blockOfNonce(provider, w.owner, k, w.fromBlock, w.toBlock);
    const block = await provider.getBlock(blk, true);
    const calls: VaultCall[] = [];
    for (const tx of block?.prefetchedTransactions ?? []) {
      if (tx.from.toLowerCase() !== w.owner.toLowerCase() || tx.nonce !== k) continue;
      if ((tx.to ?? '').toLowerCase() !== vault) continue;
      const sel = tx.data.slice(0, 10);
      if (sel !== SEL_AUTHORIZE && sel !== SEL_UNAUTHORIZE) continue;
      calls.push({ block: blk, txIndex: tx.index, grant: sel === SEL_AUTHORIZE, target: addrFromWord(tx.data.slice(10)), caller: w.owner, hash: tx.hash });
    }
    if (++done % 500 === 0) process.stdout.write(`\r    located ${done}/${nonces.length}`);
    return calls;
  });
  if (nonces.length >= 500) process.stdout.write('\n');
  return found.flat();
}

// Reconstruct the final authorized set by replaying every grant/revoke in order.
async function callsReplay(vaultAddr: string): Promise<{ authorized: Set<string>; ledger: VaultCall[] }> {
  const provider = getArchiveProvider();
  const latest = argv.toBlock ?? (await provider.getBlockNumber());
  console.log('\n--- Grant ledger replay (calls) ---');

  let windows = await ownershipWindows(provider, vaultAddr, latest);
  if (argv.fromBlock !== undefined || argv.toBlock !== undefined) {
    const lo = argv.fromBlock ?? 0;
    windows = windows
      .map((w) => ({ ...w, fromBlock: Math.max(w.fromBlock, lo), toBlock: Math.min(w.toBlock, latest) }))
      .filter((w) => w.fromBlock <= w.toBlock);
  }
  console.log(`owners: ${windows.map((w) => `${w.owner} [${w.fromBlock}-${w.toBlock}]`).join(', ')}`);

  const all: VaultCall[] = [];
  for (const w of windows) all.push(...(await ownerVaultCalls(provider, w, vaultAddr)));
  all.sort((a, b) => a.block - b.block || a.txIndex - b.txIndex);

  const authorized = new Set<string>();
  for (const c of all) {
    if (c.grant) authorized.add(c.target.toLowerCase());
    else authorized.delete(c.target.toLowerCase());
  }
  console.log(`  ${all.length} grant/revoke calls replayed -> ${authorized.size} currently authorized`);
  return { authorized: new Set([...authorized].map((a) => ethers.getAddress(a))), ledger: all };
}

// Revoke each stale grant. Uses the same PRIV_KEY signer as the deploy commands;
// the signer must own the vault or every unauthorizeCaller reverts.
async function revokeStale(vaultAddr: string, stale: string[]) {
  const signer = await getSigner();
  const vault = new ethers.Contract(vaultAddr, VaultABI, signer);
  const owner: string = await vault.owner();
  if (owner.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
    throw new Error(`signer ${await signer.getAddress()} does not own vault (owner ${owner})`);
  }
  console.log('\n--- Revoking stale grants ---');
  for (const addr of stale) {
    const tx = await vault.unauthorizeCaller(addr);
    const receipt = await tx.wait();
    console.log(`  unauthorizeCaller(${addr}) -> ${tx.hash} status=${receipt?.status}`);
  }
}

async function run() {
  const provider = getProvider() as JsonRpcProvider;
  const vaultAddr = await resolveVault(provider);
  const vault = new ethers.Contract(vaultAddr, VaultABI, provider);

  const [owner, weth, kami721] = await Promise.all([vault.owner(), vault.WETH(), vault.KAMI721()]);
  console.log(`vault:   ${vaultAddr}`);
  console.log(`owner:   ${owner}`);
  console.log(`WETH:    ${weth}`);
  console.log(`KAMI721: ${kami721}`);

  // 1. current systems from the live registry
  console.log('\n--- Current system grants ---');
  const systems = await getSystemAddresses(provider);
  const expectedAddrs = new Set<string>();
  let currentOk = true;
  for (const [sysID, addr] of systems) {
    const registered = addr !== ethers.ZeroAddress;
    const auth = registered ? await vault.authorizedCallers(addr) : false;
    const shouldBe = EXPECTED_SYSTEMS.includes(sysID);
    if (shouldBe) expectedAddrs.add(addr.toLowerCase());
    const ok = registered && auth === shouldBe;
    if (!ok) currentOk = false;
    const status = !registered
      ? 'NOT REGISTERED'
      : auth === shouldBe
        ? `authorized=${auth} (expected)`
        : `authorized=${auth} MISMATCH — expected ${shouldBe}`;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${sysID} ${addr} ${status}`);
  }

  // 2. stale grants: ledger replay (--calls), registry scan (--archive), or crawl
  const staleSet = new Set<string>();
  let coverageNote: string;
  if (argv.calls) {
    const { authorized, ledger } = await callsReplay(vaultAddr);
    // the replay is the ground truth for WHICH addresses were ever granted;
    // confirm each still reads true on-chain, then flag the non-expected ones
    const live = await mapPool([...authorized], BATCH, async (a) => ((await vault.authorizedCallers(a)) ? a : null));
    for (const a of live) {
      if (!a) continue;
      if (!expectedAddrs.has(a.toLowerCase())) staleSet.add(a);
    }
    const drift = ledger.length && authorized.size !== live.filter(Boolean).length;
    coverageNote =
      'replay of every authorizeCaller/unauthorizeCaller ever sent to the vault — ' +
      'covers grants to any address, not just systems' +
      (drift ? '\nWARNING: replay/live mismatch — a grant may have been made outside the scanned windows' : '');
  } else if (argv.archive) {
    console.log('\n--- Stale grant scan (archive) ---');
    const hits = await archiveScan(vault);
    for (const a of hits) if (!expectedAddrs.has(a.toLowerCase())) staleSet.add(a);
    coverageNote = 'scan covers every system address ever written to the registry (archive event history)';
  } else {
    console.log('\n--- Stale grant crawl ---');
    const deployers = new Set<string>([owner]);
    if (process.env.PRIV_KEY) deployers.add(new ethers.Wallet(process.env.PRIV_KEY).address);
    for (const d of (argv.deployers ?? '').split(',').filter(Boolean)) {
      deployers.add(ethers.getAddress(d.trim()));
    }
    for (const deployer of deployers) {
      const hits = await crawlDeployer(vault, provider, deployer);
      for (const a of hits) if (!expectedAddrs.has(a.toLowerCase())) staleSet.add(a);
    }
    coverageNote =
      'crawl covers CREATE addresses of: ' +
      [...deployers].join(', ') +
      '\ngrants to other addresses are not detectable (no events, pruned logs)';
  }
  const stale = [...staleSet];

  console.log('\n--- Result ---');
  if (stale.length === 0 && currentOk) {
    console.log('CLEAN: current systems match expectations; no stale grants found');
  } else {
    for (const a of stale) console.log(`STALE GRANT: ${a} is authorized but is not a current market/vendor system`);
    if (!currentOk) console.log('CURRENT-STATE MISMATCH: see grants above');
    process.exitCode = 1;
  }
  console.log(`\nnote: ${coverageNote}.`);

  if (argv.revokeStale && stale.length > 0) {
    await revokeStale(vaultAddr, stale);
    console.log('\nre-run the audit to confirm CLEAN.');
  } else if (argv.revokeStale) {
    console.log('\n--revoke-stale: nothing to revoke.');
  }
}

run();
