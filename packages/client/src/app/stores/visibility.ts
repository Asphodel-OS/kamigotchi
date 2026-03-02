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
  animationStudio: boolean;
  gacha: boolean;
  goal: boolean;
  help: boolean;
  inventory: boolean;
  kami: boolean;
  kamiAdoptionAgency: boolean;
  kamiSend: boolean;
  leaderboard: boolean;
  lootBox: boolean;
  marketplace: boolean;
  templeOfTheWheel: boolean;
  map: boolean;
  merchant: boolean;
  node: boolean;
  questDialogue: boolean;
  operatorFund: boolean;
  party: boolean;
  presale: boolean;
  quests: boolean;
  reveal: boolean;
  settings: boolean;
  tokenPortal: boolean;
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
  animationStudio: isOn,
  gacha: isOn,
  goal: isOn,
  help: isOn,
  inventory: isOn,
  kami: isOn,
  kamiAdoptionAgency: isOn,
  kamiSend: isOn,
  leaderboard: isOn,
  lootBox: isOn,
  marketplace: isOn,
  templeOfTheWheel: isOn,
  map: isOn,
  questDialogue: isOn,
  merchant: isOn,
  node: isOn,
  operatorFund: isOn,
  party: isOn,
  presale: isOn,
  quests: isOn,
  reveal: isOn,
  settings: isOn,
  tokenPortal: isOn,
  trading: isOn,
});

////////////////
// MODAL ZONES — screen regions each modal occupies.
// When a modal opens, all other modals sharing a zone are auto-closed.

type ScreenZone = 'left' | 'center' | 'right';

const MODAL_ZONES: Partial<Record<keyof Modals, ScreenZone[]>> = {
  // Left zone (col 2-33)
  account: ['left'],
  map: ['left'],
  party: ['left'],

  // Center zone (col 33-67)
  crafting: ['center'],
  node: ['center'],
  emaBoard: ['center'],
  tokenPortal: ['center'],
  lootBox: ['center'],
  templeOfTheWheel: ['center'],
  leaderboard: ['center'],
  operatorFund: ['center'],
  reveal: ['center'],

  // Wide: left + center (col 2-67)
  trading: ['left', 'center'],
  merchant: ['left', 'center'],
  marketplace: ['left', 'center'],

  // Nearly full-screen
  gacha: ['left', 'center', 'right'],
  goal: ['left', 'center', 'right'],

  // Right zone (col 67-100)
  help: ['right'],
  chat: ['right'],
  inventory: ['right'],
  kamiSend: ['right'],
  quests: ['right'],
  settings: ['right'],
  questDialogue: ['right'],
};

const resolveConflicts = (current: Modals, incoming: Partial<Modals>): Modals => {
  const merged = { ...current, ...incoming };

  for (const [key, value] of Object.entries(incoming)) {
    const modal = key as keyof Modals;
    // Only resolve when a modal is newly opened (was closed, now open)
    if (value !== true || current[modal]) continue;

    const zones = MODAL_ZONES[modal];
    if (!zones) continue;

    for (const [otherKey, otherZones] of Object.entries(MODAL_ZONES)) {
      if (otherKey === key) continue;
      if (otherZones!.some((z) => zones.includes(z))) {
        merged[otherKey as keyof Modals] = false;
      }
    }
  }

  return merged;
};

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
      questDialogue: false,
      dialogue: false,
      emaBoard: false,
      animationStudio: false,
      gacha: false,
      goal: false,
      help: false,
      inventory: false,
      kami: false,
      kamiAdoptionAgency: false,
      kamiSend: false,
      leaderboard: false,
      lootBox: false,
      marketplace: false,
      templeOfTheWheel: false,
      map: false,
      merchant: false,
      node: false,
      operatorFund: false,
      party: false,
      presale: false,
      quests: false,
      reveal: false,
      settings: false,
      tokenPortal: false,
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
      set((state: State) => ({ ...state, modals: resolveConflicts(state.modals, data) })),
    setValidators: (data: Partial<Validators>) =>
      set((state: State) => ({ ...state, validators: { ...state.validators, ...data } })),
    toggleFixtures: (isOn: boolean) =>
      set((state: State) => ({ ...state, fixtures: toggleFixtures(isOn) })),
    toggleModals: (isOn: boolean) =>
      set((state: State) => ({ ...state, modals: toggleModals(isOn) })),
  };
});
