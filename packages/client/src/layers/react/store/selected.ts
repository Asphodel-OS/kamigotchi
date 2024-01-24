import { EntityIndex } from '@latticexyz/recs';
import { create } from 'zustand';

export interface State {
  accountIndex: number;
  dialogueIndex: number;
  kamiIndex: number;
  listingEntityIndex: EntityIndex;
  nodeIndex: number;
  npcIndex: number;
  roomLocation: number;
}

interface Actions {
  setAccount: (accountIndex: number) => void;
  setDialogue: (dialogueIndex: number) => void;
  setKami: (kamiIndex: number) => void;
  setListing: (listingEntityIndex: EntityIndex) => void;
  setNode: (nodeIndex: number) => void;
  setNpc: (npcIndex: number) => void;
  setRoom: (roomLocation: number) => void;
}

export const useSelected = create<State & Actions>((set) => {
  const initialState: State = {
    accountIndex: 0 as number,
    dialogueIndex: 0 as number,
    kamiIndex: 0 as number,
    listingEntityIndex: 0 as EntityIndex,
    nodeIndex: 0 as number,
    npcIndex: 0 as number,
    roomLocation: 0 as number,
  };

  return {
    ...initialState,
    setAccount: (accountIndex: number) => set(
      (state: State) => ({ ...state, accountIndex })
    ),
    setDialogue: (dialogueIndex: number) => set(
      (state: State) => ({ ...state, dialogueIndex })
    ),
    setKami: (kamiIndex: number) => set(
      (state: State) => ({ ...state, kamiIndex })
    ),
    setListing: (listingEntityIndex: EntityIndex) => set(
      (state: State) => ({ ...state, listingEntityIndex })
    ),
    setNode: (nodeIndex: number) => set(
      (state: State) => ({ ...state, nodeIndex })
    ),
    setNpc: (npcIndex: number) => set(
      (state: State) => ({ ...state, npcIndex })
    ),
    setRoom: (roomLocation: number) => set(
      (state: State) => ({ ...state, roomLocation })
    ),
  };
});