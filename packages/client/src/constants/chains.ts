// src/constants/chains.ts
import { Chain } from "wagmi";
import { optimism } from 'wagmi/chains'

const localhost: Chain = {
  id: 31337,
  name: "local",
  network: "ethereum",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://localhost:8545"] },
    public: { http: ["http://localhost:8545"] },
  },
  testnet: true,
};

const mudChain: Chain = {
  id: 4242,
  name: "mudChain",
  network: "ethereum",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://follower.testnet-chain.linfra.xyz"],
      webSocket: ["wss://follower.testnet-chain.linfra.xyz"],
    },
    public: {
      http: ["https://follower.testnet-chain.linfra.xyz"],
      webSocket: ["wss://follower.testnet-chain.linfra.xyz"],
    },
  },
  testnet: true,
};

const opSepolia: Chain = {
  id: 11155420,
  name: "opSepolia",
  network: "ethereum",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://go.getblock.io/ecf00857f13140bb9d75d51597663370"],
      webSocket: ["wss://go.getblock.io/6af8e0adaac14522928ddf4a002644b0"],
    },
    public: {
      http: ["https://optimism-sepolia.blockpi.network/v1/rpc/public"],
    },
  },
  testnet: true,
};

// object mapping between environment MODEs and chain configs
export const chainConfigs: Map<string, Chain> = new Map([
  ['', localhost],  // default to localhost when no environment mode provided
  ['DEV', localhost],
  ['TEST', opSepolia],
  ['PROD', optimism],
  ['OPSEP', opSepolia],
]);


// overrides the chosen chain config if the url param is set
const getDefaultChainConfig = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  if (!mode) return chainConfigs.get(process.env.MODE ?? '');
  if (chainConfigs.has(mode)) return chainConfigs.get(mode);
  return localhost;
}

// export const defaultChain = chainConfigs.get(process.env.MODE ?? '')!;
export const defaultChain = getDefaultChainConfig()!;
