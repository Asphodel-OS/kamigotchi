import { ExternalProvider } from '@ethersproject/providers';

// flat network configuration struct
// TODO: replace this with the version in "engine/types"
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
  snapshotServiceUrl?: string;
  streamServiceUrl?: string;
};
