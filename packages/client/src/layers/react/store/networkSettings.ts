import create from 'zustand';

import { NetworkLayer } from 'src/layers/network/types';

interface BurnerSettings {
  connected: string;
  detected: string;
}

export interface NetworkSettings {
  burnerInfo: BurnerSettings;
  selectedAddress: string;
  networks: Map<string, NetworkLayer>;
}

interface Actions {
  setSelectedAddress: (address: string) => void;
  setBurnerInfo: (burnerInfo: BurnerSettings) => void;
}

export const useNetworkSettings = create<NetworkSettings & Actions>((set) => {
  const initialState: NetworkSettings = {
    burnerInfo: {
      connected: '',
      detected: '',
    },
    selectedAddress: '',
    networks: new Map<string, NetworkLayer>(),
  };

  return {
    ...initialState,
    setBurnerInfo: (burnerInfo: BurnerSettings) => set(
      (state: NetworkSettings) => ({ ...state, burnerInfo })
    ),
    setSelectedAddress: (selectedAddress: string) => set(
      (state: NetworkSettings) => ({ ...state, selectedAddress })
    ),
  };
});