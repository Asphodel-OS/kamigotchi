import create from 'zustand';

import { NetworkLayer } from 'src/layers/network/types';


export interface State {
  burnerInfo: BurnerSettings;
  selectedAddress: string;
  networks: Map<string, NetworkLayer>;
  validations: Validations;
}

interface Actions {
  addNetwork: (address: string, network: NetworkLayer) => void;
  setSelectedAddress: (address: string) => void;
  setBurnerInfo: (burnerInfo: BurnerSettings) => void;
  setValidations: (validations: Validations) => void;
}

interface BurnerSettings {
  connected: string;
  detected: string;
  detectedPrivateKey: string;
}

interface Validations {
  isConnected: boolean;
  chainMatches: boolean;
  burnerMatches: boolean;
}

export const useNetworkSettings = create<State & Actions>((set) => {
  const initialState: State = {
    burnerInfo: {
      connected: '',
      detected: '',
      detectedPrivateKey: '',
    },
    selectedAddress: '',
    networks: new Map<string, NetworkLayer>(),
    validations: {
      isConnected: false,
      burnerMatches: false,
      chainMatches: false,
    }
  };

  return {
    ...initialState,
    setBurnerInfo: (burnerInfo: BurnerSettings) => set(
      (state: State) => ({ ...state, burnerInfo })
    ),
    setSelectedAddress: (selectedAddress: string) => set(
      (state: State) => ({ ...state, selectedAddress })
    ),
    setValidations: (validations: Validations) => set(
      (state: State) => ({ ...state, validations })
    ),
    addNetwork: (address: string, network: NetworkLayer) => set(
      (state: State) => ({
        ...state,
        networks: new Map(state.networks).set(address, network),
      })
    ),
  };
});