import { EntityIndex } from '@latticexyz/recs';
import create from 'zustand';

export interface Dialogue {
  description: string[];
}

export interface SelectedEntities {
  kami: EntityIndex;
  node: EntityIndex;
  merchant: EntityIndex;
}

export interface SoundState {
  volume: number;
}

export interface VisibleButtons {
  chat: boolean;
  help: boolean;
  map: boolean;
  operatorInfo: boolean;
  party: boolean;
  settings: boolean;
}

export const visibleButtonsToggled = (isOn: boolean): VisibleButtons => ({
  chat: isOn,
  help: isOn,
  map: isOn,
  operatorInfo: isOn,
  party: isOn,
  settings: isOn,
});

export interface VisibleModals {
  bridgeERC20: boolean;
  bridgeERC721: boolean;
  chat: boolean;
  dialogue: boolean;
  help: boolean;
  inventory: boolean;
  kami: boolean;
  kamiMint: boolean;
  kamisNaming: boolean;
  nameKami: boolean;
  map: boolean;
  merchant: boolean;
  node: boolean;
  party: boolean;
  settings: boolean;
}

export const visibleModalsToggled = (isOn: boolean): VisibleModals => ({
  bridgeERC20: isOn,
  bridgeERC721: isOn,
  chat: isOn,
  dialogue: isOn,
  help: isOn,
  inventory: isOn,
  kami: isOn,
  kamiMint: isOn,
  kamisNaming: isOn,
  nameKami: isOn,
  map: isOn,
  merchant: isOn,
  node: isOn,
  party: isOn,
  settings: isOn,
});

export interface DataStore {
  dialogue: Dialogue;
  selectedEntities: SelectedEntities;
  sound: SoundState;
  visibleModals: VisibleModals;
  visibleButtons: VisibleButtons;
}

interface DataStoreActions {
  setDialogue: (data: Dialogue) => void;
  setVisibleModals: (data: VisibleModals) => void;
  setVisibleButtons: (data: VisibleButtons) => void;
  setSoundState: (data: SoundState) => void;
  setSelectedEntities: (data: SelectedEntities) => void;
  toggleVisibleButtons: (isOn: boolean) => void;
  toggleVisibleModals: (isOn: boolean) => void;
}

export const dataStore = create<DataStore & DataStoreActions>((set) => {
  const initialState: DataStore = {
    dialogue: { description: [] },
    selectedEntities: {
      kami: 0 as EntityIndex,
      node: 0 as EntityIndex,
      merchant: 0 as EntityIndex,
    },
    sound: { volume: 0.7 },
    visibleModals: {
      bridgeERC20: false,
      bridgeERC721: false,
      chat: false,
      dialogue: false,
      help: false,
      inventory: false,
      kami: false,
      kamiMint: false,
      kamisNaming: false,
      nameKami: false,
      map: false,
      merchant: false,
      node: false,
      party: false,
      settings: false,
    },
    visibleButtons: {
      chat: false,
      help: false,
      map: false,
      operatorInfo: false,
      party: false,
      settings: false,
    },
  };

  return {
    ...initialState,
    setDialogue: (data: Dialogue) => set(
      (state: DataStore) => ({ ...state, dialogue: data })
    ),
    setSelectedEntities: (data: SelectedEntities) => set(
      (state: DataStore) => ({ ...state, selectedEntities: data })
    ),
    setSoundState: (data: SoundState) => set(
      (state: DataStore) => ({ ...state, sound: data })
    ),
    setVisibleButtons: (data: VisibleButtons) => set(
      (state: DataStore) => ({ ...state, visibleButtons: data })
    ),
    setVisibleModals: (data: VisibleModals) => set(
      (state: DataStore) => ({ ...state, visibleModals: data })
    ),
    toggleVisibleButtons: (isOn: boolean) => set(
      (state: DataStore) => ({ ...state, visibleButtons: visibleButtonsToggled(isOn) })
    ),
    toggleVisibleModals: (isOn: boolean) => set(
      (state: DataStore) => ({ ...state, visibleModals: visibleModalsToggled(isOn) })
    ),
  };
});