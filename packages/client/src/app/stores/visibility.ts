import { create } from 'zustand';

////////////////
// OVERVIEW

interface State {
  fixtures: Fixtures;
  modals: Modals;
  validators: Validators;
}

interface Actions {
  setFixtures: (data: Partial<Fixtures>) => void;
  setModals: (data: Partial<Modals>) => void;
  setValidators: (data: Partial<Validators>) => void;
  toggleModals: (isOn: boolean) => void;
  toggleFixtures: (isOn: boolean) => void;
}

////////////////
// FIXTURES

export interface Fixtures {
  actionQueue: boolean;
  header: boolean;
  menu: boolean;
  notifications: boolean;
}

export const toggleFixtures = (isOn: boolean): Fixtures => ({
  actionQueue: isOn,
  header: isOn,
  menu: isOn,
  notifications: isOn,
});

////////////////
// MODALS

export interface Modals {
  account: boolean;
  bridgeERC20: boolean;
  bridgeERC721: boolean;
  chat: boolean;
  crafting: boolean;
  dialogue: boolean;
  emaBoard: boolean;
  gacha: boolean;
  goal: boolean;
  help: boolean;
  inventory: boolean;
  kami: boolean;
  leaderboard: boolean;
  map: boolean;
  merchant: boolean;
  node: boolean;
  operatorFund: boolean;
  party: boolean;
  quests: boolean;
  reveal: boolean;
  settings: boolean;
  presale: boolean;
  trading: boolean;
}

export const toggleModals = (isOn: boolean): Modals => ({
  account: isOn,
  bridgeERC20: isOn,
  bridgeERC721: isOn,
  chat: isOn,
  crafting: isOn,
  dialogue: isOn,
  emaBoard: isOn,
  gacha: isOn,
  goal: isOn,
  help: isOn,
  inventory: isOn,
  kami: isOn,
  leaderboard: isOn,
  map: isOn,
  merchant: isOn,
  node: isOn,
  operatorFund: isOn,
  party: isOn,
  quests: isOn,
  reveal: isOn,
  settings: isOn,
  presale: isOn,
  trading: isOn,
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
    fixtures: {
      actionQueue: false,
      header: false,
      menu: false,
      notifications: true,
    },
    modals: {
      account: false,
      bridgeERC20: false,
      bridgeERC721: false,
      chat: false,
      crafting: false,
      dialogue: false,
      emaBoard: false,
      gacha: false,
      goal: false,
      help: false,
      inventory: false,
      kami: false,
      leaderboard: false,
      map: false,
      merchant: false,
      node: false,
      operatorFund: false,
      party: false,
      quests: false,
      reveal: false,
      settings: false,
      presale: false,
      trading: false,
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
    setFixtures: (data: Partial<Fixtures>) =>
      set((state: State) => ({ ...state, fixtures: { ...state.fixtures, ...data } })),
    setModals: (data: Partial<Modals>) =>
      set((state: State) => ({ ...state, modals: { ...state.modals, ...data } })),
    setValidators: (data: Partial<Validators>) =>
      set((state: State) => ({ ...state, validators: { ...state.validators, ...data } })),
    toggleFixtures: (isOn: boolean) =>
      set((state: State) => ({ ...state, fixtures: toggleFixtures(isOn) })),
    toggleModals: (isOn: boolean) =>
      set((state: State) => ({ ...state, modals: toggleModals(isOn) })),
  };
});
