export type { EVMWalletProvider } from 'app/utils';

export type EVMChainOption = {
  chainId: string;
  denom: string;
  label: string;
  rpcUrl: string;
};

export type BridgeUpdateTone = 'status' | 'success' | 'error' | 'meta' | 'approval';

export type BridgeUpdateEntry = {
  id: number;
  tone: BridgeUpdateTone;
  text: string;
};
