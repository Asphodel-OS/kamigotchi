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

const opGoerli: Chain = {
  id: 420,
  name: "opGoerli",
  network: "ethereum",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://opt-goerli.g.alchemy.com/v2/8eeIXfv2AQPg3M89e7D1La27gZFE3Hcg"],
      webSocket: ["wss://opt-goerli.g.alchemy.com/v2/8eeIXfv2AQPg3M89e7D1La27gZFE3Hcg"],
    },
    public: {
      http: ["https://opt-goerli.g.alchemy.com/v2/8eeIXfv2AQPg3M89e7D1La27gZFE3Hcg"],
      webSocket: ["wss://opt-goerli.g.alchemy.com/v2/8eeIXfv2AQPg3M89e7D1La27gZFE3Hcg"],
    },
  },
  testnet: true,
};

// object mapping between environment MODEs and chain configs
const chainConfigs: Map<string, Chain> = new Map([
  ['', localhost],  // default to localhost when no environment mode provided
  ['DEV', localhost],
  ['TEST', mudChain],
  ['PROD', optimism],
  ['OPGOERLI', opGoerli],
]);

export const defaultChainConfig = chainConfigs.get(process.env.MODE ?? '')!;
