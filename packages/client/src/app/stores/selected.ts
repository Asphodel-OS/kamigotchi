import { EntityIndex } from '@mud-classic/recs';
import { create } from 'zustand';

import { LeaderboardKey } from 'constants/leaderboards/leaderboards';

export interface State {
  accountIndex: number;
  dialogueIndex: number;
  goalIndex: number[];
  kamiIndex: number;
  listingEntityIndex: EntityIndex;
  nodeIndex: number;
  npcIndex: number;
  roomIndex: number;
  leaderboardKey: LeaderboardKey;
}

interface Actions {
  setAccount: (accountIndex: number) => void;
  setDialogue: (dialogueIndex: number) => void;
  setGoal: (goalIndex: number[]) => void;
  setKami: (kamiIndex: number) => void;
  setleaderboardKey: (leaderboardKey: LeaderboardKey) => void;
  setListing: (listingEntityIndex: EntityIndex) => void;
  setNode: (nodeIndex: number) => void;
  setNpc: (npcIndex: number) => void;
  setRoom: (roomIndex: number) => void;
}

export const useSelected = create<State & Actions>((set) => {
  const initialState: State = {
    accountIndex: 0 as number,
    dialogueIndex: 0 as number,
    goalIndex: [0] as number[],
    kamiIndex: 0 as number,
    leaderboardKey: 'default',
    listingEntityIndex: 0 as EntityIndex,
    nodeIndex: 0 as number,
    npcIndex: 0 as number,
    roomIndex: 0 as number,
  };

  return {
    ...initialState,
    setAccount: (accountIndex: number) => set((state: State) => ({ ...state, accountIndex })),
    setDialogue: (dialogueIndex: number) => set((state: State) => ({ ...state, dialogueIndex })),
    setGoal: (goalIndex: number[]) => set((state: State) => ({ ...state, goalIndex })),
    setKami: (kamiIndex: number) => set((state: State) => ({ ...state, kamiIndex })),
    setleaderboardKey: (leaderboardKey: LeaderboardKey) =>
      set((state: State) => ({ ...state, leaderboardKey })),
    setListing: (listingEntityIndex: EntityIndex) =>
      set((state: State) => ({ ...state, listingEntityIndex })),
    setNode: (nodeIndex: number) => set((state: State) => ({ ...state, nodeIndex })),
    setNpc: (npcIndex: number) => set((state: State) => ({ ...state, npcIndex })),
    setRoom: (roomIndex: number) => set((state: State) => ({ ...state, roomIndex })),
  };
});
