import create from 'zustand';

export interface VisibleButtons {
  chat: boolean;
  help: boolean;
  inventory: boolean;
  map: boolean;
  party: boolean;
  quests: boolean;
  settings: boolean;
}

export const toggleButtons = (isOn: boolean): VisibleButtons => ({
  chat: isOn,
  help: isOn,
  inventory: isOn,
  map: isOn,
  party: isOn,
  quests: isOn,
  settings: isOn,
});

export interface Fixtures {
  accountInfo: boolean,
  actionQueue: boolean,
}

export const toggleFixtures = (isOn: boolean): Fixtures => ({
  accountInfo: isOn,
  actionQueue: isOn,
});

export interface VisibleModals {
  bridgeERC20: boolean;
  bridgeERC721: boolean;
  buy: boolean;
  chat: boolean;
  dialogue: boolean;
  emaBoard: boolean;
  help: boolean;
  inventory: boolean;
  kami: boolean;
  kamiSkills: boolean;
  kamiMint: boolean;
  leaderboard: boolean;
  lootboxes: boolean;
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

export const toggleModals = (isOn: boolean): VisibleModals => ({
  bridgeERC20: isOn,
  bridgeERC721: isOn,
  buy: isOn,
  chat: isOn,
  dialogue: isOn,
  emaBoard: isOn,
  help: isOn,
  inventory: isOn,
  kami: isOn,
  kamiSkills: isOn,
  kamiMint: isOn,
  leaderboard: isOn,
  lootboxes: isOn,
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
  visibleButtons: VisibleButtons;
  fixtures: Fixtures;
  visibleModals: VisibleModals;
}

interface DataStoreActions {
  setVisibleModals: (data: VisibleModals) => void;
  setVisibleButtons: (data: VisibleButtons) => void;
  toggleVisibleButtons: (isOn: boolean) => void;
  toggleVisibleModals: (isOn: boolean) => void;
  toggleFixtures: (isOn: boolean) => void;
}

export const dataStore = create<DataStore & DataStoreActions>((set) => {
  const initialState: DataStore = {
    visibleModals: {
      bridgeERC20: false,
      bridgeERC721: false,
      buy: false,
      chat: false,
      dialogue: false,
      emaBoard: false,
      help: false,
      inventory: false,
      kami: false,
      kamiSkills: false,
      kamiMint: false,
      leaderboard: false,
      lootboxes: false,
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
      inventory: false,
      map: false,
      party: false,
      quests: false,
      settings: false,
    },
    fixtures: {
      accountInfo: false,
      actionQueue: false,
    },
  };

  return {
    ...initialState,
    setVisibleButtons: (data: VisibleButtons) =>
      set((state: DataStore) => ({ ...state, visibleButtons: data })),
    setVisibleModals: (data: VisibleModals) =>
      set((state: DataStore) => ({ ...state, visibleModals: data })),
    toggleVisibleButtons: (isOn: boolean) =>
      set((state: DataStore) => ({ ...state, visibleButtons: toggleButtons(isOn) })),
    toggleVisibleModals: (isOn: boolean) =>
      set((state: DataStore) => ({ ...state, visibleModals: toggleModals(isOn) })),
    toggleFixtures: (isOn: boolean) =>
      set((state: DataStore) => ({ ...state, fixtures: toggleFixtures(isOn) })),
  };
});
