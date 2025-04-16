import { Signer } from 'ethers';
import { Address } from 'viem';
import { create } from 'zustand';

import { TxQueue } from 'engine/queue';
import { PlayerAPI, createPlayerAPI } from 'network/api';

export interface State {
  burnerAddress: Address;
  selectedAddress: Address;
  signer: Signer | any;
  validations: Validations;
  randNum: number;
  apis: Map<string, PlayerAPI>;
}

interface Actions {
  addAPI: (address: string, txQueue: TxQueue) => void;
  setSelectedAddress: (address: Address) => void;
  setBurnerAddress: (address: Address) => void;
  setValidations: (validations: Validations) => void;
  setSigner: (signer: Signer) => void;
}

// the result of  validations run on network state
interface Validations {
  authenticated: boolean;
  chainMatches: boolean;
}

export const useNetwork = create<State & Actions>((set) => {
  const initialState: State = {
    burnerAddress: '0x000000000000000000000000000000000000dEaD',
    selectedAddress: '0x000000000000000000000000000000000000dEaD',
    randNum: Math.random(),
    apis: new Map<string, PlayerAPI>(),
    validations: {
      authenticated: false,
      chainMatches: false,
    },
    signer: null,
  };

  return {
    ...initialState,
    setBurnerAddress: (burnerAddress: Address) =>
      set((state: State) => ({ ...state, burnerAddress })),
    setSelectedAddress: (selectedAddress: Address) =>
      set((state: State) => ({ ...state, selectedAddress })),
    setValidations: (validations: Validations) =>
      set((state: State) => ({ ...state, validations })),
    addAPI: (address: string, txQueue: TxQueue) =>
      set((state: State) => ({
        ...state,
        apis: new Map(state.apis).set(address, createPlayerAPI(txQueue)),
      })),
    setSigner: (signer: any) => set((state: State) => ({ ...state, signer })),
  };
});
