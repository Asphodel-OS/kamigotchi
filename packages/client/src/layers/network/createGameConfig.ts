import { Wallet } from 'ethers';
import { GameConfig } from './config';

// Populate the network config based on url params
export function createGameConfig(): GameConfig | undefined {
  let config: GameConfig = <GameConfig>{};

  const params = new URLSearchParams(window.location.search);
  const devMode = params.get('dev') === 'true';
  config = (devMode) ? createGameConfigLocal() : createGameConfigLattice();
  console.log('config', config);

  if (
    config.privateKey
    && config.worldAddress
    && config.jsonRpc
    && config.chainId
  ) {
    return config;
  }
}

// Get the network config of a local deployment based on url params
export function createGameConfigLocal(): GameConfig {
  const params = new URLSearchParams(window.location.search);

  let config: GameConfig = <GameConfig>{};
  config.devMode = true;

  // EOAs and privatekey
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
    localStorage.setItem('operatorPublicKey', wallet.publicKey);
  }
  config.privateKey = wallet.privateKey;

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
function createGameConfigLattice(): GameConfig {
  // setting up local burner
  let privateKey = localStorage.getItem("operatorPrivateKey");
  const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
  localStorage.setItem("operatorPrivateKey", wallet.privateKey);
  localStorage.setItem("operatorPublicKey", wallet.publicKey);


  let config: GameConfig = <GameConfig>{
    privateKey: wallet.privateKey,
    jsonRpc: "https://follower.testnet-chain.linfra.xyz",
    wsRpc: "wss://follower.testnet-chain.linfra.xyz",
    faucetServiceUrl: "https://faucet.testnet-mud-services.linfra.xyz",
    relayServiceUrl: "https://ecs-relay.testnet-mud-services.linfra.xyz",
    snapshotUrl: "https://ecs-snapshot.testnet-mud-services.linfra.xyz",
    // checkpointUrl: undefined,
    chainId: 4242,
    worldAddress: "0xd0F4505f3bC8BC607687D1A0Edc1fA305E7AC11F",
    initialBlockNumber: 10987107,
  };
  return config;
}