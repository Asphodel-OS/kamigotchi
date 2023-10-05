import { EntityIndex } from '@latticexyz/recs';
import create from 'zustand';

export interface Dialogue {
  description: string[];
}

export interface VisibleButtons {
  chat: boolean;
  help: boolean;
  map: boolean;
  operatorInfo: boolean;
  party: boolean;
  quests: boolean;
  settings: boolean;
}

export const visibleButtonsToggled = (isOn: boolean): VisibleButtons => ({
  chat: isOn,
  help: isOn,
  map: isOn,
  operatorInfo: isOn,
  party: isOn,
  quests: isOn,
  settings: isOn,
});

export interface VisibleModals {
  bridgeERC20: boolean;
  bridgeERC721: boolean;
  chat: boolean;
  dialogue: boolean;
  emaBoard: boolean;
  help: boolean;
  inventory: boolean;
  kami: boolean;
  kamiSkills: boolean;
  kamiMint: boolean;
  leaderboard: boolean;
  nameKami: boolean;
  map: boolean;
  merchant: boolean;
  node: boolean;
  operatorFund: boolean;
  operatorUpdater: boolean;
  party: boolean;
  quests: boolean;
  roomMovement: boolean;
  settings: boolean;
}

export const visibleModalsToggled = (isOn: boolean): VisibleModals => ({
  bridgeERC20: isOn,
  bridgeERC721: isOn,
  chat: isOn,
  dialogue: isOn,
  emaBoard: isOn,
  help: isOn,
  inventory: isOn,
  kami: isOn,
  kamiSkills: isOn,
  kamiMint: isOn,
  leaderboard: isOn,
  nameKami: isOn,
  map: isOn,
  merchant: isOn,
  node: isOn,
  operatorFund: isOn,
  operatorUpdater: isOn,
  party: isOn,
  quests: isOn,
  roomMovement: isOn,
  settings: isOn,
});

export interface DataStore {
  dialogue: Dialogue;
  visibleModals: VisibleModals;
  visibleButtons: VisibleButtons;
}

interface DataStoreActions {
  setDialogue: (data: Dialogue) => void;
  setVisibleModals: (data: VisibleModals) => void;
  setVisibleButtons: (data: VisibleButtons) => void;
  toggleVisibleButtons: (isOn: boolean) => void;
  toggleVisibleModals: (isOn: boolean) => void;
}

export const dataStore = create<DataStore & DataStoreActions>((set) => {
  const initialState: DataStore = {
    dialogue: { description: [] },
    visibleModals: {
      bridgeERC20: false,
      bridgeERC721: false,
      chat: false,
      dialogue: false,
      emaBoard: false,
      help: false,
      inventory: false,
      kami: false,
      kamiSkills: false,
      kamiMint: false,
      leaderboard: false,
      map: false,
      merchant: false,
      nameKami: false,
      node: false,
      operatorFund: true,
      operatorUpdater: false,
      party: false,
      quests: false,
      roomMovement: false,
      settings: false,
    },
    visibleButtons: {
      chat: false,
      help: false,
      map: false,
      operatorInfo: false,
      party: false,
      quests: false,
      settings: false,
    },
  };

  return {
    ...initialState,
    setDialogue: (data: Dialogue) => set((state: DataStore) => ({ ...state, dialogue: data })),
    setVisibleButtons: (data: VisibleButtons) =>
      set((state: DataStore) => ({ ...state, visibleButtons: data })),
    setVisibleModals: (data: VisibleModals) =>
      set((state: DataStore) => ({ ...state, visibleModals: data })),
    toggleVisibleButtons: (isOn: boolean) =>
      set((state: DataStore) => ({ ...state, visibleButtons: visibleButtonsToggled(isOn) })),
    toggleVisibleModals: (isOn: boolean) =>
      set((state: DataStore) => ({ ...state, visibleModals: visibleModalsToggled(isOn) })),
  };
});
