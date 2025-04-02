import { ExternalProvider } from '@ethersproject/providers';

import { NetworkConfig } from './types';

// create the network config of a local node deployment
export const createLocal = (provider?: ExternalProvider): NetworkConfig => {
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
  else config.privateKey = import.meta.env.VITE_DEV_DEPLOYER_KEY;

  return config;
};
