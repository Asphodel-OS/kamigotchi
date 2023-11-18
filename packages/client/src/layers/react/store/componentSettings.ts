import create from 'zustand';

export interface Buttons {
  help: boolean;
  inventory: boolean;
  map: boolean;
  party: boolean;
  quests: boolean;
  settings: boolean;
}

export const toggleButtons = (isOn: boolean): Buttons => ({
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

export interface Modals {
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

export const toggleModals = (isOn: boolean): Modals => ({
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

export interface Validators {
  accountRegistrar: boolean;
  burnerDetector: boolean;
  gasHarasser: boolean;
  operatorUpdater: boolean;
  walletConnector: boolean;
}

export interface ComponentSettings {
  buttons: Buttons;
  fixtures: Fixtures;
  modals: Modals;
  validators: Validators;
}

interface ComponentSettingsActions {
  setButtons: (data: Buttons) => void;
  setFixtures: (data: Fixtures) => void;
  setModals: (data: Modals) => void;
  setValidators: (data: Validators) => void;
  toggleButtons: (isOn: boolean) => void;
  toggleModals: (isOn: boolean) => void;
  toggleFixtures: (isOn: boolean) => void;
}

export const useComponentSettings = create<ComponentSettings & ComponentSettingsActions>((set) => {
  const initialState: ComponentSettings = {
    buttons: {
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
    modals: {
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
    validators: {
      accountRegistrar: false,
      burnerDetector: false,
      gasHarasser: false,
      operatorUpdater: false,
      walletConnector: false,
    }
  };

  return {
    ...initialState,
    setButtons: (data: Buttons) => set(
      (state: ComponentSettings) => ({ ...state, buttons: data })
    ),
    setFixtures: (data: Fixtures) => set(
      (state: ComponentSettings) => ({ ...state, fixtures: data })
    ),
    setModals: (data: Modals) => set(
      (state: ComponentSettings) => ({ ...state, modals: data })
    ),
    setValidators: (data: Validators) => set(
      (state: ComponentSettings) => ({ ...state, validators: data })
    ),
    toggleButtons: (isOn: boolean) => set(
      (state: ComponentSettings) => ({ ...state, buttons: toggleButtons(isOn) })
    ),
    toggleFixtures: (isOn: boolean) => set(
      (state: ComponentSettings) => ({ ...state, fixtures: toggleFixtures(isOn) })
    ),
    toggleModals: (isOn: boolean) => set(
      (state: ComponentSettings) => ({ ...state, modals: toggleModals(isOn) })
    ),
  };
});
