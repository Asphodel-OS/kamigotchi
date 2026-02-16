const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ethers } from 'ethers';
import execa from 'execa';
import { getSystemAddr } from '../utils/addresses';
import { getSigner } from '../utils/chain';
import { ignoreSolcErrors } from '../utils';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --weth <address>')
  .option('weth', { type: 'string', demandOption: true, describe: 'WETH / native ERC-20 address' })
  .option('forge', { type: 'string', describe: 'Extra forge flags' })
  .parse();

// ABIs (only what we need)
const VaultABI = [
  'function authorizeCaller(address caller) external',
  'function WETH() view returns (address)',
  'function KAMI721() view returns (address)',
  'function owner() view returns (address)',
];

const RegistryABI = ['function setVault(address vault) external'];

const ValueCompABI = ['function get(uint256 entity) view returns (uint256)'];

// marketplace systems that need vault authorization (not the registry)
const MARKET_SYSTEMS = [
  'KamiMarketListSystem',
  'KamiMarketBuySystem',
  'KamiMarketOfferSystem',
  'KamiMarketAcceptOfferSystem',
  'KamiMarketCancelSystem',
];

async function run() {
  const signer = await getSigner();
  const deployer = await signer.getAddress();

  console.log(`\nDeployer: ${deployer}`);
  console.log(`WETH:     ${argv.weth}`);

  // 1. Get Kami721 address from world config
  console.log('\n--- Fetching Kami721 address from world config ---');
  const provider = signer.provider!;
  const world = new ethers.Contract(process.env.WORLD!, ['function components() view returns (address)'], provider);
  const compsRegistryAddr = await world.components();

  // LibConfig.genID("KAMI721_ADDRESS") = keccak256(abi.encodePacked("is.config", "KAMI721_ADDRESS"))
  const configID = ethers.solidityPackedKeccak256(['string'], ['is.configKAMI721_ADDRESS']);

  const valueCompAddr = await getValueCompAddr(provider, compsRegistryAddr);
  const valueComp = new ethers.Contract(valueCompAddr, ValueCompABI, provider);
  const kami721Raw = await valueComp.get(configID);
  const kami721 = ethers.getAddress('0x' + kami721Raw.toString(16).padStart(40, '0'));
  console.log(`Kami721:  ${kami721}`);

  // 2. Deploy vault via forge create
  console.log('\n--- Deploying KamiMarketVault ---');
  const vaultAddr = await deployVault(argv.weth, kami721, deployer, argv.forge);
  console.log(`Vault deployed: ${vaultAddr}`);

  // 3. Set vault in registry system
  console.log('\n--- Setting vault in _KamiMarketRegistrySystem ---');
  const registryAddr = await getSystemAddr('system.kamimarket.registry');
  const registry = new ethers.Contract(registryAddr, RegistryABI, signer);
  const tx1 = await registry.setVault(vaultAddr);
  await tx1.wait();
  console.log(`setVault tx: ${tx1.hash}`);

  // 4. Authorize marketplace systems on vault
  console.log('\n--- Authorizing marketplace systems ---');
  const vault = new ethers.Contract(vaultAddr, VaultABI, signer);
  for (const name of MARKET_SYSTEMS) {
    const systemID = `system.kamimarket.${name.replace('KamiMarket', '').replace('System', '').toLowerCase()}`;
    const systemAddr = await getSystemAddr(systemID);
    const tx = await vault.authorizeCaller(systemAddr);
    await tx.wait();
    console.log(`  ${name} (${systemAddr}) -> authorized (${tx.hash})`);
  }

  console.log('\n--- Done ---');
  console.log(`Vault:    ${vaultAddr}`);
  console.log(`WETH:     ${argv.weth}`);
  console.log(`Kami721:  ${kami721}`);
  console.log(`Owner:    ${deployer}`);
}

async function deployVault(weth: string, kami721: string, owner: string, forge?: string): Promise<string> {
  const args = [
    'create',
    '--rpc-url', process.env.RPC!,
    '--private-key', process.env.PRIV_KEY!,
    '--broadcast',
    '--skip', 'test',
    ...ignoreSolcErrors,
    ...(forge?.toString().split(/,| /) || []),
    'src/tokens/KamiMarketVault.sol:KamiMarketVault',
    '--constructor-args', weth, kami721, owner,
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

  // parse "Deployed to: 0x..."
  const match = stdout.match(/Deployed to:\s+(0x[0-9a-fA-F]{40})/);
  if (!match) throw new Error('Failed to parse deployed vault address from forge output');
  return match[1];
}

async function getValueCompAddr(provider: ethers.Provider, compsRegistryAddr: string): Promise<string> {
  const registry = new ethers.Contract(compsRegistryAddr, [
    'function getEntitiesWithValue(uint256 value) view returns (uint256[])',
  ], provider);
  const valueCompID = ethers.solidityPackedKeccak256(['string'], ['solecs.component.Value']);
  const entities: bigint[] = await registry.getEntitiesWithValue(valueCompID);
  if (entities.length === 0) throw new Error('Value component not found in world');
  return ethers.getAddress('0x' + entities[0].toString(16).padStart(40, '0'));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
