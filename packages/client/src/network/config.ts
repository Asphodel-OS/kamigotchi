import { ExternalProvider } from '@ethersproject/providers';
import { Wallet } from 'ethers';

import { SetupContractConfig } from 'network/setup';

// flat network configuration struct
// TODO: replace this with the version in "engine/types"
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
  // faucetServiceUrl?: string;
  snapshotServiceUrl?: string;
  streamServiceUrl?: string;
};

// shape a flat NetworkConfig struct into lattice's SetupContractConfig struct
const shape: (networkConfig: NetworkConfig) => SetupContractConfig = (config) => ({
  clock: {
    period: 1000, // wtf is this even for
    initialTime: 0,
    syncInterval: 5000, // this impacts the frequency fetchBlock is called.. but why?
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
  else if (mode === 'staging') config = createConfigRawYominet(externalProvider);
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
    worldAddress: params.get('worldAddress') ?? '0xceeDaE2390570eD717A8c07f462D59234b12D39d',
    initialBlockNumber: parseInt(params.get('initialBlockNumber') ?? '0'),
  };

  // EOAs and privatekey)
  if (externalProvider) config.externalProvider = externalProvider;
  else config.privateKey = import.meta.env.VITE_DEV_DEPLOYER_KEY;

  return config;
}

// Get the network config of a deployment to kami testnet
function createConfigRawYominet(externalProvider?: ExternalProvider): NetworkConfig {
  let config: NetworkConfig = <NetworkConfig>{
    devMode: false,
    jsonRpc: import.meta.env.VITE_RPC_TRANSPORT_URL,
    wsRpc: import.meta.env.VITE_RPC_WS_URL,
    snapshotServiceUrl: 'https://kamigaze.test.asphodel.io',
    streamServiceUrl: 'https://kamigaze.test.asphodel.io',
    // faucetServiceUrl: 'https://faucet-lb.test.asphodel.io/',

    chainId: 428962654539583,
    worldAddress: '0xe32795B8A98Ca58641f5d887324da31464867f33',
    initialBlockNumber: 1024,
  };

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
