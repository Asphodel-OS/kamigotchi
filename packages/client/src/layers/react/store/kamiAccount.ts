import { EntityID, EntityIndex } from '@latticexyz/recs';
import { create } from 'zustand';


////////////////
// OVERVIEW

interface State {
  account: Account;
  validations: Validations;
}

interface Actions {
  setAccount: (data: Account) => void;
  setValidations: (data: Validations) => void;
}


////////////////
// ACCOUNT

export interface Account {
  id: EntityID;
  index: EntityIndex;
  name: string;
  ownerAddress: string;
  operatorAddress: string;
}

export const emptyAccountDetails = (): Account => ({
  id: '' as EntityID,
  index: 0 as EntityIndex,
  name: '',
  ownerAddress: '',
  operatorAddress: '',
});


////////////////
// VALIDATIONS
interface Validations {
  accountExists: boolean;
  operatorMatches: boolean;
  operatorHasGas: boolean;
}


////////////////
// SYNTHESIS

export const useKamiAccount = create<State & Actions>((set) => {
  const initialState: State = {
    account: emptyAccountDetails(),
    validations: {
      accountExists: false,
      operatorMatches: false,
      operatorHasGas: false,
    },
  };
  return {
    ...initialState,
    setAccount: (data: Account) => set(
      (state: State) => ({ ...state, account: data })
    ),
    setValidations: (data: Validations) => set(
      (state: State) => ({ ...state, validations: data })
    ),
  };
});