import { EntityID, EntityIndex } from '@latticexyz/recs';
import create from 'zustand';

export interface AccountDetails {
  id: EntityID;
  index: EntityIndex;
  name: string;
  ownerAddress: string;
  operatorAddress: string;
}

export const emptyAccountDetails = (): AccountDetails => ({
  id: '' as EntityID,
  index: 0 as EntityIndex,
  name: '',
  ownerAddress: '',
  operatorAddress: '',
});

interface KamiAccount {
  details: AccountDetails;
}

interface KamiAccountActions {
  setDetails: (data: AccountDetails) => void;
}

export const useKamiAccount = create<KamiAccount & KamiAccountActions>((set) => {
  const initialState: KamiAccount = {
    details: emptyAccountDetails(),
  };
  return {
    ...initialState,
    setDetails: (data: AccountDetails) => set(
      (state: KamiAccount) => ({ ...state, details: data })
    ),
  };
});