import { registerLoadingState } from './LoadingState';

import { registerScene } from './canvas';

import { registerAccountHeader } from './fixtures/header';
import { registerMenuLeft, registerMenuRight } from './fixtures/menu';
import { registerNotificationFixture } from './fixtures/notifications';
import { registerActionQueue } from './fixtures/queue/';

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

import { registerGoalModal } from './modals/goals/Goal';
import {
  registerAccountRegistrar,
  registerGasHarasser,
  registerOperatorUpdater,
  registerWalletConnecter,
} from './validators';

export function registerUIComponents() {
  registerLoadingState();

  // fixtures
  registerAccountHeader();
  registerActionQueue();
  registerMenuLeft();
  registerMenuRight();
  registerNotificationFixture();

  // menu modals
  registerAccountModal();
  registerChatModal();
  registerHelpModal();
  registerInventoryModal();
  registerMapModal();
  registerPartyModal();
  registerQuestsModal();
  registerSettingsModal();

  // game modals
  registerBuyModal();
  registerDialogueModal();
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
  registerGoalModal();

  // validators
  registerAccountRegistrar();
  registerOperatorUpdater();
  registerWalletConnecter();
  registerGasHarasser();

  // Game Scene
  registerScene();
}
