import { Wallet } from 'ethers';
import { SetupContractConfig } from '@latticexyz/std-client';
import { ExternalProvider } from '@ethersproject/providers';
import { chainConfigs } from 'constants/chains';

// flat network configuration struct
// TODO: replace this with Lattice's version in "@latticexyz/network/dist/types"
export type NetworkConfig = {
  devMode: boolean;
  worldAddress: string;
  chainId: number;
  jsonRpc: string;
  wsRpc?: string;
  privateKey?: string;
  externalProvider?: ExternalProvider;
  initialBlockNumber: number;
  checkpointUrl?: string;
  faucetServiceUrl?: string;
  relayServiceUrl?: string;
  snapshotUrl?: string;
};

// shape a flat NetworkConfig struct into lattice's SetupContractConfig struct
const shape: (networkConfig: NetworkConfig) => SetupContractConfig = (
  config
) => ({
  clock: {
    period: 1000,
    initialTime: 0,
    syncInterval: 5000,
  },
  provider: {
    jsonRpcUrl: config.jsonRpc,
    wsRpcUrl: config.wsRpc,
    chainId: config.chainId,
    options: {
      batch: false,
    },
    externalProvider: config.externalProvider,
  },
  privateKey: config.privateKey,
  chainId: config.chainId,
  checkpointServiceUrl: config.checkpointUrl,
  initialBlockNumber: config.initialBlockNumber,
  worldAddress: config.worldAddress,
  devMode: config.devMode,
  faucetServiceUrl: config.faucetServiceUrl,
  relayServiceUrl: config.relayServiceUrl,
  snapshotServiceUrl: config.snapshotUrl,
});

// Populate the network config based on url params
export function createConfig(
  externalProvider?: ExternalProvider
): SetupContractConfig | undefined {
  let config: NetworkConfig = <NetworkConfig>{};

  // get the determined environment mode
  let mode = process.env.MODE;
  if (mode) console.warn(`Environment mode ${mode} detected.\n`);
  else {
    console.warn(`No environment mode detected. Defaulting to 'DEV'\n`);
    mode = 'DEV';
  }

  // override the environment mode if the url param is set
  mode = getModeOverride() ?? mode;

  // resolve the network config based on the environment mode
  switch (mode) {
    case 'DEV':
      config = createConfigRawLocal(externalProvider);
      break;
    case 'TEST':
      config = createConfigRawOPSepolia(externalProvider);
      break;
    case 'OPSEP':
      config = createConfigRawOPSepolia(externalProvider);
      break;
    default:
      config = createConfigRawLocal(externalProvider);
  }

  if (
    config.worldAddress &&
    config.jsonRpc &&
    config.chainId &&
    (config.privateKey || config.externalProvider)
  ) {
    return shape(config);
  }
}

// Get the network config of a local deployment based on url params
function createConfigRawLocal(
  externalProvider?: ExternalProvider
): NetworkConfig {
  const params = new URLSearchParams(window.location.search);

  let config: NetworkConfig = <NetworkConfig>{};
  // config.devMode = false;
  config.devMode = true;

  // EOAs and privatekey
  if (externalProvider) config.externalProvider = externalProvider;
  else {
    let wallet;
    if (params.get('admin') !== 'false') {
      wallet = new Wallet(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      );
    } else {
      const detectedPrivateKey = localStorage.getItem('operatorPrivateKey');
      wallet = detectedPrivateKey
        ? new Wallet(detectedPrivateKey)
        : Wallet.createRandom();

      localStorage.setItem('operatorPrivateKey', wallet.privateKey);
    }
    config.privateKey = wallet.privateKey;
  }

  // RPCs
  const jsonRpc = params.get('rpc') || 'http://localhost:8545';
  const wsRpc =
    params.get('wsRpc') || (jsonRpc && jsonRpc.replace('http', 'ws'));
  config.jsonRpc = jsonRpc;
  config.wsRpc = wsRpc;

  // urls
  config.checkpointUrl = params.get('checkpoint') || '';
  config.snapshotUrl = params.get('snapshotUrl') || '';
  config.faucetServiceUrl = '';
  config.relayServiceUrl = '';

  // chainId
  const chainIdString = params.get('chainId') || '31337';
  config.chainId = parseInt(chainIdString);

  // world
  config.worldAddress = params.get('worldAddress') || '';

  // block number
  let initialBlockNumberString = params.get('initialBlockNumber') || '0';
  config.initialBlockNumber = parseInt(initialBlockNumberString);

  return config;
}

// Get the network config of a deployment to Optimism testnet
function createConfigRawOPSepolia(
  externalProvider?: ExternalProvider
): NetworkConfig {
  let config: NetworkConfig = <NetworkConfig>{
    jsonRpc: 'https://go.getblock.io/19cc856d2ae14db5907bfad3688d59b7',
    wsRpc: 'wss://go.getblock.io/b32c8ea4f9a94c41837c68df4881d52f',
    snapshotUrl: 'https://snapshot.asphodel.io',

    chainId: 11155420,
    worldAddress: '0xcfb6aa5e713cEf37e7688544CdbA50d80cE04EE6',
    initialBlockNumber: 5913546,
  };

  // EOAs and privatekey
  if (externalProvider) {
    config.externalProvider = externalProvider;
  } else {
    // either pull or set up local burner
    let privateKey = localStorage.getItem('operatorPrivateKey');
    const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
    localStorage.setItem('operatorPrivateKey', wallet.privateKey);
    config.privateKey = wallet.privateKey;
  }
  return config;
}

// gets the environment mode override from the url params
const getModeOverride = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const modeOverride = urlParams.get('mode');
  if (modeOverride)
    console.warn(`Environment mode override ${modeOverride} detected.`);
  else return;

  // return the mode override if it is a valid one
  if (chainConfigs.has(modeOverride)) {
    console.warn(`Overriding environment mode..`);
    return modeOverride;
  } else {
    console.warn(
      `No chain config found for override mode '${modeOverride}'.\n`,
      `Must be one of [${Array.from(chainConfigs.keys()).join(' | ')}].\n`,
      `Defaulting to environment mode.`
    );
  }
};
