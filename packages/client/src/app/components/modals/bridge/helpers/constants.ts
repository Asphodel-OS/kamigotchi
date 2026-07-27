import { TokenIcons } from 'assets/images/tokens';

////////////////
// TYPES

export type { EVMWalletProvider } from 'app/utils';

export type EVMChainOption = {
  chainId: string;
  denom: string;
  label: string;
  rpcUrl: string;
  explorerUrl: string;
};

export type BridgeUpdateTone = 'status' | 'success' | 'error' | 'meta' | 'approval' | 'celebrate';

export type BridgeUpdateEntry = {
  id: number;
  tone: BridgeUpdateTone;
  text: string;
  url?: string;
};

export type BridgePhase =
  | 'idle'
  | 'preparing'
  | 'switchingWallet'
  | 'awaitingApproval'
  | 'submitted'
  | 'aborted';

////////////////
// OVERVIEW

export const SOURCE_CHAIN_OPTIONS: EVMChainOption[] = [
  {
    chainId: '1',
    denom: 'ethereum-native',
    label: 'Ethereum Mainnet',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
  },
  {
    chainId: '8453',
    denom: 'base-native',
    label: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
  },
  {
    chainId: '42161',
    denom: 'arbitrum-native',
    label: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
  },
];

export const DISABLED_SOURCE_CHAIN_IDS = new Set(['10']);

////////////////
// DISPLAY

export const SOURCE_CHAIN_ICON_BY_CHAIN_ID: Record<string, string> = {
  '1': TokenIcons.eth_old,

  '8453': TokenIcons.base,
  '42161': TokenIcons.arbitrum,
};

////////////////
// VALIDATION

export const MIN_BRIDGE_AMOUNT = 1_000_000_000_000n; // 0.000001 ETH

////////////////
// POLLING

export const POLL_INTERVAL_MS = 15_000;
export const DEGRADED_POLL_INTERVAL_MS = 45_000;
// 80 x 15s = 20 minutes — relays regularly exceed the old 10-minute window
export const POLL_MAX_ATTEMPTS = 80;
export const STATUS_RECHECK_EVERY_ATTEMPTS = 4;

