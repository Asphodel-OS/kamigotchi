import { registerLoadingState } from './LoadingState';

import {
  registerHelpButton,
  registerMapButton,
  registerPartyButton,
  registerQuestsButton,
  registerSettingsButton,
} from './fixtures/buttons';

import { registerAccountInfoFixture } from './fixtures/AccountInfo';
import { registerActionQueueFixture } from './fixtures/ActionQueue';
import { registerGasWarningFixture } from './fixtures/GasWarning';
import { registerWalletFixture } from './fixtures/Wallet';

import { registerDialogueModal } from './modals/dialogue';
import { registerKamiModal } from './modals/kami';
import { registerLeaderboardModal } from './modals/leaderboard';
import { registerMapModal } from './modals/map';
import { registerBuyModal, registerMerchantModal } from './modals/merchant';
import { registerEMABoardModal, registerNameKamiModal } from './modals/naming';
import { registerNodeModal } from './modals/node';
import { registerPartyModal } from './modals/party';
import { registerQuestsModal } from './modals/quests';
import { registerSettingsModal } from './modals/settings';

import { registerERC20BridgeModal } from './modals/BridgeERC20';
import { registerERC721BridgeModal } from './modals/BridgeERC721';
import { registerHelpModal } from './modals/Help';
import { registerFundOperatorModal } from "./modals/FundOperator"
import { registerKamiMintModal } from './modals/MintKami';
import { registerOperatorMovementModal } from './modals/OperatorMovement';

import {
  registerAccountRegistrar,
  registerBurnerDetector,
  registerWalletConnecter,
  registerOperatorUpdater,
} from './validators';


export function registerUIComponents() {
  registerLoadingState();

  // buttons
  registerHelpButton();
  registerMapButton();
  registerPartyButton();
  registerQuestsButton();
  registerSettingsButton();

  // other fixtures
  registerAccountInfoFixture();
  registerActionQueueFixture();
  registerGasWarningFixture();
  registerWalletFixture();

  // menu modals
  registerHelpModal();
  registerMapModal();
  registerSettingsModal();
  registerPartyModal();
  registerQuestsModal();

  // game modals
  registerBuyModal();
  registerERC20BridgeModal();
  registerERC721BridgeModal();
  registerEMABoardModal();
  registerFundOperatorModal();
  registerKamiMintModal();
  registerKamiModal();
  registerLeaderboardModal();
  registerNameKamiModal();
  registerNodeModal();
  registerMerchantModal();
  registerDialogueModal();
  registerOperatorMovementModal();

  // validators
  registerAccountRegistrar();
  registerBurnerDetector();
  registerOperatorUpdater();
  registerWalletConnecter();
}
