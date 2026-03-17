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
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearBridgePolling = () => localStorage.removeItem(BRIDGE_POLLING_KEY);
