import { ExternalProvider } from '@ethersproject/providers';
import { Wallet } from 'ethers';

import { NetworkConfig } from './types';

// Get the network config of a deployment to kami testnet
export const createProduction = (externalProvider?: ExternalProvider): NetworkConfig => {
  let config: NetworkConfig = <NetworkConfig>{
    devMode: false,
    jsonRpc: import.meta.env.VITE_RPC_TRANSPORT_URL,
    wsRpc: import.meta.env.VITE_RPC_WS_URL,
    snapshotServiceUrl: 'https://api.prod.kamigotchi.io',
    streamServiceUrl: 'https://api.prod.kamigotchi.io',

    chainId: 4471190363524365,
    worldAddress: '0x379FA7857b8722d2719f16f78753995BafEb4B9b',
    initialBlockNumber: 44577,
  };

  if (externalProvider) config.externalProvider = externalProvider;
  else {
    // either pull or set up local burner
    // TODO: deprecate this whenever it stops being loadbearing
    let privateKey = localStorage.getItem('operatorPrivateKey');
    const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
    localStorage.setItem('operatorPrivateKey', wallet.privateKey);
    config.privateKey = wallet.privateKey;
  }
  return config;
};
