import { DefaultChain } from 'constants/chains';
import { Tokens } from 'constants/tokens';
import { Contract, JsonRpcProvider, getAddress, id as keccak256 } from 'ethers';
import { toBigInt } from 'utils/numbers';

////////////////
// CONFIG

const ROUTER_API_BASE_URL = 'https://router-api.initia.xyz/v2/fungible';
const BRIDGE_STATUS_URL = 'https://opinit-api-yominet-1.anvil.asia-southeast.initia.xyz/status';
export const BRIDGE_OPEN_REQUEST_EVENT = 'kamigotchi:bridge-open-request';
const YOMINET_CHAIN_ID = 'yominet-1';
const YOMINET_ETH_DENOM = `evm/${Tokens.ETH.address.slice(2)}`;
const YOMINET_RPC_URL = DefaultChain.rpcUrls.default.http[0] ?? '';
const YOMINET_ETH_TOKEN_ADDRESS = Tokens.ETH.address;
const BRIDGE_STATUS_KEYS = ['host', 'child', 'batch_submitter', 'da'] as const;

////////////////
// TYPES

type RouterApiPath = 'route' | 'msgs';
type BridgeOperation = Record<string, unknown>;
export type BridgeEvmTx = {
  chain_id: string;
  to: string;
  value: string;
  data: string;
  signer_address?: string;
  required_erc20_approvals?: unknown[];
};

export type BridgeCosmosTx = {
  chain_id: string;
  path: string[];
  msgs: Array<{ msg_type_url: string; msg: string }>;
  signer_address: string;
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
    cosmos_tx?: BridgeCosmosTx;
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
// RPC QUERIES

const providerCache = new Map<string, JsonRpcProvider>();
const yominetEthAbi = ['function balanceOf(address account) view returns (uint256)'];

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

export async function getYominetEthBalance(address: string): Promise<bigint> {
  const provider = getRpcProvider(YOMINET_RPC_URL);
  const contract = new Contract(YOMINET_ETH_TOKEN_ADDRESS, yominetEthAbi, provider);
  const balance = await contract.balanceOf(getAddress(address));
  return toBigInt(balance);
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

// adding this until we know how to check
// tx state from INITIA API
const TRANSFER_EVENT_TOPIC = keccak256('Transfer(address,address,uint256)');
const ZERO_ADDRESS_TOPIC = '0x' + '0'.repeat(64);

export async function getYominetBlockNumber(): Promise<number> {
  const provider = getRpcProvider(YOMINET_RPC_URL);
  return provider.getBlockNumber();
}

export async function hasReceivedYominetEthMintSince(
  address: string,
  fromBlock: number,
  expectedAmount: bigint
): Promise<string | null> {
  const provider = getRpcProvider(YOMINET_RPC_URL);
  const paddedAddress = '0x' + getAddress(address).slice(2).toLowerCase().padStart(64, '0');
  const logs = await provider.getLogs({
    address: YOMINET_ETH_TOKEN_ADDRESS,
    topics: [TRANSFER_EVENT_TOPIC, ZERO_ADDRESS_TOPIC, paddedAddress],
    fromBlock,
    toBlock: 'latest',
  });
  const match = logs.find((log) => BigInt(log.data) === expectedAmount);
  return match?.transactionHash ?? null;
}
