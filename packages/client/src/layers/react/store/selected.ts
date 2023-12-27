import { EntityIndex } from '@latticexyz/recs';
import { create } from 'zustand';

export interface SelectedEntities {
  accountEntityIndex: EntityIndex;
  dialogueIndex: number;
  kamiEntityIndex: EntityIndex;
  listingEntityIndex: EntityIndex;
  nodeIndex: number;
  npcIndex: number;
  roomLocation: number;
}

interface Actions {
  setAccount: (accountEntityIndex: EntityIndex) => void;
  setDialogue: (dialogueIndex: number) => void;
  setKami: (kamiEntityIndex: EntityIndex) => void;
  setListing: (listingEntityIndex: EntityIndex) => void;
  setNode: (nodeIndex: number) => void;
  setNpc: (npcIndex: number) => void;
  setRoom: (roomLocation: number) => void;
}

export const useSelected = create<SelectedEntities & Actions>((set) => {
  const initialState: SelectedEntities = {
    accountEntityIndex: 0 as EntityIndex,
    dialogueIndex: 0 as number,
    kamiEntityIndex: 0 as EntityIndex,
    listingEntityIndex: 0 as EntityIndex,
    nodeIndex: 0 as number,
    npcIndex: 0 as number,
    roomLocation: 0 as number,
  };

  return {
    ...initialState,
    setAccount: (accountEntityIndex: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, accountEntityIndex })
    ),
    setDialogue: (dialogueIndex: number) => set(
      (state: SelectedEntities) => ({ ...state, dialogueIndex })
    ),
    setKami: (kamiEntityIndex: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, kamiEntityIndex })
    ),
    setListing: (listingEntityIndex: EntityIndex) => set(
      (state: SelectedEntities) => ({ ...state, listingEntityIndex })
    ),
    setNode: (nodeIndex: number) => set(
      (state: SelectedEntities) => ({ ...state, nodeIndex })
    ),
    setNpc: (npcIndex: number) => set(
      (state: SelectedEntities) => ({ ...state, npcIndex })
    ),
    setRoom: (roomLocation: number) => set(
      (state: SelectedEntities) => ({ ...state, roomLocation })
    ),
  };
});