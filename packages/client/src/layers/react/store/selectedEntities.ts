import { EntityIndex } from '@latticexyz/recs';
import create from 'zustand';

export interface SelectedEntities {
  account: EntityIndex;
  kami: EntityIndex;
  merchant: EntityIndex;
  node: EntityIndex;
  npc: EntityIndex;
  room: number;
}

interface Actions {
  setSelectedEntities: (selectedEntities: SelectedEntities) => void;
  setAccount: (account: EntityIndex) => void;
  setKami: (kami: EntityIndex) => void;
  setMerchant: (merchant: EntityIndex) => void;
  setNode: (node: EntityIndex) => void;
  setNpc: (npc: EntityIndex) => void;
  setRoom: (room: number) => void;
}

export const useSelectedEntities = create<SelectedEntities & Actions>((set) => {
  const initialState: SelectedEntities = {
    account: 0 as EntityIndex,
    kami: 0 as EntityIndex,
    merchant: 0 as EntityIndex,
    node: 0 as EntityIndex,
    npc: 0 as EntityIndex,
    room: 0 as number,
  };

  return {
    ...initialState,
    setSelectedEntities: (selectedEntities: SelectedEntities) => set(
      (state: SelectedEntities) => ({ ...state, ...selectedEntities })
    ),
    setAccount: (account: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, account })
    ),
    setKami: (kami: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, kami })
    ),
    setMerchant: (merchant: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, merchant })
    ),
    setNode: (node: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, node })
    ),
    setNpc: (npc: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, npc })
    ),
    setRoom: (room: number) => set(
      (state: SelectedEntities) => ({ ...state, room })
    ),
  };
});