import { create } from 'zustand';

export interface State {
  onyx: BalPair;
  init: BalPair;
}

// expects whole number (after decimal processing)
export interface BalPair {
  allowance: number;
  balance: number;
}

interface Actions {
  setOnyx: (onyx: BalPair) => void;
  setInit: (init: BalPair) => void;
}

export const useTokens = create<State & Actions>((set) => {
  const initialState: State = {
    onyx: { allowance: 0, balance: 0 },
    init: { allowance: 0, balance: 0 },
  };

  return {
    ...initialState,
    setOnyx: (value: BalPair) => set((state: State) => ({ ...state, onyx: value })),
    setInit: (value: BalPair) => set((state: State) => ({ ...state, init: value })),
  };
});
