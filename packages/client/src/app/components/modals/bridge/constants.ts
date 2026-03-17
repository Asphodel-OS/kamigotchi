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

export type BridgeUpdateTone = 'status' | 'success' | 'error' | 'meta' | 'approval';

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
  '1': TokenIcons.eth,

  '8453': TokenIcons.base,
  '42161': TokenIcons.arbitrum,
};

////////////////
// RPC

export const YOMINET_ETH_TOKEN_ADDRESS = '0xE1Ff7038eAAAF027031688E1535a055B2Bac2546';
export const YOMINET_RPC_URL = import.meta.env.VITE_RPC_TRANSPORT_URL ?? '';
export const YOMINET_EXPLORER_URL = 'https://scan.initia.xyz/yominet-1';

////////////////
// POLLING

export const POLL_INTERVAL_MS = 15_000;
export const DEGRADED_POLL_INTERVAL_MS = 45_000;
export const POLL_MAX_ATTEMPTS = 40;
export const STATUS_RECHECK_EVERY_ATTEMPTS = 4;

////////////////
// FALLBACKS

export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';
