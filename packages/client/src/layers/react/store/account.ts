import { EntityID, EntityIndex } from '@latticexyz/recs';
import { create } from 'zustand';



////////////////
// OVERVIEW

// as well as the validations run on 
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

// represents the key meta details of a kami account
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