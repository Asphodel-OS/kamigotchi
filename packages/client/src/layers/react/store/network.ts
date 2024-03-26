import { create } from 'zustand';

import { createAdminAPI } from 'layers/network/api/admin';
import { createPlayerAPI } from 'layers/network/api/player';
import { TxQueue } from 'layers/network/workers';
import { NetworkLayer } from 'src/layers/network/types';
import { SystemTypes } from 'types/SystemTypes';

export interface State {
  burner: Burner;
  selectedAddress: string;
  networks: Map<string, NetworkLayer>;
  validations: Validations;
  apis: Map<string, API>;
}

interface API {
  admin: any;
  player: any;
}

interface Actions {
  addAPI: (address: string, systems: TxQueue<SystemTypes>) => void;
  addNetwork: (address: string, network: NetworkLayer) => void;
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
  isConnected: boolean;
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
    networks: new Map<string, NetworkLayer>(),
    apis: new Map<string, API>(),
    validations: {
      isConnected: false,
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
    addNetwork: (address: string, network: NetworkLayer) =>
      set((state: State) => ({
        ...state,
        networks: new Map(state.networks).set(address, network),
      })),
    addAPI: (address: string, systems: TxQueue<SystemTypes>) =>
      set((state: State) => ({
        ...state,
        apis: new Map(state.apis).set(address, {
          admin: createAdminAPI(systems),
          player: createPlayerAPI(systems),
        }),
      })),
  };
});
