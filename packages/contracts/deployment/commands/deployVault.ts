const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ethers } from 'ethers';
import execa from 'execa';
import fs from 'fs';
import path from 'path';
import { ignoreSolcErrors } from '../utils';
import { getSystemAddr } from '../utils/addresses';
import { getProvider, getSigner } from '../utils/chain';
import {
  VAULT_EXPECTED_SYSTEMS,
  VaultABI,
  getVaultSystemAddresses,
  resolveVault,
} from '../utils/vault';

// KamiMarketVault grant lifecycle. The vault is a persistent relay holding
// every marketplace user's WETH/Kami721 approvals; it outlives system upgrades
// and only its authorizedCallers can move those funds. Two standing rules:
//
//   1. deprecate() on a retired system is EVENT-ONLY — it does not disable the
//      contract. For anything holding a vault grant, REVOCATION is the disable
//      step. A market-system redeploy that skips it leaves a live, authorized,
//      fund-moving contract behind (exactly the stale Gen1/Gen2 grants found
//      and revoked in the 2026-07-20 audit).
//   2. Replacing the vault itself invalidates every user's approvals (they
//      approve the vault ADDRESS) and forces a re-approval campaign — never do
//      it for convenience; see --deploy-new.
//
// Standard flow around any market-system redeploy:
//   --snapshot                     (before: record current grant state)
//   pnpm deploy:<env>:partial ...  (the system redeploy)
//   --sync                         (after: authorize new addrs, revoke replaced)
//   scripts/ops/vault-audit.sh <env> -- --archive   (verify, seconds)
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [--status|--snapshot|--sync|--authorize|--configure|--deploy-new] [flags]')
  .option('status', { type: 'boolean', default: false, describe: 'read-only grant table (default action)' })
  .option('snapshot', { type: 'boolean', default: false, describe: 'record current registry addrs + grants to a file (run BEFORE a market redeploy)' })
  .option('sync', { type: 'boolean', default: false, describe: 'authorize current systems, revoke replaced ones from the snapshot (run AFTER a redeploy)' })
  .option('authorize', { type: 'boolean', default: false, describe: 'authorize current systems only (no revocation; prefer --sync)' })
  .option('configure', { type: 'boolean', default: false, describe: 'set marketplace registry config (fee, cooldown, enabled)' })
  .option('deploy-new', { type: 'boolean', default: false, describe: 'deploy a NEW vault contract (invalidates ALL user approvals — see header note)' })
  .option('vault', { type: 'string', describe: 'vault address (default: world config KAMI_MARKET_VAULT)' })
  .option('weth', { type: 'string', describe: 'deploy-new: WETH / native ERC-20 address' })
  .option('owner', { type: 'string', describe: 'deploy-new: final vault owner (default: deployer)' })
  .option('feeRecipient', { type: 'string', describe: 'configure: fee recipient address' })
  .option('feeRate', { type: 'number', describe: 'configure: fee rate in basis points (e.g. 250 = 2.50%)' })
  .option('purchaseCooldown', { type: 'number', describe: 'configure: cooldown (seconds) on purchases and transfers' })
  .option('enabled', { type: 'boolean', describe: 'configure: enable/disable the marketplace' })
  .option('forge', { type: 'string', describe: 'deploy-new: extra forge flags' })
  .parse();

const RegistryABI = [
  'function setVault(address vault) external',
  'function setEnabled(bool enabled) external',
  'function setFeeRecipient(address recipient) external',
  'function setFeeRate(uint32[8] rate) external',
  'function setPurchaseCooldown(uint256 cooldown) external',
];

// per-env so a test snapshot can never drive prod revocations
const snapshotPath = () =>
  path.resolve(__dirname, `../../.vault-grants.${process.env.NODE_ENV}.json`);

type GrantSnapshot = {
  world: string;
  vault: string;
  block: number;
  systems: Record<string, { addr: string; authorized: boolean }>;
};

async function run() {
  // deploy-new precedes vault resolution: a fresh world has no vault config yet
  if (argv.deployNew) return deployNew();

  const provider = getProvider();
  const vaultAddr = await resolveVault(provider, argv.vault);
  const vault = new ethers.Contract(vaultAddr, VaultABI, provider);

  const [owner, weth, kami721] = await Promise.all([vault.owner(), vault.WETH(), vault.KAMI721()]);
  console.log(`vault:   ${vaultAddr}`);
  console.log(`owner:   ${owner}`);
  console.log(`WETH:    ${weth}`);
  console.log(`KAMI721: ${kami721}`);

  if (argv.snapshot) return snapshot(vault, vaultAddr);
  if (argv.sync) return sync(vault, vaultAddr, true);
  if (argv.authorize) return sync(vault, vaultAddr, false);
  // setVault only fires on an explicit --vault (repointing is deliberate)
  if (argv.configure) return configureMarketplace(argv.vault ? vaultAddr : undefined);
  return status(vault);
}

// read-only grant table for the vault-relevant systems
async function status(vault: ethers.Contract) {
  console.log('\n--- Grant status ---');
  const systems = await getVaultSystemAddresses(getProvider());
  for (const [sysID, addr] of systems) {
    if (addr === ethers.ZeroAddress) {
      console.log(`  ${sysID} NOT REGISTERED`);
      continue;
    }
    const auth = await vault.authorizedCallers(addr);
    const expected = VAULT_EXPECTED_SYSTEMS.includes(sysID);
    const flag = auth === expected ? 'ok  ' : 'FAIL';
    console.log(`  ${flag} ${sysID} ${addr} authorized=${auth} (expected ${expected})`);
  }
  console.log('\nread-only. use --snapshot/--sync around redeploys, --authorize for grants only.');
}

// record the current registry addresses + grant state (pre-redeploy baseline)
async function snapshot(vault: ethers.Contract, vaultAddr: string) {
  const provider = getProvider();
  const systems = await getVaultSystemAddresses(provider);
  const snap: GrantSnapshot = {
    world: process.env.WORLD!,
    vault: vaultAddr,
    block: await provider.getBlockNumber(),
    systems: {},
  };
  for (const [sysID, addr] of systems) {
    if (addr === ethers.ZeroAddress) continue;
    snap.systems[sysID] = { addr, authorized: await vault.authorizedCallers(addr) };
  }
  fs.writeFileSync(snapshotPath(), JSON.stringify(snap, null, 2) + '\n');
  console.log(`\nsnapshot of ${Object.keys(snap.systems).length} systems at block ${snap.block}`);
  console.log(`written to ${snapshotPath()}`);
}

// authorize every current expected system that lacks a grant; with a snapshot
// (revokeReplaced), also unauthorize any snapshotted address that has been
// replaced in the registry but still holds a grant. Idempotent: a clean state
// sends zero transactions, so the signer is only created when work exists.
async function sync(vault: ethers.Contract, vaultAddr: string, revokeReplaced: boolean) {
  const provider = getProvider();
  const systems = await getVaultSystemAddresses(provider);

  const toAuthorize: { sysID: string; addr: string }[] = [];
  for (const sysID of VAULT_EXPECTED_SYSTEMS) {
    const addr = systems.get(sysID)!;
    if (addr === ethers.ZeroAddress) {
      console.log(`  skip ${sysID}: not registered`);
      continue;
    }
    if (!(await vault.authorizedCallers(addr))) toAuthorize.push({ sysID, addr });
  }

  const toRevoke: { sysID: string; addr: string }[] = [];
  if (revokeReplaced) {
    if (!fs.existsSync(snapshotPath())) {
      console.log(`\nno snapshot at ${snapshotPath()} — skipping revocation of replaced systems.`);
      console.log('run --snapshot before the redeploy next time, or clean up via vault-audit --revoke-stale.');
    } else {
      const snap: GrantSnapshot = JSON.parse(fs.readFileSync(snapshotPath(), 'utf8'));
      if (snap.vault.toLowerCase() !== vaultAddr.toLowerCase() || snap.world !== process.env.WORLD) {
        throw new Error(`snapshot at ${snapshotPath()} is for another world/vault — refusing to revoke from it`);
      }
      for (const [sysID, prev] of Object.entries(snap.systems)) {
        const current = systems.get(sysID);
        if (!current || current.toLowerCase() === prev.addr.toLowerCase()) continue; // not replaced
        if (await vault.authorizedCallers(prev.addr)) toRevoke.push({ sysID, addr: prev.addr });
      }
    }
  }

  if (toAuthorize.length === 0 && toRevoke.length === 0) {
    console.log('\nnothing to do: grants already match the registry.');
    return;
  }

  const signer = await getSigner();
  const signerAddr = await signer.getAddress();
  const owner: string = await vault.owner();
  if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
    throw new Error(`signer ${signerAddr} does not own the vault (owner ${owner})`);
  }
  const vaultRW = new ethers.Contract(vaultAddr, VaultABI, signer);

  for (const { sysID, addr } of toAuthorize) {
    const tx = await vaultRW.authorizeCaller(addr);
    const receipt = await tx.wait();
    console.log(`  authorizeCaller ${sysID} ${addr} -> ${tx.hash} status=${receipt?.status}`);
  }
  for (const { sysID, addr } of toRevoke) {
    const tx = await vaultRW.unauthorizeCaller(addr);
    const receipt = await tx.wait();
    console.log(`  unauthorizeCaller ${sysID} (replaced) ${addr} -> ${tx.hash} status=${receipt?.status}`);
  }
  console.log('\nverify with: scripts/ops/vault-audit.sh <env> -- --archive');
}

// configure marketplace settings on the registry system
async function configureMarketplace(vaultAddr?: string) {
  const signer = await getSigner();
  console.log('\n--- Configuring marketplace ---');
  const registryAddr = await getSystemAddr('system.kamimarket.registry');
  const registry = new ethers.Contract(registryAddr, RegistryABI, signer);

  if (vaultAddr) {
    const tx = await registry.setVault(vaultAddr);
    await tx.wait();
    console.log(`setVault(${vaultAddr}) tx: ${tx.hash}`);
  }
  if (argv.feeRecipient) {
    const tx = await registry.setFeeRecipient(argv.feeRecipient);
    await tx.wait();
    console.log(`setFeeRecipient(${argv.feeRecipient}) tx: ${tx.hash}`);
  }
  if (argv.feeRate !== undefined) {
    // fee rate: [precision, numerator] — basis points means precision=4
    const feeRate: number[] = [4, argv.feeRate, 0, 0, 0, 0, 0, 0];
    const tx = await registry.setFeeRate(feeRate);
    await tx.wait();
    console.log(`setFeeRate(${argv.feeRate} bps = ${argv.feeRate / 100}%) tx: ${tx.hash}`);
  }
  if (argv.purchaseCooldown !== undefined) {
    const tx = await registry.setPurchaseCooldown(argv.purchaseCooldown);
    await tx.wait();
    console.log(`setPurchaseCooldown(${argv.purchaseCooldown}) tx: ${tx.hash}`);
  }
  if (argv.enabled !== undefined) {
    const tx = await registry.setEnabled(argv.enabled);
    await tx.wait();
    console.log(`setEnabled(${argv.enabled}) tx: ${tx.hash}`);
  }
}

// deploy a NEW vault. This is a migration, not an upgrade: users approve the
// vault ADDRESS, so a new vault starts with zero approvals and the marketplace
// is dead until users re-approve. Requires setVault on the registry + fresh
// grants (--sync) + a user re-approval campaign. Reach for this only when a
// vault replacement is genuinely forced.
async function deployNew() {
  if (!argv.weth) throw new Error('--deploy-new requires --weth');
  const signer = await getSigner();
  const deployer = await signer.getAddress();

  // Kami721 comes from world config, same source the game reads
  const provider = getProvider();
  const world = new ethers.Contract(
    process.env.WORLD!,
    ['function components() view returns (address)'],
    provider
  );
  const compsAddr = await world.components();
  const registry = new ethers.Contract(
    compsAddr,
    ['function getEntitiesWithValue(uint256 value) view returns (uint256[])'],
    provider
  );
  const valueCompID = ethers.solidityPackedKeccak256(['string'], ['component.value']);
  const entities: bigint[] = await registry.getEntitiesWithValue(valueCompID);
  if (entities.length === 0) throw new Error('value component not found in world');
  const valueCompAddr = ethers.getAddress('0x' + entities[0].toString(16).padStart(40, '0'));
  const valueComp = new ethers.Contract(
    valueCompAddr,
    ['function get(uint256 entity) view returns (uint256)'],
    provider
  );
  const configID = ethers.solidityPackedKeccak256(['string'], ['is.configKAMI721_ADDRESS']);
  const kami721Raw: bigint = await valueComp.get(configID);
  const kami721 = ethers.getAddress('0x' + kami721Raw.toString(16).padStart(40, '0'));

  console.log('\n--- Deploying KamiMarketVault ---');
  console.log('WARNING: a new vault holds ZERO user approvals; the marketplace is');
  console.log('broken until setVault + --sync + every user re-approves. Continue only');
  console.log('if this replacement is planned.');
  const args = [
    'create',
    '--rpc-url',
    process.env.RPC!,
    '--private-key',
    process.env.PRIV_KEY!,
    '--broadcast',
    '--skip',
    'test',
    ...ignoreSolcErrors,
    ...(argv.forge?.toString().split(/,| /) || []),
    'src/tokens/KamiMarketVault.sol:KamiMarketVault',
    '--constructor-args',
    argv.weth,
    kami721,
    argv.owner ?? deployer,
  ];

  const child = execa('forge', args, { stdio: ['inherit', 'pipe', 'pipe'] });
  let stdout = '';
  child.stdout?.on('data', (data) => {
    const str = data.toString();
    stdout += str;
    console.log(str);
  });
  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  await child;

  const match = stdout.match(/Deployed to:\s+(0x[0-9a-fA-F]{40})/);
  if (!match) throw new Error('failed to parse deployed vault address from forge output');
  const newVault = match[1];
  console.log(`\nvault deployed: ${newVault}`);
  console.log('next: registry setVault (--configure --vault), then --sync, then user re-approvals.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
