import { addRpcUrlOverrideToChain } from '@privy-io/react-auth';
import { Chain, localhost, optimism, optimismSepolia } from 'viem/chains';

// const opSepolia: Chain = {
//   id: 11155420,
//   name: 'opSepolia',
//   network: 'ethereum',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ethereum',
//     symbol: 'ETH',
//   },
//   rpcUrls: {
//     default: {
//       http: ['https://go.getblock.io/ecf00857f13140bb9d75d51597663370'],
//       webSocket: ['wss://go.getblock.io/6af8e0adaac14522928ddf4a002644b0'],
//     },
//     public: {
//       http: ['https://optimism-sepolia.blockpi.network/v1/rpc/public'],
//     },
//   },
//   testnet: true,
// };

const opSepoliaOverride = addRpcUrlOverrideToChain(
  optimismSepolia,
  'https://go.getblock.io/ecf00857f13140bb9d75d51597663370'
);

export const chainConfigs: Map<string, Chain> = new Map();
chainConfigs.set('localhost', localhost);
chainConfigs.set('development', localhost);
chainConfigs.set('staging', opSepoliaOverride);
chainConfigs.set('test', opSepoliaOverride);
chainConfigs.set('OPSEP', opSepoliaOverride);
chainConfigs.set('production', optimism);

// overrides the chosen chain config if the url param is set
const getDefaultChainConfig = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  if (!mode) return chainConfigs.get(import.meta.env.MODE ?? '');
  if (chainConfigs.has(mode)) return chainConfigs.get(mode);
  return localhost;
};

export const defaultChain = getDefaultChainConfig()!;
