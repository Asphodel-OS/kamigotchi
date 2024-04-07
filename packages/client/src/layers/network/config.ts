import { ExternalProvider } from '@ethersproject/providers';
import { Wallet } from 'ethers';

import { chainConfigs } from 'constants/chains';
import { SetupContractConfig } from 'layers/network/setup';

// flat network configuration struct
// TODO: replace this with Lattice's version in "@mud-classic/network/dist/types"
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
  snapshotServiceUrl?: string;
  streamServiceUrl?: string;
};

// shape a flat NetworkConfig struct into lattice's SetupContractConfig struct
const shape: (networkConfig: NetworkConfig) => SetupContractConfig = (config) => ({
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
  snapshotServiceUrl: config.snapshotServiceUrl,
  streamServiceUrl: config.streamServiceUrl,
});

// Populate the network config based on url params
export function createConfig(externalProvider?: ExternalProvider): SetupContractConfig | undefined {
  let config: NetworkConfig = <NetworkConfig>{};

  // get the determined environment mode from env vars or override
  let mode = import.meta.env.MODE;
  if (!mode) {
    console.warn(`No environment mode detected. Defaulting to 'development'\n`);
    mode = 'development';
  }
  mode = getModeOverride() ?? mode;

  // resolve the network config based on the environment mode
  if (mode === 'development') config = createConfigRawLocal(externalProvider);
  else if (mode === 'staging') config = createConfigRawOPSepolia(externalProvider);
  else config = createConfigRawLocal(externalProvider);

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
function createConfigRawLocal(externalProvider?: ExternalProvider): NetworkConfig {
  const params = new URLSearchParams(window.location.search);

  let config: NetworkConfig = <NetworkConfig>{};
  config.devMode = true;

  // EOAs and privatekey
  if (externalProvider) config.externalProvider = externalProvider;
  else {
    const wallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    config.privateKey = wallet.privateKey;
  }

  // RPCs
  const jsonRpc = params.get('rpc') || 'http://localhost:8545';
  const wsRpc = params.get('wsRpc') || (jsonRpc && jsonRpc.replace('http', 'ws'));
  config.jsonRpc = jsonRpc;
  config.wsRpc = wsRpc;

  // chainId
  const chainIdString = params.get('chainId') || '1337';
  config.chainId = parseInt(chainIdString);

  // world
  config.worldAddress = params.get('worldAddress') || '0x610178dA211FEF7D417bC0e6FeD39F05609AD788';

  // block number
  let initialBlockNumberString = params.get('initialBlockNumber') || '0';
  config.initialBlockNumber = parseInt(initialBlockNumberString);

  return config;
}

// Get the network config of a deployment to Optimism testnet
function createConfigRawOPSepolia(externalProvider?: ExternalProvider): NetworkConfig {
  let config: NetworkConfig = <NetworkConfig>{
    jsonRpc: 'https://go.getblock.io/19cc856d2ae14db5907bfad3688d59b7',
    wsRpc: 'wss://go.getblock.io/b32c8ea4f9a94c41837c68df4881d52f',
    snapshotServiceUrl: 'https://snapshot.asphodel.io',

    chainId: 11155420,
    worldAddress: '0x40aEaA59D096ff56Cb25cDD7f8198108fb67A519',
    initialBlockNumber: 10358274,
  };

  // EOAs and privatekey
  // TODO: make sure it's safe then rug all the below
  if (externalProvider) config.externalProvider = externalProvider;
  else {
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
  if (!modeOverride) return;

  // return the mode override if it is a valid one
  console.warn(`Environment mode override { ${modeOverride} } detected.`);
  if (chainConfigs.has(modeOverride)) {
    console.warn(`Overriding environment mode..`);
    return modeOverride;
  } else {
    console.warn(
      `No chain config found for override mode { ${modeOverride} }.\n`,
      `Must be one of [${Array.from(chainConfigs.keys()).join(' | ')}].\n`,
      `Defaulting to provided environment mode.`
    );
  }
};
