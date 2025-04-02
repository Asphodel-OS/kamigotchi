import { ExternalProvider } from '@ethersproject/providers';
import { Wallet } from 'ethers';

import { NetworkConfig } from './types';

// Get the network config of a deployment to kami testnet
export const createTesting = (externalProvider?: ExternalProvider): NetworkConfig => {
  let config: NetworkConfig = <NetworkConfig>{
    devMode: false,
    jsonRpc: import.meta.env.VITE_RPC_TRANSPORT_URL,
    wsRpc: import.meta.env.VITE_RPC_WS_URL,
    snapshotServiceUrl: 'https://api.test.kamigotchi.io',
    streamServiceUrl: 'https://api.test.kamigotchi.io',
    // faucetServiceUrl: 'https://faucet-lb.test.asphodel.io/',

    chainId: 4471190363524365,
    worldAddress: '0x89090F774BeC95420f6359003149f51fec207133',
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
