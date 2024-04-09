import { addRpcUrlOverrideToChain } from '@privy-io/react-auth';
import { Chain, localhost, optimism, optimismSepolia } from '@wagmi/core/chains';

const opSepoliaOverride = addRpcUrlOverrideToChain(
  optimismSepolia,
  import.meta.env.VITE_RPC_TRANSPORT_URL
);

export const chainConfigs: Map<string, Chain> = new Map();
chainConfigs.set('development', localhost);
chainConfigs.set('staging', opSepoliaOverride);
chainConfigs.set('production', optimism);

export const defaultChain = chainConfigs.get(import.meta.env.MODE ?? '')!;
