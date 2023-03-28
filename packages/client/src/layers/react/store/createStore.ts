import create from 'zustand';

export interface Dialogue {
  description: string;
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
  kami: boolean;
  map: boolean;
  merchant: boolean;
  party: boolean;
}

export interface SoundState {
  volume: number;
}

export interface StoreState {
  dialogue: Dialogue;
  roomExits: RoomExits;
  selectedKami: Dialogue;
  visibleModals: VisibleModals;
  sound: SoundState;
}

interface StoreActions {
  setObjectData: (data: Dialogue) => void;
  setRoomExits: (data: RoomExits) => void;
  setSelectedKami: (data: Dialogue) => void;
  setVisibleModals: (data: VisibleModals) => void;
  setSoundState: (data: SoundState) => void;
}

export const dataStore = create<StoreState & StoreActions>((set) => {
  const initialState: StoreState = {
    dialogue: { description: '' },
    roomExits: { up: 0, down: 0, left: 0, right: 0 },
    selectedKami: { description: '' },
    visibleModals: {
      chat: false,
      dialogue: false,
      inventory: false,
      kami: false,
      kamiMint: false,
      map: false,
      merchant: false,
      party: false,
    },
    sound: {
      volume: 0.7,
    },
  };

  return {
    ...initialState,
    setObjectData: (data: Dialogue) =>
      set((state: StoreState) => ({ ...state, dialogue: data })),
    setRoomExits: (data: RoomExits) =>
      set((state: StoreState) => ({ ...state, roomExits: data })),
    setSelectedKami: (data: Dialogue) =>
      set((state: StoreState) => ({ ...state, dialogue: data })),
    setVisibleModals: (data: VisibleModals) =>
      set((state: StoreState) => ({ ...state, visibleModals: data })),
    setSoundState: (data: SoundState) =>
      set((state: StoreState) => ({ ...state, sound: data })),
  };
});
