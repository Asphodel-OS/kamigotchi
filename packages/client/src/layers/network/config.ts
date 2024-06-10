import { ExternalProvider } from '@ethersproject/providers';
import { Wallet } from 'ethers';

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

  // resolve the network config based on the environment mode
  let mode = import.meta.env.MODE;
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
  let config: NetworkConfig = <NetworkConfig>{
    devMode: true,
    jsonRpc: 'http://localhost:8545',
    wsRpc: 'ws://localhost:8545',

    chainId: 1337,
    worldAddress: params.get('worldAddress') ?? '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    initialBlockNumber: parseInt(params.get('initialBlockNumber') ?? '0'),
  };

  // EOAs and privatekey)
  if (externalProvider) config.externalProvider = externalProvider;
  else config.privateKey = import.meta.env.VITE_DEV_DEPLOYER_KEY;

  return config;
}

// Get the network config of a deployment to Optimism testnet
function createConfigRawOPSepolia(externalProvider?: ExternalProvider): NetworkConfig {
  let config: NetworkConfig = <NetworkConfig>{
    devMode: false,
    jsonRpc: 'https://go.getblock.io/19cc856d2ae14db5907bfad3688d59b7',
    wsRpc: 'wss://go.getblock.io/b32c8ea4f9a94c41837c68df4881d52f',
    snapshotServiceUrl: 'https://snapshot-lb.test.asphodel.io',

    chainId: 11155420,
    worldAddress: '0x5E5C181ccc3E2759B45fb775877146F7BF6d9227',
    initialBlockNumber: 12971933,
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
