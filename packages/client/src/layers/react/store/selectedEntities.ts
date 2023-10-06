import { EntityIndex } from '@latticexyz/recs';
import create from 'zustand';

export interface SelectedEntities {
  accountEntityIndex: EntityIndex;
  kamiEntityIndex: EntityIndex;
  merchantEntityIndex: EntityIndex;
  nodeIndex: number;
  npcEntityIndex: EntityIndex;
  room: number;
}

interface Actions {
  setSelectedEntities: (selectedEntities: SelectedEntities) => void;
  setAccount: (accountEntityIndex: EntityIndex) => void;
  setKami: (kamiEntityIndex: EntityIndex) => void;
  setMerchant: (merchantEntityIndex: EntityIndex) => void;
  setNode: (nodeIndex: number) => void;
  setNpc: (npcEntityIndex: EntityIndex) => void;
  setRoom: (room: number) => void;
}

export const useSelectedEntities = create<SelectedEntities & Actions>((set) => {
  const initialState: SelectedEntities = {
    accountEntityIndex: 0 as EntityIndex,
    kamiEntityIndex: 0 as EntityIndex,
    merchantEntityIndex: 0 as EntityIndex,
    nodeIndex: 0 as EntityIndex,
    npcEntityIndex: 0 as EntityIndex,
    room: 0 as number,
  };

  return {
    ...initialState,
    setSelectedEntities: (selectedEntities: SelectedEntities) => set(
      (state: SelectedEntities) => ({ ...state, ...selectedEntities })
    ),
    setAccount: (accountEntityIndex: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, accountEntityIndex })
    ),
    setKami: (kamiEntityIndex: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, kamiEntityIndex })
    ),
    setMerchant: (merchantEntityIndex: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, merchantEntityIndex })
    ),
    setNode: (nodeIndex: number) => set(
      (state: SelectedEntities) => ({ ...state, nodeIndex })
    ),
    setNpc: (npcEntityIndex: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, npcEntityIndex })
    ),
    setRoom: (room: number) => set(
      (state: SelectedEntities) => ({ ...state, room })
    ),
  };
});