import { TokenIcons } from 'assets/images/tokens';
import { Tokens } from 'constants/tokens';

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

export type BridgeFormState = {
  externalChain: EVMChainOption;
  direction: BridgeDirection;
  amount: string;
  parsedAmount: bigint | null;
  externalBalance: bigint;
  yomiBalance: bigint;
};

export type BridgeFormStatus = {
  isBridging: boolean;
  accountReady: boolean;
  hasSufficientSourceBalance: boolean;
};

export type BridgeFormActions = {
  onAmountChange: (amount: string) => void;
  onSourceChainChange: (chain: EVMChainOption) => void;
  onSwapDirection: () => void;
  onSubmit: () => void;
};

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

export const YOMINET_CHAIN_OPTION: EVMChainOption = {
  chainId: 'yominet-1',
  denom: `evm/${Tokens.ETH.address.slice(2)}`,
  label: 'Yominet',
  rpcUrl: '',
  explorerUrl: 'https://scan.initia.xyz/yominet-1',
};

export type BridgeDirection = 'in' | 'out';

export const DISABLED_SOURCE_CHAIN_IDS = new Set(['10']);

////////////////
// DISPLAY

export const CHAIN_ICON_BY_CHAIN_ID: Record<string, string> = {
  '1': TokenIcons.eth,
  '8453': TokenIcons.base,
  '42161': TokenIcons.arbitrum,
  'yominet-1': TokenIcons.yominet,
};

////////////////
// VALIDATION

export const MIN_BRIDGE_AMOUNT = 1_000_000_000_000n; // 0.000001 ETH

////////////////
// POLLING

export const POLL_INTERVAL_MS = 15_000;
export const DEGRADED_POLL_INTERVAL_MS = 45_000;
export const POLL_MAX_ATTEMPTS = 40;
export const STATUS_RECHECK_EVERY_ATTEMPTS = 4;

