const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { Contract, ethers, Provider, Signer } from 'ethers';
import execa from 'execa';
import { ignoreSolcErrors } from '../utils';
import { getSystemAddr } from '../utils/addresses';
import { getSigner } from '../utils/chain';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --weth <address> --feeRecipient <address> [--feeRate <pct>] [--maxOrders <n>]')
  .option('weth', { type: 'string', demandOption: false, describe: 'WETH / native ERC-20 address' })
  .option('feeRecipient', {
    type: 'string',
    demandOption: false,
    describe: 'Fee recipient address',
  })
  .option('feeRate', {
    type: 'number',
    default: 0,
    describe: 'Fee rate in basis points (e.g. 250 = 2.50%)',
  })
  .option('purchaseCooldown', {
    type: 'number',
    default: 3600,
    describe: 'cooldown (seconds) on Kami market purchases and transfers',
  })
  .option('forge', { type: 'string', describe: 'Extra forge flags' })
  .parse();

// ABIs (only what we need)
const VaultABI = [
  'function WETH() view returns (address)',
  'function KAMI721() view returns (address)',
  'function owner() view returns (address)',
  'function authorizeCaller(address caller) external',
  'function unauthorizeCaller(address caller) external',
  'function transferOwnership(address newOwner) external',
];

const RegistryABI = [
  'function setVault(address vault) external',
  'function setEnabled(bool enabled) external',
  'function setFeeRecipient(address recipient) external',
  'function setFeeRate(uint32[8] rate) external',
  'function setPurchaseCooldown(uint256 cooldown) external',
];

const ValueCompABI = ['function get(uint256 entity) view returns (uint256)'];

// marketplace systems that need vault authorization (not the registry)
const MARKET_SYSTEMS = [
  'KamiMarketListSystem',
  'KamiMarketBuySystem',
  'KamiMarketOfferSystem',
  'KamiMarketAcceptOfferSystem',
  'KamiMarketCancelSystem',
];

// full run of vault deployment, system authorization, and config setup
async function run() {
  const signer = await getSigner();
  const deployer = await signer.getAddress();
  const provider = signer.provider!;

  console.log(`\nDeployer: ${deployer}`);
  console.log(`WETH:     ${argv.weth}`);

  // get Kami721 address from world config
  const world = await getWorld(provider);
  const compsAddress = await world.components();
  const valueCompAddress = await getComponentAddress(provider, compsAddress, 'component.value');
  const valueComp = new ethers.Contract(valueCompAddress, ValueCompABI, provider);
  const configID = ethers.solidityPackedKeccak256(['string'], ['is.configKAMI721_ADDRESS']);
  const kami721Raw = await valueComp.get(configID);
  const kami721 = ethers.getAddress('0x' + kami721Raw.toString(16).padStart(40, '0'));

  // deploy the vault with the world-set Kami721 address
  // TODO: include option to deploy new vault (very uncommon)
  // const vaultAddr = await deploy(argv.weth, kami721, deployer, argv.forge);

  // pulled from onchain. maybe better by script it but unclear how
  const vaultAddr = '0x54fE9bFD7B267D7d4f1C7f5C9b221B1aba67035c';

  // await transferOwnership(signer, vaultAddr);
  await authorizeSystems(signer, vaultAddr);
  // await configureMarketplace(signer);

  console.log('\n--- Done ---');
  console.log(`Vault:         ${vaultAddr}`);
  console.log(`WETH:          ${argv.weth}`);
  console.log(`Kami721:        ${kami721}`);
  console.log(`Owner:          ${deployer}`);
  console.log(`Fee Recipient:  ${argv.feeRecipient}`);
  console.log(`Fee Rate:       ${argv.feeRate} bps (${argv.feeRate / 100}%)`);
  console.log(`Max Orders:     ${argv.maxOrders > 0 ? argv.maxOrders : 'unlimited'}`);
}

async function transferOwnership(signer: Signer, vaultAddr: string) {
  console.log('\n--- Transfer Ownership ---');
  const vault = new ethers.Contract(vaultAddr, VaultABI, signer);
  const newOwner = '0x0FaE7649bC425c7502446d0C5A9e7436B713AF25';
  const tx = await vault.transferOwnership(newOwner);
  await tx.wait();
  console.log(`Transfer Ownership tx: ${tx.hash}`);
}

// authorize systems to write to vault
async function authorizeSystems(signer: Signer, vaultAddr: string) {
  console.log('\n--- Authorizing marketplace systems ---');
  const vault = new ethers.Contract(vaultAddr, VaultABI, signer);
  for (const name of MARKET_SYSTEMS) {
    const systemCommand = name.replace('KamiMarket', '').replace('System', '').toLowerCase();
    const systemID = `system.kamimarket.${systemCommand}`;
    const systemAddr = await getSystemAddr(systemID);
    console.log(systemID, systemAddr);
    const tx = await vault.authorizeCaller(systemAddr);
    await tx.wait();
    console.log(`  ${name} (${systemAddr}) -> authorized (${tx.hash})`);
  }
}

// unauthorize system from the vault
async function unauthorizeSystem(signer: Signer, vaultAddr: string, systemID: string) {
  console.log('\n--- Unauthorizing system ---');
  const vault = new ethers.Contract(vaultAddr, VaultABI, signer);
  const systemAddr = await getSystemAddr(systemID);
  console.log(systemID, systemAddr);
  const tx = await vault.unauthorizeCaller(systemAddr);
  await tx.wait();
  console.log(`   (${systemAddr}) -> unauthorized (${tx.hash})`);
}

// configure marketplace settings
// optionally update the vault address by passing one in
async function configureMarketplace(signer: Signer, vaultAddr?: string) {
  console.log('\n--- Configuring marketplace ---');
  const registryAddr = await getSystemAddr('system.kamimarket.registry');
  const registry = new ethers.Contract(registryAddr, RegistryABI, signer);

  if (vaultAddr) {
    const tx1 = await registry.setVault(vaultAddr);
    await tx1.wait();
    console.log(`setVault tx: ${tx1.hash}`);
  }

  if (argv.feeRecipient) {
    const tx2 = await registry.setFeeRecipient(argv.feeRecipient);
    await tx2.wait();
    console.log(`setFeeRecipient(${argv.feeRecipient}) tx: ${tx2.hash}`);
  }

  // fee rate: [precision, numerator] — basis points means precision=4
  if (argv.feeRate) {
    const feeRate: number[] = [4, argv.feeRate, 0, 0, 0, 0, 0, 0];
    const tx3 = await registry.setFeeRate(feeRate);
    await tx3.wait();
    console.log(`setFeeRate(${argv.feeRate} bps = ${argv.feeRate / 100}%) tx: ${tx3.hash}`);
  }

  if (argv.purchaseCooldown) {
    const tx4 = await registry.setPurchaseCooldown(argv.purchaseCooldown);
    await tx4.wait();
    console.log(`setPurchaseCooldown(${argv.purchaseCooldown}) tx: ${tx4.hash}`);
  }

  // may need to be redefined with nullish value
  if (argv.enabled) {
    const tx5 = await registry.setEnabled(true);
    await tx5.wait();
    console.log(`setEnabled(true) tx: ${tx5.hash}`);
  }
}

// deploy vault via forge create
async function deploy(
  weth: string,
  kami721: string,
  owner: string,
  forge?: string
): Promise<string> {
  console.log('\n--- Deploying KamiMarketVault ---');
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
    ...(forge?.toString().split(/,| /) || []),
    'src/tokens/KamiMarketVault.sol:KamiMarketVault',
    '--constructor-args',
    weth,
    kami721,
    owner,
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
  const vaultAddr = match[1];
  console.log(`Vault deployed: ${vaultAddr}`);
  return vaultAddr;
}

// retrieve the address of a component by its key
// TODO: move to shared utils for deployment commands/scripts
async function getComponentAddress(
  provider: ethers.Provider,
  compsRegistryAddr: string,
  key: string
): Promise<string> {
  const registry = new ethers.Contract(
    compsRegistryAddr,
    ['function getEntitiesWithValue(uint256 value) view returns (uint256[])'],
    provider
  );
  const valueCompID = ethers.solidityPackedKeccak256(['string'], [key]);
  const entities: bigint[] = await registry.getEntitiesWithValue(valueCompID);
  if (entities.length === 0) throw new Error('Value component not found in world');
  return ethers.getAddress('0x' + entities[0].toString(16).padStart(40, '0'));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

// retrieve the world contract from environment file
// TODO:
//  - add more abi paths
//  - move to shared utils and configure as singleton
async function getWorld(provider: Provider): Promise<Contract> {
  const world = new ethers.Contract(
    process.env.WORLD!,
    ['function components() view returns (address)'],
    provider
  );
  return world;
}
