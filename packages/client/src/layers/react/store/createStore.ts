import { EntityIndex } from '@latticexyz/recs';
import create from 'zustand';

export interface Dialogue {
  description: string[];
}

export interface Kami {
  description: string;
}

export interface RoomExits {
  up?: number;
  down?: number;
  left?: number;
  right?: number;
}

export interface VisibleModals {
  chat: boolean;
  dialogue: boolean;
  inventory: boolean;
  kamiMint: boolean;
  kamiMintPost: boolean;
  kami: boolean;
  map: boolean;
  merchant: boolean;
  node: boolean;
  party: boolean;
  operatorInfo: boolean;
  settingsButton: boolean;
  chatButton: boolean;
  partButton: boolean;
  helpButton: boolean;
  mapButton: boolean;
  nodeButton: boolean;
}

export interface SoundState {
  volume: number;
}

export interface SelectedEntities {
  kami: EntityIndex;
  node: EntityIndex;
  merchant: EntityIndex;
}

export interface StoreState {
  dialogue: Dialogue;
  roomExits: RoomExits;
  visibleModals: VisibleModals;
  sound: SoundState;
  selectedEntities: SelectedEntities;
}

interface StoreActions {
  setObjectData: (data: Dialogue) => void;
  setRoomExits: (data: RoomExits) => void;
  setVisibleModals: (data: VisibleModals) => void;
  setSoundState: (data: SoundState) => void;
  setSelectedEntities: (data: SelectedEntities) => void;
}

const nonExistingEntityIndex: EntityIndex = 0 as EntityIndex;

export const dataStore = create<StoreState & StoreActions>((set) => {
  const initialState: StoreState = {
    dialogue: { description: [] },
    roomExits: { up: 0, down: 0, left: 0, right: 0 },
    visibleModals: {
      chat: false,
      dialogue: false,
      inventory: false,
      kami: false,
      kamiMint: false,
      kamiMintPost: false,
      map: false,
      merchant: false,
      node: false,
      party: false,
      operatorInfo: false,
      settingsButton: false,
      helpButton: false,
      mapButton: false,
      partButton: false,
      chatButton: false,
      nodeButton: false,
    },
    sound: {
      volume: 0.7,
    },
    selectedEntities: {
      kami: nonExistingEntityIndex,
      node: nonExistingEntityIndex,
      merchant: nonExistingEntityIndex,
    },
  };

  return {
    ...initialState,
    setObjectData: (data: Dialogue) => set((state: StoreState) => ({ ...state, dialogue: data })),
    setRoomExits: (data: RoomExits) => set((state: StoreState) => ({ ...state, roomExits: data })),
    setVisibleModals: (data: VisibleModals) =>
      set((state: StoreState) => ({ ...state, visibleModals: data })),
    setSoundState: (data: SoundState) => set((state: StoreState) => ({ ...state, sound: data })),
    setSelectedEntities: (data: SelectedEntities) =>
      set((state: StoreState) => ({ ...state, selectedEntities: data })),
  };
});
