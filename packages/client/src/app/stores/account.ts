import { EntityID, EntityIndex } from '@mud-classic/recs';
import { create } from 'zustand';

////////////////
// OVERVIEW

// as well as the validations run on
interface State {
  account: Account;
  farcaster: Farcaster; // kinda gross to have this in here
  validations: Validations;
  debug: Debug;
}

interface Actions {
  setAccount: (data: Account) => void;
  setDebug: (data: Debug) => void;
  setFarcaster: (data: Farcaster) => void;
  setValidations: (data: Validations) => void;
}

////////////////
// ACCOUNT

// represents the key meta details of a kami account
export interface Account {
  id: EntityID;
  entity: EntityIndex;
  index: number;
  name: string;
  ownerAddress: string;
  operatorAddress: string;
}

export const emptyAccountDetails = (): Account => ({
  id: '' as EntityID,
  entity: 0 as EntityIndex,
  index: 0,
  name: '',
  ownerAddress: '',
  operatorAddress: '',
});

interface Debug {
  cache: boolean;
}

////////////////
// FARCASTER

export interface Farcaster {
  id: number;
  signer: string; // neynar signer uuid
}

////////////////
// VALIDATIONS

// represents the result of key validations run on a connected set of EOAs
interface Validations {
  accountExists: boolean;
  operatorMatches: boolean;
  operatorHasGas: boolean;
}

////////////////
// SYNTHESIS

export const useAccount = create<State & Actions>((set) => {
  const initialState: State = {
    account: emptyAccountDetails(),
    debug: { cache: false },
    farcaster: { id: 0, signer: '' },
    validations: {
      accountExists: false,
      operatorMatches: false,
      operatorHasGas: false,
    },
  };
  return {
    ...initialState,
    setAccount: (data: Account) => set((state: State) => ({ ...state, account: data })),
    setDebug: (data: Debug) => set((state: State) => ({ ...state, debug: data })),
    setFarcaster: (data: Farcaster) => set((state: State) => ({ ...state, farcaster: data })),
    setValidations: (data: Validations) => set((state: State) => ({ ...state, validations: data })),
  };
});
