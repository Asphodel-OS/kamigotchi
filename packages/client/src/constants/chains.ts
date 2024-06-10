import { addRpcUrlOverrideToChain } from '@privy-io/react-auth';
import { Chain, localhost, optimism, optimismSepolia } from '@wagmi/core/chains';

const opSepoliaOverride = addRpcUrlOverrideToChain(
  optimismSepolia,
  import.meta.env.VITE_RPC_TRANSPORT_URL
);

export const caldera = {
  id: 2017048,
  name: 'kamitestnet1',
  // network: 'kamitestnet1',
  nativeCurrency: {
    decimals: 18,
    name: 'Etheruem',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://kamitestnet1.rpc.caldera.xyz/http'] },
    default: { http: ['wss://kamitestnet1.rpc.caldera.xyz/ws'] },
  },
  blockExplorers: {
    etherscan: { name: 'Explorer', url: 'https://kamitestnet1.explorer.caldera.xyz/' },
    default: { name: 'Explorer', url: 'https://kamitestnet1.explorer.caldera.xyz/' },
  },
} as const satisfies Chain;

export const chainConfigs: Map<string, Chain> = new Map();
chainConfigs.set('development', localhost);
chainConfigs.set('staging', opSepoliaOverride);
chainConfigs.set('production', optimism);
chainConfigs.set('caldera', caldera);

export const defaultChain = chainConfigs.get(import.meta.env.MODE ?? '')!;
