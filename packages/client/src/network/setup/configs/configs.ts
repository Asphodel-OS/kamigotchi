import { ExternalProvider } from '@ethersproject/providers';

import { SetupContractConfig } from 'network/setup';
import { createLocal } from './local';
import { createProduction } from './prod';
import { createTesting } from './test';
import { NetworkConfig } from './types';

// Populate the network config based on url params
export const createConfig = (provider?: ExternalProvider): SetupContractConfig | undefined => {
  let config: NetworkConfig = <NetworkConfig>{};

  // resolve the network config based on the environment mode
  let mode = import.meta.env.MODE;
  if (mode === 'production') config = createProduction(provider);
  else if (mode === 'staging') config = createProduction(provider);
  else if (mode === 'testing') config = createTesting(provider);
  else config = createLocal(provider);

  if (
    config.worldAddress &&
    config.jsonRpc &&
    config.chainId &&
    (config.privateKey || config.externalProvider)
  ) {
    return shape(config);
  } else {
    console.error('Invalid network config');
  }
};

// shape a flat NetworkConfig struct into SetupContractConfig struct
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
