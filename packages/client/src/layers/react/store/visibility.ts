import { create } from 'zustand';

////////////////
// OVERVIEW

interface State {
  buttons: Buttons;
  fixtures: Fixtures;
  modals: Modals;
  validators: Validators;
}

interface Actions {
  setButtons: (data: Buttons) => void;
  setFixtures: (data: Fixtures) => void;
  setModals: (data: Modals) => void;
  setValidators: (data: Validators) => void;
  toggleButtons: (isOn: boolean) => void;
  toggleModals: (isOn: boolean) => void;
  toggleFixtures: (isOn: boolean) => void;
}

////////////////
// BUTTONS

export interface Buttons {
  account: boolean;
  help: boolean;
  inventory: boolean;
  map: boolean;
  party: boolean;
  quests: boolean;
  settings: boolean;
  chat: boolean;
}

export const toggleButtons = (isOn: boolean): Buttons => ({
  account: isOn,
  help: isOn,
  inventory: isOn,
  map: isOn,
  party: isOn,
  quests: isOn,
  settings: isOn,
  chat: isOn,
});

////////////////
// FIXTURES

export interface Fixtures {
  header: boolean;
  actionQueue: boolean;
  notifications: boolean;
}

export const toggleFixtures = (isOn: boolean): Fixtures => ({
  header: isOn,
  actionQueue: isOn,
  notifications: isOn,
});

////////////////
// MODALS

export interface Modals {
  account: boolean;
  accountOperator: boolean;
  bridgeERC20: boolean;
  bridgeERC721: boolean;
  buy: boolean;
  chat: boolean;
  dialogue: boolean;
  emaBoard: boolean;
  gacha: boolean;
  help: boolean;
  inventory: boolean;
  kami: boolean;
  leaderboard: boolean;
  lootboxes: boolean;
  nameKami: boolean;
  map: boolean;
  merchant: boolean;
  node: boolean;
  operatorFund: boolean;
  party: boolean;
  quests: boolean;
  settings: boolean;
}

export const toggleModals = (isOn: boolean): Modals => ({
  account: isOn,
  accountOperator: isOn,
  bridgeERC20: isOn,
  bridgeERC721: isOn,
  buy: isOn,
  chat: isOn,
  dialogue: isOn,
  emaBoard: isOn,
  gacha: isOn,
  help: isOn,
  inventory: isOn,
  kami: isOn,
  leaderboard: isOn,
  lootboxes: isOn,
  nameKami: isOn,
  map: isOn,
  merchant: isOn,
  node: isOn,
  operatorFund: isOn,
  party: isOn,
  quests: isOn,
  settings: isOn,
});

////////////////
// VALIDATORS

export interface Validators {
  accountRegistrar: boolean;
  gasHarasser: boolean;
  operatorUpdater: boolean;
  walletConnector: boolean;
}

////////////////
// WAGMI WAGMI WAGMI WAGMI

export const useVisibility = create<State & Actions>((set) => {
  const initialState: State = {
    buttons: {
      account: false,
      chat: false,
      help: false,
      inventory: false,
      map: false,
      party: false,
      quests: false,
      settings: false,
    },
    fixtures: {
      header: false,
      actionQueue: false,
      notifications: true,
    },
    modals: {
      account: false,
      accountOperator: false,
      bridgeERC20: false,
      bridgeERC721: false,
      buy: false,
      chat: false,
      dialogue: false,
      emaBoard: false,
      gacha: false,
      help: false,
      inventory: false,
      kami: false,
      leaderboard: false,
      lootboxes: false,
      map: false,
      merchant: false,
      nameKami: false,
      node: false,
      operatorFund: false,
      party: false,
      quests: false,
      settings: false,
    },
    validators: {
      accountRegistrar: false,
      gasHarasser: false,
      operatorUpdater: false,
      walletConnector: false,
    },
  };

  return {
    ...initialState,
    setButtons: (data: Buttons) => set((state: State) => ({ ...state, buttons: data })),
    setFixtures: (data: Fixtures) => set((state: State) => ({ ...state, fixtures: data })),
    setModals: (data: Modals) => set((state: State) => ({ ...state, modals: data })),
    setValidators: (data: Validators) => set((state: State) => ({ ...state, validators: data })),
    toggleButtons: (isOn: boolean) =>
      set((state: State) => ({ ...state, buttons: toggleButtons(isOn) })),
    toggleFixtures: (isOn: boolean) =>
      set((state: State) => ({ ...state, fixtures: toggleFixtures(isOn) })),
    toggleModals: (isOn: boolean) =>
      set((state: State) => ({ ...state, modals: toggleModals(isOn) })),
  };
});
