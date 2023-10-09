import { EntityIndex } from '@latticexyz/recs';
import create from 'zustand';

export interface SelectedEntities {
  accountEntityIndex: EntityIndex;
  kamiEntityIndex: EntityIndex;
  nodeIndex: number;
  npcIndex: number;
  room: number;
}

interface Actions {
  setSelectedEntities: (selectedEntities: SelectedEntities) => void;
  setAccount: (accountEntityIndex: EntityIndex) => void;
  setKami: (kamiEntityIndex: EntityIndex) => void;
  setNode: (nodeIndex: number) => void;
  setNpc: (npcIndex: number) => void;
  setRoom: (room: number) => void;
}

export const useSelectedEntities = create<SelectedEntities & Actions>((set) => {
  const initialState: SelectedEntities = {
    accountEntityIndex: 0 as EntityIndex,
    kamiEntityIndex: 0 as EntityIndex,
    nodeIndex: 0 as number,
    npcIndex: 0 as number,
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
    setNode: (nodeIndex: number) => set(
      (state: SelectedEntities) => ({ ...state, nodeIndex })
    ),
    setNpc: (npcIndex: number) => set(
      (state: SelectedEntities) => ({ ...state, npcIndex })
    ),
    setRoom: (room: number) => set(
      (state: SelectedEntities) => ({ ...state, room })
    ),
  };
});