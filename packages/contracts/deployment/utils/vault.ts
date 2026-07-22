import { ethers, Provider } from 'ethers';

import { WorldABI } from '../contracts/mappings/worldABIs';
import { getAddrByID } from './addresses';

// Single source of truth for the KamiMarketVault grant surface, shared by the
// audit (vaultAudit.ts) and grant lifecycle management (deployVault.ts).
// Expected = every system that calls transferWETH/transferKami (the market
// systems plus the newbie vendor). The registry must NOT hold a grant.
export const VAULT_EXPECTED_SYSTEMS = [
  'system.kamimarket.list',
  'system.kamimarket.buy',
  'system.kamimarket.offer',
  'system.kamimarket.acceptoffer',
  'system.kamimarket.cancel',
  'system.newbievendor.buy',
];
export const VAULT_UNEXPECTED_SYSTEMS = ['system.kamimarket.registry'];

export const VaultABI = [
  'function owner() view returns (address)',
  'function WETH() view returns (address)',
  'function KAMI721() view returns (address)',
  'function authorizedCallers(address) view returns (bool)',
  'function authorizeCaller(address caller) external',
  'function unauthorizeCaller(address caller) external',
  'function transferOwnership(address newOwner) external',
];

const ValueCompABI = ['function get(uint256 entity) view returns (uint256)'];

export const toAddress = (v: bigint) => ethers.getAddress('0x' + v.toString(16).padStart(40, '0'));

// vault address from world config (KAMI_MARKET_VAULT), unless overridden
export async function resolveVault(provider: Provider, override?: string): Promise<string> {
  if (override) return ethers.getAddress(override);
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

// current registry address for every vault-relevant system id (zero if unregistered)
export async function getVaultSystemAddresses(provider: Provider): Promise<Map<string, string>> {
  const world = new ethers.Contract(process.env.WORLD!, WorldABI, provider);
  const sysRegAddr: string = await world.systems();
  const out = new Map<string, string>();
  for (const sysID of [...VAULT_EXPECTED_SYSTEMS, ...VAULT_UNEXPECTED_SYSTEMS]) {
    const id = ethers.solidityPackedKeccak256(['string'], [sysID]);
    out.set(sysID, await getAddrByID(provider, sysRegAddr, id));
  }
  return out;
}
