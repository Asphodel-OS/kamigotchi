import { EntityID, EntityIndex } from '@latticexyz/recs';
import { create } from 'zustand';

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

interface State {
  account: Account;
  validations: {
    accountExists: boolean;
    operatorMatches: boolean;
    operatorEmpty: boolean;
  };
}

interface Actions {
  setAccount: (data: Account) => void;
}

export const useKamiAccount = create<State & Actions>((set) => {
  const initialState: State = {
    account: emptyAccountDetails(),
    validations: {
      accountExists: false,
      operatorMatches: false,
      operatorEmpty: false,
    },
  };
  return {
    ...initialState,
    setAccount: (data: Account) => set(
      (state: State) => ({ ...state, account: data })
    ),
  };
});