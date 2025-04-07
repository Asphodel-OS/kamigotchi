import { ExternalProvider } from '@ethersproject/providers';
import { Wallet } from 'ethers';

import { SetupContractConfig } from 'network/setup';
import { NetworkConfig } from './types';

// Populate the network config based on url params
export const createConfig = (provider?: ExternalProvider): SetupContractConfig | undefined => {
  let config: NetworkConfig = <NetworkConfig>{};

  // resolve the network config based on the environment mode
  let mode = import.meta.env.MODE;
  if (mode === 'puter') config = getLocalConfig(provider);
  else config = getConfig(provider);

  if (
    config.worldAddress &&
    config.jsonRpc &&
    config.chainId &&
    (config.privateKey || config.externalProvider)
  ) {
    return shape(config);
  } else {
    console.error('Invalid network config', config);
  }
};

// get the config of a non-local deployment, populated with environment variables
export const getConfig = (provider?: ExternalProvider): NetworkConfig => {
  let config: NetworkConfig = {
    devMode: false,
    jsonRpc: import.meta.env.VITE_RPC_TRANSPORT_URL,
    wsRpc: import.meta.env.VITE_RPC_WS_URL,
    snapshotServiceUrl: import.meta.env.VITE_KAMIGAZE_URL,
    streamServiceUrl: import.meta.env.VITE_KAMIGAZE_URL,
    chainId: Number(import.meta.env.VITE_CHAIN_ID),
    worldAddress: import.meta.env.VITE_WORLD_ADDRESS,
    initialBlockNumber: Number(import.meta.env.VITE_INITIAL_BLOCK_NUMBER),
  };

  // TODO: deprecate second path this whenever it stops being loadbearing
  if (provider) config.externalProvider = provider;
  else config.privateKey = Wallet.createRandom().privateKey;

  return config;
};

// create the network config of a local node deployment
export const getLocalConfig = (provider?: ExternalProvider): NetworkConfig => {
  const params = new URLSearchParams(window.location.search);
  let config: NetworkConfig = <NetworkConfig>{
    devMode: true,
    chainId: 1337,
    jsonRpc: 'http://localhost:8545',
    wsRpc: 'ws://localhost:8545',
    worldAddress: params.get('worldAddress') ?? '0xceeDaE2390570eD717A8c07f462D59234b12D39d',
    initialBlockNumber: parseInt(params.get('initialBlockNumber') ?? '0'),
  };

  // EOAs and privatekey
  if (provider) config.externalProvider = provider;
  else config.privateKey = Wallet.createRandom().privateKey;

  return config;
};

// shape a flat NetworkConfig struct into SetupContractConfig struct
// Q: how necessary are all these fields?
// what if we just forced the inclusion of an external provider?
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
  privateKey: config.privateKey, // TODO: deprecate this
  chainId: config.chainId,
  checkpointServiceUrl: config.checkpointUrl,
  initialBlockNumber: config.initialBlockNumber,
  worldAddress: config.worldAddress,
  devMode: config.devMode,
  snapshotServiceUrl: config.snapshotServiceUrl,
  streamServiceUrl: config.streamServiceUrl,
});
