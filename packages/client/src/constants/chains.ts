import { addRpcUrlOverrideToChain } from '@privy-io/react-auth';
import { Chain, localhost } from '@wagmi/core/chains';

// chain configuration for testnet
const TestnetRaw = {
  id: 4471190363524365,
  name: 'preyominet',
  nativeCurrency: {
    decimals: 18,
    name: 'Onyx',
    symbol: 'ONYX',
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_TRANSPORT_URL] },
  },
  blockExplorers: {
    default: { name: 'Onyxscan', url: 'https://scan.testnet.initia.xyz/preyominet-1' },
  },
} as const satisfies Chain;

// chain configuration for mainnet
const YominetRaw = {
  id: 428962654539583,
  name: 'yominet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_TRANSPORT_URL] },
  },
  blockExplorers: {
    default: { name: 'Yomiscan', url: 'https://scan.testnet.initia.xyz/preyominet-1' },
  },
} as const satisfies Chain;

// TODO: move everything below to the appropriate file
const testnet = addRpcUrlOverrideToChain(TestnetRaw, import.meta.env.VITE_RPC_TRANSPORT_URL);
const yominet = addRpcUrlOverrideToChain(YominetRaw, import.meta.env.VITE_RPC_TRANSPORT_URL);

export const chainConfigs: Map<string, Chain> = new Map();
chainConfigs.set('puter', localhost);
chainConfigs.set('testing', testnet);
chainConfigs.set('staging', yominet);
chainConfigs.set('production', yominet);

export const DefaultChain = chainConfigs.get(import.meta.env.MODE ?? '')!;

// yominet runs with a flat fee, hardcoded fee
// maybe we should try and bake this into the config
export const baseGasPrice = 3e7;
