import { create } from 'zustand';

import { TxQueue } from 'engine/types';
import { PlayerAPI, createPlayerAPI } from 'layers/network/api/player';
import { SystemTypes } from 'types/SystemTypes';

export interface State {
  burnerAddress: string;
  selectedAddress: string;
  validations: Validations;
  apis: Map<string, PlayerAPI>;
}

interface Actions {
  addAPI: (address: string, systems: TxQueue<SystemTypes>) => void;
  setSelectedAddress: (address: string) => void;
  setBurnerAddress: (address: string) => void;
  setValidations: (validations: Validations) => void;
}

// the result of  validations run on network state
interface Validations {
  authenticated: boolean;
  chainMatches: boolean;
}

export const useNetwork = create<State & Actions>((set) => {
  const initialState: State = {
    burnerAddress: '',
    selectedAddress: '',
    apis: new Map<string, PlayerAPI>(),
    validations: {
      authenticated: false,
      chainMatches: false,
    },
  };

  return {
    ...initialState,
    setBurnerAddress: (burnerAddress: string) =>
      set((state: State) => ({ ...state, burnerAddress })),
    setSelectedAddress: (selectedAddress: string) =>
      set((state: State) => ({ ...state, selectedAddress })),
    setValidations: (validations: Validations) =>
      set((state: State) => ({ ...state, validations })),
    addAPI: (address: string, systems: TxQueue<SystemTypes>) =>
      set((state: State) => ({
        ...state,
        apis: new Map(state.apis).set(address, createPlayerAPI(systems)),
      })),
  };
});
