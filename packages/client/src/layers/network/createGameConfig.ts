import { Wallet } from 'ethers';
import { GameConfig } from './config';

// Populate the network config based on url params
export function createGameConfig(): GameConfig | undefined {
  let config: GameConfig = <GameConfig>{};

  const params = new URLSearchParams(window.location.search);
  const devMode = params.get('dev') === 'true';
  config = (devMode) ? createGameConfigLocal(params) : createGameConfigLattice();
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
export function createGameConfigLocal(params: URLSearchParams): GameConfig {
  let config: GameConfig = <GameConfig>{};
  config.devMode = true;

  // EOAs
  const wallet = new Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  ); // owner wallet

  localStorage.setItem('burnerPrivateKey', wallet.privateKey);
  localStorage.setItem('burnerAddress', wallet.publicKey);
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
  let privateKey = localStorage.getItem("burnerAddress");
  const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
  localStorage.setItem("burnerPrivateKey", wallet.privateKey);
  localStorage.setItem("burnerAddress", wallet.publicKey);

  let config: GameConfig = <GameConfig>{
    privateKey: wallet.privateKey,
    jsonRpc: "https://follower.testnet-chain.linfra.xyz",
    wsRpc: "wss://follower.testnet-chain.linfra.xyz",
    faucetServiceUrl: "https://faucet.testnet-mud-services.linfra.xyz",
    relayServiceUrl: "https://ecs-relay.testnet-mud-services.linfra.xyz",
    snapshotUrl: "https://ecs-snapshot.testnet-mud-services.linfra.xyz",
    // checkpointUrl: undefined,
    chainId: 4242,
    worldAddress: "0xfEF57aF100788255165c470621d19d4673e9ED91", // this is the asphodel playtest
    initialBlockNumber: 0,
  };
  return config;
}