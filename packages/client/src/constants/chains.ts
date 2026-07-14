import { addRpcUrlOverrideToChain } from '@privy-io/react-auth';
import { Chain, foundry } from '@wagmi/core/chains';

// chain configuration for mainnet (prod and test world)
const YominetRaw = {
  id: 428962654539583,
  name: 'yominet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      webSocket: [import.meta.env.VITE_RPC_WS_URL],
      http: [import.meta.env.VITE_RPC_TRANSPORT_URL],
    },
  },
  blockExplorers: {
    default: { name: 'Yomiscan', url: 'https://scan.initia.xyz/yominet-1' },
  },
} as const satisfies Chain;

// TODO: move everything below to the appropriate file
const yominet = addRpcUrlOverrideToChain(YominetRaw, import.meta.env.VITE_RPC_TRANSPORT_URL);

// pin the local RPC for Privy the same way yominet's is pinned — without the
// override the embedded wallet's broadcast path never reaches localhost
const anvil = addRpcUrlOverrideToChain(foundry, 'http://localhost:8545');

export const chainConfigs: Map<string, Chain> = new Map();
chainConfigs.set('development', anvil); // anvil's chain id (31337); wagmi's `localhost` is 1337
chainConfigs.set('testing', yominet);
chainConfigs.set('staging', yominet);
chainConfigs.set('production', yominet);

export const DefaultChain = chainConfigs.get(import.meta.env.MODE ?? '')!;

// yominet runs with a flat fee, hardcoded fee
// maybe we should try and bake this into the config
export const baseGasPrice = 25e5;
