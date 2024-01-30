import { registerLoadingState } from './LoadingState';

import {
  registerAccountButton,
  registerHelpButton,
  registerInventoryButton,
  registerMapButton,
  registerPartyButton,
  registerQuestsButton,
  registerSettingsButton,
  registerSocialButton,
} from './fixtures/buttons';

import { registerAccountInfoFixture } from './fixtures/AccountInfo';
import { registerActionQueueFixture } from './fixtures/queue/';
import { registerWalletFixture } from './fixtures/Wallet';
import { registerNotificationFixture } from './fixtures/Notifications';

import { registerAccountModal } from './modals/account';
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
import { registerSocialModal } from './modals/social/Social';

import { registerERC20BridgeModal } from './modals/BridgeERC20';
import { registerERC721BridgeModal } from './modals/BridgeERC721';
import { registerFundOperatorModal } from "./modals/FundOperator"
import { registerAccountOperator } from './modals/AccountOperator';

import {
  registerAccountRegistrar,
  registerBurnerDetector,
  registerWalletConnecter,
  registerOperatorUpdater,
  registerGasHarasser,
} from './validators';


export function registerUIComponents() {
  registerLoadingState();

  // buttons
  registerAccountButton();
  registerHelpButton();
  registerInventoryButton();
  registerMapButton();
  registerPartyButton();
  registerQuestsButton();
  registerSettingsButton();
  registerSocialButton();

  // other fixtures
  registerAccountInfoFixture();
  registerActionQueueFixture();
  registerWalletFixture();
  registerNotificationFixture();

  // menu modals
  registerHelpModal();
  registerInventoryModal();
  registerMapModal();
  registerPartyModal();
  registerQuestsModal();
  registerSettingsModal();
  registerSocialModal();

  // game modals
  registerAccountModal();
  registerAccountOperator();
  registerBuyModal();
  registerDialogueModal();
  registerERC20BridgeModal();
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
