import { BridgeUpdateEntry } from './constants';

export type PersistedBridgePolling = {
  sourceTxHash: string;
  expectedAmountOut: string;
  sourceChainId: string;
  yominetStartBlock: number;
  selectedAddress: string;
  updates: BridgeUpdateEntry[];
  timestamp: number;
  completed: boolean;
};

const BRIDGE_POLLING_KEY = 'bridge.polling';

export const saveBridgePolling = (data: PersistedBridgePolling) =>
  localStorage.setItem(BRIDGE_POLLING_KEY, JSON.stringify(data));

export const loadBridgePolling = (): PersistedBridgePolling | null => {
  try {
    const raw = localStorage.getItem(BRIDGE_POLLING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.sourceTxHash !== 'string' ||
      typeof parsed?.selectedAddress !== 'string' ||
      typeof parsed?.sourceChainId !== 'string' ||
      typeof parsed?.timestamp !== 'number' ||
      typeof parsed?.completed !== 'boolean'
    ) {
      return null;
    }
    return parsed as PersistedBridgePolling;
  } catch {
    return null;
  }
};

export const clearBridgePolling = () => localStorage.removeItem(BRIDGE_POLLING_KEY);
