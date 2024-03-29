import { registerLoadingState } from './LoadingState';

import {
  registerAccountButton,
  registerChatButton,
  registerHelpButton,
  registerInventoryButton,
  registerMapButton,
  registerPartyButton,
  registerQuestsButton,
  registerSettingsButton,
} from './fixtures/buttons';

import { registerAccountInfoFixture } from './fixtures/AccountInfo';
import { registerNotificationFixture } from './fixtures/Notifications';
import { registerWalletFixture } from './fixtures/login/Wallet';
import { registerActionQueueFixture } from './fixtures/queue/';

import { registerAccountModal } from './modals/account';
import { registerChatModal } from './modals/chat/';
import { registerDialogueModal } from './modals/dialogue';
import { registerGachaModal } from './modals/gacha';
import { registerHelpModal } from './modals/help';
import { registerInventoryModal } from './modals/inventory';
import { registerKamiModal } from './modals/kami';
import { registerLeaderboardModal } from './modals/leaderboard';
import { registerLootboxesModal } from './modals/lootboxes/Lootboxes';
import { registerMapModal } from './modals/map';
import { registerBuyModal, registerMerchantModal } from './modals/merchant';
import { registerEMABoardModal, registerNameKamiModal } from './modals/naming';
import { registerNodeModal } from './modals/node';
import { registerPartyModal } from './modals/party';
import { registerQuestsModal } from './modals/quests';
import { registerSettingsModal } from './modals/settings';

import { registerERC721BridgeModal } from './modals/BridgeERC721';
import { registerFundOperatorModal } from './modals/FundOperator';

import {
  registerAccountRegistrar,
  registerBurnerDetector,
  registerGasHarasser,
  registerOperatorUpdater,
  registerWalletConnecter,
} from './validators';

export function registerUIComponents() {
  registerLoadingState();

  registerChatButton();
  registerChatModal();

  // buttons
  registerAccountButton();
  registerHelpButton();
  registerInventoryButton();
  registerMapButton();
  registerPartyButton();
  registerQuestsButton();
  registerSettingsButton();

  // other fixtures
  registerAccountInfoFixture();
  registerActionQueueFixture();
  registerWalletFixture();
  registerNotificationFixture();

  // menu modals
  registerAccountModal();
  registerHelpModal();
  registerInventoryModal();
  registerMapModal();
  registerPartyModal();
  registerQuestsModal();
  registerSettingsModal();

  // game modals
  registerBuyModal();
  registerDialogueModal();
  // registerERC20BridgeModal();
  registerERC721BridgeModal();
  registerEMABoardModal();
  registerFundOperatorModal();
  registerGachaModal();
  registerKamiModal();
  registerLeaderboardModal();
  registerLootboxesModal();
  registerMerchantModal();
  registerNameKamiModal();
  registerNodeModal();

  // validators
  registerAccountRegistrar();
  registerBurnerDetector();
  registerOperatorUpdater();
  registerWalletConnecter();
  registerGasHarasser();
}
