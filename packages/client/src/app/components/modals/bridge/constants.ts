import { TokenIcons } from 'assets/images/tokens';
import { EVMChainOption } from './types';

////////////////
// OVERVIEW

export const SOURCE_CHAIN_OPTIONS: EVMChainOption[] = [
  {
    chainId: '1',
    denom: 'ethereum-native',
    label: 'Ethereum Mainnet',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
  },
  {
    chainId: '8453',
    denom: 'base-native',
    label: 'Base',
    rpcUrl: 'https://mainnet.base.org',
  },
  {
    chainId: '42161',
    denom: 'arbitrum-native',
    label: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  {
    chainId: '10',
    denom: 'optimism-native',
    label: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
  },
];

export const DISABLED_SOURCE_CHAIN_IDS = new Set(['10']);

////////////////
// DISPLAY

export const SOURCE_CHAIN_ICON_BY_CHAIN_ID: Record<string, string> = {
  '1': TokenIcons.eth,
  '10': TokenIcons.optimism,
  '8453': TokenIcons.base,
  '42161': TokenIcons.arbitrum,
};

////////////////
// RPC

export const YOMINET_ETH_TOKEN_ADDRESS = '0xE1Ff7038eAAAF027031688E1535a055B2Bac2546';
export const YOMINET_RPC_URL = import.meta.env.VITE_RPC_TRANSPORT_URL ?? '';

////////////////
// POLLING

export const POLL_INTERVAL_MS = 15_000;
export const DEGRADED_POLL_INTERVAL_MS = 45_000;
export const POLL_MAX_ATTEMPTS = 40;
export const STATUS_RECHECK_EVERY_ATTEMPTS = 4;

////////////////
// FALLBACKS

export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';
