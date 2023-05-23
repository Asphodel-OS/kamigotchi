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
  party: boolean;
  settings: boolean;
}

export interface VisibleModals {
  chat: boolean;
  dialogue: boolean;
  help: boolean;
  inventory: boolean;
  kami: boolean;
  kamiMint: boolean;
  kamiMintPost: boolean;
  kamisNaming: boolean;
  nameKami: boolean;
  map: boolean;
  merchant: boolean;
  node: boolean;
  operatorInfo: boolean;
  party: boolean;
  settings: boolean;
}

export interface DataStore {
  dialogue: Dialogue;
  selectedEntities: SelectedEntities;
  sound: SoundState;
  visibleModals: VisibleModals;
  visibleButtons: VisibleButtons;
  networks: Map<string, any>;
}

interface DataStoreActions {
  setDialogue: (data: Dialogue) => void;
  setVisibleModals: (data: VisibleModals) => void;
  setVisibleButtons: (data: VisibleButtons) => void;
  setSoundState: (data: SoundState) => void;
  setSelectedEntities: (data: SelectedEntities) => void;
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
      chat: false,
      dialogue: false,
      help: false,
      inventory: false,
      kami: false,
      kamiMint: false,
      kamiMintPost: false,
      kamisNaming: false,
      nameKami: false,
      map: false,
      merchant: false,
      node: false,
      operatorInfo: false,
      party: false,
      settings: false,
    },
    visibleButtons: {
      chat: false,
      help: false,
      map: false,
      party: false,
      settings: false,
    },
    networks: new Map<string, any>(),
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
  };
});