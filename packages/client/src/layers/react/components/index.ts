import { registerLoadingState } from './LoadingState';

import { registerChatButton } from './fixtures/buttons/Chat';
import { registerHelpButton } from './fixtures/buttons/Help';
import { registerMapButton } from './fixtures/buttons/Map';
import { registerPartyButton } from './fixtures/buttons/Party';
import { registerSettingsButton } from './fixtures/buttons/Settings';
import { registerQuestsButton } from './fixtures/buttons/Quests';
import { registerAccountInfoFixture } from './fixtures/AccountInfo';
import { registerActionQueue } from './fixtures/ActionQueue';
import { registerWalletFixture } from './fixtures/Wallet';

import { registerChatModal } from './modals/Chat';
import { registerDialogueModal } from './modals/Dialogue';
import { registerERC20BridgeModal } from './modals/BridgeERC20';
import { registerERC721BridgeModal } from './modals/BridgeERC721';
import { registerKamiMintModal } from './modals/MintKami';
import { registerKamiModal } from './modals/Kami';
import { registerMapModal } from './modals/Map';
import { registerNodeModal } from './modals/Node';
import { registerSettingsModal } from './modals/Settings';
import { registerQuestsModal } from './modals/Quests';
import { registerHelpModal } from './modals/Help';
import { registerFundOperatorModal } from "./modals/FundOperator"
import { registerOperatorMovementModal } from './modals/OperatorMovement';

import { registerLeaderboardModal } from './modals/leaderboard';
import { registerMerchantModal } from './modals/merchant';
import { registerEMABoardModal, registerNameKamiModal } from './modals/naming';
import { registerPartyModal } from './modals/party';

import { registerAccountRegistrar } from './validators/AccountRegistrar';
import { registerBurnerDetector } from './validators/BurnerDetector';
import { registerDetectAccountModal } from './validators/DetectAccount';
import { registerWalletConnecter } from './validators/WalletConnector';
import { registerOperatorFundNotification } from './validators/OperatorFundNotification';
import { registerOperatorUpdater } from './validators/OperatorUpdater';

export function registerUIComponents() {
  registerLoadingState();

  // buttons
  // registerChatButton();
  registerHelpButton();
  registerMapButton();
  registerPartyButton();
  registerQuestsButton();
  registerSettingsButton();

  // other fixtures
  registerAccountInfoFixture();
  registerWalletFixture();
  registerActionQueue();
  registerOperatorFundNotification();

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

  // menu modals
  // registerChatModal();
  registerHelpModal();
  registerMapModal();
  registerSettingsModal();
  registerPartyModal();
  registerQuestsModal();

  // validators
  registerAccountRegistrar();
  registerBurnerDetector();
  registerOperatorUpdater();
  registerWalletConnecter();
  // registerDetectAccountModal();
}
