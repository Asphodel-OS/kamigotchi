import { Wallet } from 'ethers';
import { SetupContractConfig } from "@latticexyz/std-client";
import { ExternalProvider } from "@ethersproject/providers";

// flat network configuration struct
// TODO: replace this with Lattice's version in "@latticexyz/network/dist/types"
export type NetworkConfig = {
  devMode: boolean;
  worldAddress: string;
  chainId: number;
  jsonRpc: string;
  wsRpc?: string;
  privateKey?: string;
  externalProvider?: ExternalProvider;
  initialBlockNumber: number;
  checkpointUrl?: string;
  faucetServiceUrl?: string;
  relayServiceUrl?: string;
  snapshotUrl?: string;
};

// shapes a flat NetworkConfig struct into lattice's SetupContractConfig struct
export const shapeNetworkConfig: (networkConfig: NetworkConfig) => SetupContractConfig = (config) => ({
  clock: {
    period: 1000,
    initialTime: 0,
    syncInterval: 5000,
  },
  provider: {
    jsonRpcUrl: config.jsonRpc,
    wsRpcUrl: config.wsRpc,
    chainId: config.chainId,
    options: {
      batch: false,
    },
    externalProvider: config.externalProvider,
  },
  privateKey: config.privateKey,
  chainId: config.chainId,
  checkpointServiceUrl: config.checkpointUrl,
  initialBlockNumber: config.initialBlockNumber,
  worldAddress: config.worldAddress,
  devMode: config.devMode,
  faucetServiceUrl: config.faucetServiceUrl,
  relayServiceUrl: config.relayServiceUrl,
  snapshotServiceUrl: config.snapshotUrl,
});


// Populate the network config based on url params
export function createNetworkConfig(externalProvider?: ExternalProvider): SetupContractConfig | undefined {
  let config: NetworkConfig = <NetworkConfig>{};

  switch (process.env.MODE) {
    case 'DEV':
      config = createNetworkConfigLocal(externalProvider);
      break;
    case 'TEST':
      config = createNetworkConfigOpGoerli(externalProvider);
      break;
    case 'OPGOERLI':
      config = createNetworkConfigOpGoerli(externalProvider);
      break;
    default:
      config = createNetworkConfigLocal(externalProvider);
  }

  if (
    config.worldAddress
    && config.jsonRpc
    && config.chainId
    && (config.privateKey || config.externalProvider)
  ) {
    return shapeNetworkConfig(config);
  }
}

// Get the network config of a local deployment based on url params
export function createNetworkConfigLocal(externalProvider?: ExternalProvider): NetworkConfig {
  const params = new URLSearchParams(window.location.search);

  let config: NetworkConfig = <NetworkConfig>{};
  // config.devMode = false;
  config.devMode = true;

  // EOAs and privatekey
  if (externalProvider) {
    config.externalProvider = externalProvider;
  } else {
    let wallet;
    if (params.get('admin') !== 'false') {
      wallet = new Wallet(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      );
    } else {
      const detectedPrivateKey = localStorage.getItem('operatorPrivateKey');
      wallet = (detectedPrivateKey)
        ? new Wallet(detectedPrivateKey)
        : Wallet.createRandom();

      localStorage.setItem('operatorPrivateKey', wallet.privateKey);
    }
    config.privateKey = wallet.privateKey;
  }

  // RPCs
  const jsonRpc = params.get('rpc') || "http://localhost:8545";
  const wsRpc = params.get('wsRpc') || (jsonRpc && jsonRpc.replace("http", "ws"));
  config.jsonRpc = jsonRpc;
  config.wsRpc = wsRpc;

  // urls
  config.checkpointUrl = params.get('checkpoint') || '';
  config.snapshotUrl = params.get('snapshotUrl') || '';
  config.faucetServiceUrl = '';
  config.relayServiceUrl = '';

  // chainId
  const chainIdString = params.get('chainId') || '31337';
  config.chainId = parseInt(chainIdString);

  // world
  config.worldAddress = params.get('worldAddress') || '';

  // block number
  let initialBlockNumberString = params.get('initialBlockNumber') || '0';
  config.initialBlockNumber = parseInt(initialBlockNumberString);


  return config;
}

// Get the network config of a deployment to Lattice's mudChain testnet
function createNetworkConfigLattice(externalProvider?: ExternalProvider): NetworkConfig {
  let config: NetworkConfig = <NetworkConfig>{
    jsonRpc: "https://follower.testnet-chain.linfra.xyz",
    wsRpc: "wss://follower.testnet-chain.linfra.xyz",
    faucetServiceUrl: "https://faucet.testnet-mud-services.linfra.xyz",
    relayServiceUrl: "https://ecs-relay.testnet-mud-services.linfra.xyz",
    snapshotUrl: "https://ecs-snapshot.testnet-mud-services.linfra.xyz",

    // checkpointUrl: undefined,
    chainId: 4242,
    // last depolyment update: 7 Sep 2023
    worldAddress: "0xe29DAb7C4d2ade77e99A57FD0aaFd4d03038e4A3",
    initialBlockNumber: 20740208,
  };

  // EOAs and privatekey
  if (externalProvider) {
    config.externalProvider = externalProvider;
  } else {
    // either pull or set up local burner
    let privateKey = localStorage.getItem("operatorPrivateKey");
    const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
    localStorage.setItem("operatorPrivateKey", wallet.privateKey);
    config.privateKey = wallet.privateKey;
  }
  return config;
}

// Get the network config of a deployment to Optimism testnet
function createNetworkConfigOpGoerli(externalProvider?: ExternalProvider): NetworkConfig {
  let config: NetworkConfig = <NetworkConfig>{
    jsonRpc: "https://op.getblock.io/da628c7e-9c2e-4448-b22d-a6e17f408532/goerli",
    wsRpc: "wss://op.getblock.io/da628c7e-9c2e-4448-b22d-a6e17f408532/goerli/",
    snapshotUrl: "https://snapshot.asphodel.io",

    chainId: 420,
    worldAddress: "0xb5bc82AC41B58421FD73a5949184251866985839",
    initialBlockNumber: 16183942,
  };

  // EOAs and privatekey
  if (externalProvider) {
    config.externalProvider = externalProvider;
  } else {
    // either pull or set up local burner
    let privateKey = localStorage.getItem("operatorPrivateKey");
    const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
    localStorage.setItem("operatorPrivateKey", wallet.privateKey);
    config.privateKey = wallet.privateKey;
  }
  return config;
}