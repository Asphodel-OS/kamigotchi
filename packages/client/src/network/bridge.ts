////////////////
// OVERVIEW

export const ROUTER_API_BASE_URL = 'https://router-api.initia.xyz/v2/fungible';
export const BRIDGE_STATUS_URL =
  'https://opinit-api-yominet-1.anvil.asia-southeast.initia.xyz/status';
export const BRIDGE_OPEN_REQUEST_EVENT = 'kamigotchi:bridge-open-request';
export const YOMINET_CHAIN_ID = 'yominet-1';
export const YOMINET_ETH_DENOM = 'evm/E1Ff7038eAAAF027031688E1535a055B2Bac2546';
const ROUTER_API_PATHS = ['route', 'msgs'] as const;
const BRIDGE_STATUS_KEYS = ['host', 'child', 'batch_submitter', 'da'] as const;

////////////////
// TYPES

type RouterApiPath = (typeof ROUTER_API_PATHS)[number];
type BridgeOperation = Record<string, unknown>;
type JsonRecord = Record<string, unknown>;
export type BridgeEvmTx = {
  chain_id: string;
  to: string;
  value: string;
  data: string;
  signer_address?: string;
  required_erc20_approvals?: unknown[];
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

export type BridgeRouteResponse = {
  operations: BridgeOperation[];
  amount_out?: string;
  required_chain_addresses?: string[];
} & Record<string, unknown>;

export type BridgeMsgsResponse = {
  txs?: Array<{
    operations_indices?: number[];
    evm_tx?: BridgeEvmTx;
  }>;
};

export type BridgeMsgsRequest = {
  operations: BridgeOperation[];
} & Record<string, unknown>;

export type BridgeServiceStatus = {
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
// UTILITIES

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function isOptionalArrayOf<T>(
  value: unknown,
  predicate: (item: unknown) => item is T
): value is T[] | undefined {
  return value === undefined || (Array.isArray(value) && value.every(predicate));
}

function isBridgeEvmTx(value: unknown): value is BridgeEvmTx {
  if (!isJsonRecord(value)) return false;

  return (
    typeof value.chain_id === 'string' &&
    typeof value.to === 'string' &&
    typeof value.value === 'string' &&
    typeof value.data === 'string' &&
    (value.signer_address === undefined || typeof value.signer_address === 'string') &&
    (value.required_erc20_approvals === undefined || Array.isArray(value.required_erc20_approvals))
  );
}

function isBridgeRouteResponse(value: unknown): value is BridgeRouteResponse {
  if (!isJsonRecord(value)) return false;
  return (
    Array.isArray(value.operations) &&
    (value.amount_out === undefined || typeof value.amount_out === 'string') &&
    isOptionalArrayOf(
      value.required_chain_addresses,
      (item): item is string => typeof item === 'string'
    )
  );
}

function isBridgeMsgsResponse(value: unknown): value is BridgeMsgsResponse {
  if (!isJsonRecord(value)) return false;
  if (value.txs === undefined) return true;
  if (!Array.isArray(value.txs)) return false;

  return value.txs.every((tx) => {
    if (!isJsonRecord(tx)) return false;
    if (
      !isOptionalArrayOf(tx.operations_indices, (item): item is number => typeof item === 'number')
    ) {
      return false;
    }

    return tx.evm_tx === undefined || isBridgeEvmTx(tx.evm_tx);
  });
}

////////////////
// REQUESTS

async function postRouterApi(path: RouterApiPath, body: Record<string, unknown>): Promise<unknown> {
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

  return response.json();
}

export async function fetchBridgeRoute(body: BridgeRouteRequest): Promise<BridgeRouteResponse> {
  const route = await postRouterApi('route', body);
  if (!isBridgeRouteResponse(route)) {
    throw new Error('Bridge route response has an unexpected shape');
  }

  return route;
}

export async function fetchBridgeMsgs(body: BridgeMsgsRequest): Promise<BridgeMsgsResponse> {
  const msgs = await postRouterApi('msgs', body);
  if (!isBridgeMsgsResponse(msgs)) {
    throw new Error('Bridge msgs response has an unexpected shape');
  }

  return msgs;
}

////////////////
// HEALTH

function interpretBridgeHealth(payload: unknown): BridgeServiceStatus {
  if (!isJsonRecord(payload)) {
    return { healthy: false, detail: 'Bridge status response has an unexpected shape' };
  }

  const syncingFlags = BRIDGE_STATUS_KEYS.map((key) => {
    const section = payload[key];
    if (!isJsonRecord(section) || !isJsonRecord(section.node)) return undefined;
    return section.node.syncing;
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
