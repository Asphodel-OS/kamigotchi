import { addRpcUrlOverrideToChain } from '@privy-io/react-auth';
import { Chain, localhost, optimism } from '@wagmi/core/chains';

const rawYominet = {
  id: 5264468217,
  name: 'yominet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_TRANSPORT_URL] },
    // default: { http: ['https://yominet.rpc.caldera.xyz/http'] },
  },

  blockExplorers: {
    default: { name: 'Explorer', url: 'https://yominet.explorer.caldera.xyz' },
  },
} as const satisfies Chain;

const yominet = addRpcUrlOverrideToChain(rawYominet, import.meta.env.VITE_RPC_TRANSPORT_URL);

export const chainConfigs: Map<string, Chain> = new Map();
chainConfigs.set('development', localhost);
chainConfigs.set('staging', yominet);
chainConfigs.set('production', optimism);

export const defaultChain = chainConfigs.get(import.meta.env.MODE ?? '')!;
