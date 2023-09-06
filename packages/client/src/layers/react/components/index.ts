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

import { registerKamiModal } from './modals/kami';
import { registerLeaderboardModal } from './modals/leaderboard';
import { registerMapModal } from './modals/map';
import { registerMerchantModal } from './modals/merchant';
import { registerEMABoardModal, registerNameKamiModal } from './modals/naming';
import { registerNodeModal } from './modals/node';
import { registerPartyModal } from './modals/party';
import { registerQuestsModal } from './modals/quests';

import { registerERC20BridgeModal } from './modals/BridgeERC20';
import { registerERC721BridgeModal } from './modals/BridgeERC721';
import { registerDialogueModal } from './modals/Dialogue';
import { registerHelpModal } from './modals/Help';
import { registerFundOperatorModal } from "./modals/FundOperator"
import { registerKamiMintModal } from './modals/MintKami';
import { registerOperatorMovementModal } from './modals/OperatorMovement';
import { registerSettingsModal } from './modals/Settings';

import { registerAccountRegistrar } from './validators/AccountRegistrar';
import { registerBurnerDetector } from './validators/BurnerDetector';
import { registerDetectAccountModal } from './validators/DetectAccount';
import { registerWalletConnecter } from './validators/WalletConnector';
import { registerOperatorUpdater } from './validators/OperatorUpdater';

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
