import { Contract, Interface, JsonRpcProvider, getAddress } from 'ethers';
import { erc20Abi } from 'viem';
import { DefaultChain } from 'constants/chains';
import { Tokens } from 'constants/tokens';
import { toBigInt } from 'utils/numbers';

////////////////
// CONFIG

const ROUTER_API_ROOT = 'https://router-api.initia.xyz';
const ROUTER_API_BASE_URL = `${ROUTER_API_ROOT}/v2/fungible`;
const BRIDGE_STATUS_URL =
  'https://opinit-api-yominet-1.anvil.asia-southeast.initia.xyz/status';
export const BRIDGE_OPEN_REQUEST_EVENT = 'kamigotchi:bridge-open-request';
const YOMINET_CHAIN_ID = 'yominet-1';
const YOMINET_ETH_DENOM = `evm/${Tokens.ETH.address.slice(2)}`;
const YOMINET_RPC_URL = DefaultChain.rpcUrls.default.http[0] ?? '';
const BRIDGE_STATUS_KEYS = ['host', 'child', 'batch_submitter', 'da'] as const;

////////////////
// TYPES

type RouterApiPath = 'route' | 'msgs';
type BridgeOperation = Record<string, unknown>;

export type BridgeErc20Approval = {
  amount: string;
  spender: string;
  token_contract: string;
};

export type BridgeEvmTx = {
  chain_id: string;
  to: string;
  value: string;
  data: string;
  signer_address?: string;
  required_erc20_approvals?: BridgeErc20Approval[];
};

export type BridgeRouteRequest = {
  source_asset_denom: string;
  source_asset_chain_id: string;
  dest_asset_denom: string;
  dest_asset_chain_id: string;
  amount_in: string;
  allow_multi_tx: boolean;
  smart_relay: boolean;
  allow_unsafe: boolean;
};

type BridgeRouteResponse = {
  operations: BridgeOperation[];
  amount_out?: string;
  required_chain_addresses?: string[];
} & Record<string, unknown>;

type BridgeMsgsResponse = {
  txs?: Array<{
    operations_indices?: number[];
    evm_tx?: BridgeEvmTx;
  }>;
};

type BridgeMsgsRequest = {
  operations: BridgeOperation[];
} & Record<string, unknown>;

type BridgeServiceStatus = {
  healthy: boolean;
  detail?: string;
};

export type BridgeOpenerOptions = {
  routeRequest?: Partial<BridgeRouteRequest>;
};

export function isBridgeOpenDetail(value: unknown): value is BridgeOpenerOptions {
  return typeof value === 'object' && value !== null;
}

////////////////
// DEFAULTS

const defaultBridgeRouteRequest: BridgeRouteRequest = {
  source_asset_denom: 'ethereum-native',
  source_asset_chain_id: '1',
  dest_asset_denom: YOMINET_ETH_DENOM,
  dest_asset_chain_id: YOMINET_CHAIN_ID,
  amount_in: '1000000000000000',
  allow_multi_tx: true,
  smart_relay: true,
  allow_unsafe: false,
};

export function buildBridgeRouteRequest(
  overrides: Partial<BridgeRouteRequest> = {}
): BridgeRouteRequest {
  return { ...defaultBridgeRouteRequest, ...overrides };
}

////////////////
// REQUESTS

async function postRouterApi<T>(path: RouterApiPath, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${ROUTER_API_BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    throw new Error(`Bridge ${path} request failed (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchBridgeRoute(body: BridgeRouteRequest): Promise<BridgeRouteResponse> {
  const route = await postRouterApi<BridgeRouteResponse>('route', body);
  if (!route || typeof route !== 'object' || !Array.isArray(route.operations)) {
    throw new Error('Bridge route response has an unexpected shape');
  }
  if (
    route.required_chain_addresses !== undefined &&
    !Array.isArray(route.required_chain_addresses)
  ) {
    throw new Error('Bridge route response has an unexpected shape');
  }

  return route;
}

export async function fetchBridgeMsgs(body: BridgeMsgsRequest): Promise<BridgeMsgsResponse> {
  const msgs = await postRouterApi<BridgeMsgsResponse>('msgs', body);
  if (!msgs || typeof msgs !== 'object') {
    throw new Error('Bridge msgs response has an unexpected shape');
  }
  if (msgs.txs !== undefined && !Array.isArray(msgs.txs)) {
    throw new Error('Bridge msgs response has an unexpected shape');
  }

  return msgs;
}

////////////////
// HEALTH

function interpretBridgeHealth(payload: unknown): BridgeServiceStatus {
  if (!payload || typeof payload !== 'object') {
    return { healthy: false, detail: 'Bridge status response has an unexpected shape' };
  }

  const payloadRecord = payload as Record<string, { node?: { syncing?: unknown } }>;
  const syncingFlags = BRIDGE_STATUS_KEYS.map((key) => {
    return payloadRecord[key]?.node?.syncing;
  });

  if (syncingFlags.every((flag) => flag === false)) {
    return { healthy: true };
  }

  return {
    healthy: false,
    detail: 'Bridge status indicates one or more services are syncing',
  };
}

export async function getBridgeServiceStatus(): Promise<BridgeServiceStatus> {
  try {
    const response = await fetch(BRIDGE_STATUS_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return {
        healthy: false,
        detail: `Bridge status API unavailable (${response.status})`,
      };
    }

    const json: unknown = await response.json().catch(() => null);
    return interpretBridgeHealth(json);
  } catch (error) {
    return { healthy: false, detail: error instanceof Error ? error.message : 'Unknown error' };
  }
}

////////////////
// TRANSFER TRACKING

export type BridgeTransferState = 'pending' | 'success' | 'failed';

const TRACK_MAX_ATTEMPTS = 60;
const TRACK_RETRY_INTERVAL_MS = 5_000;

const TRANSFER_SUCCESS_STATES = new Set(['STATE_COMPLETED', 'STATE_COMPLETED_SUCCESS']);
const TRANSFER_FAILED_STATES = new Set([
  'STATE_COMPLETED_ERROR',
  'STATE_ABANDONED',
  'STATE_PENDING_ERROR',
]);

export async function trackBridgeTransaction(chainId: string, txHash: string): Promise<boolean> {
  for (let attempt = 0; attempt < TRACK_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${ROUTER_API_ROOT}/v2/tx/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_hash: txHash, chain_id: chainId }),
      });
      if (response.ok) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, TRACK_RETRY_INTERVAL_MS));
  }
  return false;
}

function findDestinationTxHash(value: unknown, destChainId: string): string | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findDestinationTxHash(entry, destChainId);
      if (found) return found;
    }
    return undefined;
  }

  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (record.chain_id === destChainId && typeof record.tx_hash === 'string') {
    return record.tx_hash;
  }

  for (const nested of Object.values(record)) {
    const found = findDestinationTxHash(nested, destChainId);
    if (found) return found;
  }
  return undefined;
}

function readTransferState(payload: Record<string, unknown>): string | undefined {
  const transfers = payload.transfers;
  const firstTransfer = Array.isArray(transfers) ? transfers[0] : undefined;
  const fromTransfer =
    firstTransfer && typeof firstTransfer === 'object'
      ? (firstTransfer as Record<string, unknown>).state
      : undefined;

  return [payload.status, payload.state, fromTransfer].find(
    (candidate): candidate is string => typeof candidate === 'string'
  );
}

export async function getBridgeTransferState(
  chainId: string,
  txHash: string
): Promise<{ state: BridgeTransferState; destTxHash?: string }> {
  const params = new URLSearchParams({ tx_hash: txHash, chain_id: chainId });

  const response = await fetch(`${ROUTER_API_ROOT}/v2/tx/status?${params.toString()}`).catch(
    () => null
  );
  if (!response) return { state: 'pending' };

  if (!response.ok) return { state: 'pending' };

  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== 'object') return { state: 'pending' };

  const record = payload as Record<string, unknown>;
  const rawState = readTransferState(record);
  if (rawState && TRANSFER_FAILED_STATES.has(rawState)) return { state: 'failed' };
  if (!rawState || !TRANSFER_SUCCESS_STATES.has(rawState)) return { state: 'pending' };

  return { state: 'success', destTxHash: findDestinationTxHash(record, YOMINET_CHAIN_ID) };
}

////////////////
// RPC QUERIES

const providerCache = new Map<string, JsonRpcProvider>();
const erc20Interface = new Interface(erc20Abi);

function getRpcProvider(rpcUrl: string): JsonRpcProvider {
  // putting this here because
  // we are checking balance every 5 seconds
  const cached = providerCache.get(rpcUrl);
  if (cached) return cached;

  const provider = new JsonRpcProvider(rpcUrl);
  providerCache.set(rpcUrl, provider);
  return provider;
}

export type SourceTransactionStatus = 'pending' | 'success' | 'reverted';

export async function getNativeBalance(rpcUrl: string, address: string): Promise<bigint> {
  const provider = getRpcProvider(rpcUrl);
  return provider.getBalance(getAddress(address));
}

export async function getErc20Balance(
  rpcUrl: string,
  tokenAddress: string,
  address: string
): Promise<bigint> {
  const provider = getRpcProvider(rpcUrl);
  const contract = new Contract(getAddress(tokenAddress), erc20Abi, provider);
  const balance = await contract.balanceOf(getAddress(address));
  return toBigInt(balance);
}

export async function getErc20Allowance(
  rpcUrl: string,
  tokenAddress: string,
  owner: string,
  spender: string
): Promise<bigint> {
  const provider = getRpcProvider(rpcUrl);
  const contract = new Contract(getAddress(tokenAddress), erc20Abi, provider);
  const allowance = await contract.allowance(getAddress(owner), getAddress(spender));
  return toBigInt(allowance);
}

export function encodeErc20Approve(spender: string, amount: bigint): string {
  return erc20Interface.encodeFunctionData('approve', [getAddress(spender), amount]);
}

export async function getYominetTokenBalance(
  tokenAddress: string,
  address: string
): Promise<bigint> {
  return getErc20Balance(YOMINET_RPC_URL, tokenAddress, address);
}

const RECEIPT_POLL_INTERVAL_MS = 3_000;
const RECEIPT_POLL_MAX_ATTEMPTS = 100;

export async function waitForSourceTransaction(
  rpcUrl: string,
  txHash: string,
  signal?: AbortSignal
): Promise<void> {
  for (let attempt = 0; attempt < RECEIPT_POLL_MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) return;
    const status = await getSourceTransactionStatus(rpcUrl, txHash);
    if (status === 'success') return;
    if (status === 'reverted') throw new Error(`Transaction ${txHash} reverted.`);
    await new Promise((resolve) => setTimeout(resolve, RECEIPT_POLL_INTERVAL_MS));
  }
  throw new Error(`Timed out waiting for transaction ${txHash} to confirm.`);
}

export async function getSourceTransactionStatus(
  rpcUrl: string,
  txHash: string
): Promise<SourceTransactionStatus> {
  const provider = getRpcProvider(rpcUrl);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt) return 'pending';
  const receiptStatus = Number(receipt.status);
  if (receiptStatus === 1) return 'success';
  if (receiptStatus === 0) return 'reverted';
  return 'pending';
}
