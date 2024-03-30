import { create } from 'zustand';

import { PlayerAPI, createPlayerAPI } from 'layers/network/api/player';
import { TxQueue } from 'layers/network/workers';
import { SystemTypes } from 'types/SystemTypes';

export interface State {
  burner: Burner;
  selectedAddress: string;
  validations: Validations;
  apis: Map<string, PlayerAPI>;
}

interface Actions {
  addAPI: (address: string, systems: TxQueue<SystemTypes>) => void;
  setSelectedAddress: (address: string) => void;
  setBurner: (burner: Burner) => void;
  setValidations: (validations: Validations) => void;
}

// represents the burner EOA(s) detected in localstorage / connected to the network
// in-game txs originate from 'connected', which is set from the 'detected' one upon load
interface Burner {
  connected: {
    address: string;
  };
  detected: {
    address: string;
    key: string;
  };
}

// the result of  validations run on network state
interface Validations {
  authenticated: boolean;
  chainMatches: boolean;
  burnerMatches: boolean;
}

export const useNetwork = create<State & Actions>((set) => {
  const initialState: State = {
    burner: {
      connected: {
        address: '',
      },
      detected: {
        address: '',
        key: '',
      },
    },
    selectedAddress: '',
    apis: new Map<string, PlayerAPI>(),
    validations: {
      authenticated: false,
      chainMatches: false,
      burnerMatches: false,
    },
  };

  return {
    ...initialState,
    setBurner: (burner: Burner) => set((state: State) => ({ ...state, burner })),
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
