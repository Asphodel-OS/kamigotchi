import { create } from 'zustand';

export interface State {
  balances: Map<string, BalPair>;
  onyx: BalPair;
}

// expects whole number (after decimal processing)
export interface BalPair {
  allowance: number;
  balance: number;
}

interface Actions {
  set: (token: string, value: BalPair) => void;
  setOnyx: (onyx: BalPair) => void;
}

export const useTokens = create<State & Actions>((set) => {
  const initialState: State = {
    balances: new Map(),
    onyx: { allowance: 0, balance: 0 },
  };

  return {
    ...initialState,
    set: (token: string, value: BalPair) =>
      set((state: State) => ({ ...state, balances: new Map(state.balances).set(token, value) })),
    setOnyx: (value: BalPair) => set((state: State) => ({ ...state, onyx: value })),
  };
});
