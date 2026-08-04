import { formatEther } from 'viem';

import { TokenIcons } from 'assets/images/tokens';
import { Tokens } from 'constants/tokens';

////////////////
// TYPES

export type { EVMWalletProvider } from 'app/utils';

export type BridgeAssetId = 'ONYX' | 'ETH';

export type BridgeAssetOption = {
  id: BridgeAssetId;
  label: string;
  icon: string;
};

export type EVMChainOption = {
  id: string;
  asset: BridgeAssetId;
  chainId: string;
  denom: string;
  label: string;
  icon: string;
  rpcUrl: string;
  explorerUrl: string;
  symbol: string;
  destTokenAddress: string;
  minAmount: bigint;
  defaultAmount: string;
  sourceTokenAddress?: string;
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
  | 'approving'
  | 'confirmingApproval'
  | 'awaitingApproval'
  | 'submitted'
  | 'aborted';

////////////////
// OVERVIEW

const ONYX_ETHEREUM_ADDRESS = '0x80Ea38D56E262457D73c0d8dFe027AE8925821e2';

const MIN_ETH_AMOUNT = 1_000_000_000_000n;
const DEFAULT_ETH_AMOUNT = '0.001';

export const SOURCE_CHAIN_OPTIONS: EVMChainOption[] = [
  {
    id: 'ethereum-eth',
    asset: 'ETH',
    chainId: '1',
    denom: 'ethereum-native',
    label: 'Ethereum Mainnet',
    icon: TokenIcons.eth,
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    symbol: 'ETH',
    destTokenAddress: Tokens.ETH.address,
    minAmount: MIN_ETH_AMOUNT,
    defaultAmount: DEFAULT_ETH_AMOUNT,
  },
  {
    id: 'ethereum-onyx',
    asset: 'ONYX',
    chainId: '1',
    denom: ONYX_ETHEREUM_ADDRESS,
    label: 'Ethereum Mainnet',
    icon: TokenIcons.eth,
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    symbol: 'ONYX',
    destTokenAddress: Tokens.ONYX.address,
    minAmount: 10_000_000_000_000_000n,
    defaultAmount: '5',
    sourceTokenAddress: ONYX_ETHEREUM_ADDRESS,
  },
  {
    id: 'base',
    asset: 'ETH',
    chainId: '8453',
    denom: 'base-native',
    label: 'Base',
    icon: TokenIcons.base,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    symbol: 'ETH',
    destTokenAddress: Tokens.ETH.address,
    minAmount: MIN_ETH_AMOUNT,
    defaultAmount: DEFAULT_ETH_AMOUNT,
  },
  {
    id: 'arbitrum',
    asset: 'ETH',
    chainId: '42161',
    denom: 'arbitrum-native',
    label: 'Arbitrum',
    icon: TokenIcons.arbitrum,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    symbol: 'ETH',
    destTokenAddress: Tokens.ETH.address,
    minAmount: MIN_ETH_AMOUNT,
    defaultAmount: DEFAULT_ETH_AMOUNT,
  },
];

export const DISABLED_SOURCE_CHAIN_IDS = new Set(['10']);

export const BRIDGE_ASSET_OPTIONS: BridgeAssetOption[] = [
  { id: 'ETH', label: 'ETH', icon: TokenIcons.eth },
  { id: 'ONYX', label: 'ONYX', icon: TokenIcons.onyx },
];

export const DEFAULT_BRIDGE_ASSET: BridgeAssetId = 'ETH';

export const getChainOptionsForAsset = (asset: BridgeAssetId) =>
  SOURCE_CHAIN_OPTIONS.filter((option) => option.asset === asset);

export const getAssetsForChainId = (chainId: string) =>
  BRIDGE_ASSET_OPTIONS.filter((asset) =>
    SOURCE_CHAIN_OPTIONS.some((option) => option.chainId === chainId && option.asset === asset.id)
  );

export const getDefaultChainForAsset = (asset: BridgeAssetId, preferredChainId?: string) => {
  const enabled = getChainOptionsForAsset(asset).filter(
    (option) => !DISABLED_SOURCE_CHAIN_IDS.has(option.chainId)
  );
  const preferred = preferredChainId
    ? enabled.find((option) => option.chainId === preferredChainId)
    : undefined;
  return preferred ?? enabled[0];
};

////////////////
// VALIDATION

export const getMinBridgeAmountLabel = (option: EVMChainOption) =>
  `${formatEther(option.minAmount)} ${option.symbol}`;

export const getDestDenom = (option: EVMChainOption) => `evm/${option.destTokenAddress.slice(2)}`;

////////////////
// POLLING

export const POLL_INTERVAL_MS = 15_000;
export const DEGRADED_POLL_INTERVAL_MS = 45_000;
export const POLL_MAX_ATTEMPTS = 60;
export const STATUS_RECHECK_EVERY_ATTEMPTS = 4;
