import { addRpcUrlOverrideToChain } from '@privy-io/react-auth';
import { Chain, localhost, optimism } from '@wagmi/core/chains';

const rawYominet = {
  id: 4471190363524365,
  name: 'yominet',
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

const rawOldYominet = {
  id: 5264468217,
  name: 'yominet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://yominet.rpc.caldera.xyz/http/'] },
  },

  blockExplorers: {
    default: { name: 'Explorer', url: 'https://yominet.explorer.caldera.xyz' },
  },
} as const satisfies Chain;

const yominet = addRpcUrlOverrideToChain(rawYominet, import.meta.env.VITE_RPC_TRANSPORT_URL);
export const oldYominet = addRpcUrlOverrideToChain(
  rawOldYominet,
  'https://yominet.rpc.caldera.xyz/http/'
);

export const chainConfigs: Map<string, Chain> = new Map();
chainConfigs.set('development', localhost);
chainConfigs.set('staging', yominet);
chainConfigs.set('production', optimism);
chainConfigs.set('previous', oldYominet);

export const defaultChain = chainConfigs.get(import.meta.env.MODE ?? '')!;
