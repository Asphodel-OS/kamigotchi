import { addRpcUrlOverrideToChain } from '@privy-io/react-auth';
import { Chain, localhost } from '@wagmi/core/chains';

const rawYominet = {
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

const yominet = addRpcUrlOverrideToChain(rawYominet, import.meta.env.VITE_RPC_TRANSPORT_URL);

export const chainConfigs: Map<string, Chain> = new Map();
chainConfigs.set('development', localhost);
chainConfigs.set('staging', yominet);
chainConfigs.set('production', yominet);

export const DefaultChain = chainConfigs.get(import.meta.env.MODE ?? '')!;

// yominet runs with a flat fee, hardcoded fee
export const baseGasPrice = 3e7;
