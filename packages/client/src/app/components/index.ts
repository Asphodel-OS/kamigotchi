import { registerClock } from './fixtures/clock';
import { registerMenuLeft, registerMenuRight } from './fixtures/menu';
import { registerNotificationFixture } from './fixtures/notifications';
import { registerActionQueue } from './fixtures/queue';

import { registerAccountModal } from './modals/account';
import { registerChatModal } from './modals/chat';
import { registerDialogueModal } from './modals/dialogue';
import { registerGachaModal } from './modals/gacha';
import { registerGoalModal } from './modals/goals';
import { registerHelpModal } from './modals/help';
import { registerInventoryModal } from './modals/inventory';
import { registerKamiModal } from './modals/kami';
import { registerLeaderboardModal } from './modals/leaderboard';
import { registerMapModal } from './modals/map';
import { registerMerchantModal } from './modals/merchant';
import { registerEMABoardModal, registerNameKamiModal } from './modals/naming';
import { registerNodeModal } from './modals/node';
import { registerPartyModal } from './modals/party';
import { registerQuestsModal } from './modals/quests';
import { registerRevealModal } from './modals/reveal/Reveal';
import { registerSettingsModal } from './modals/settings';

// unused
import { registerERC721BridgeModal } from './modals/BridgeERC721';
import { registerFundOperatorModal } from './modals/FundOperator';

import { registerCraftingModal } from './modals/crafting';
import {
  registerAccountRegistrar,
  registerGasHarasser,
  registerOperatorUpdater,
  registerWalletConnecter,
} from './validators';

export { registerLoadingState } from './boot';
export { registerScene } from './canvas';

export function registerFixtures() {
  registerActionQueue();
  registerClock();
  registerMenuLeft();
  registerMenuRight();
  registerNotificationFixture();
}

export function registerModals() {
  // menu modals
  registerAccountModal();
  registerChatModal();
  registerHelpModal();
  registerInventoryModal();
  registerMapModal();
  registerPartyModal();
  registerQuestsModal();
  registerSettingsModal();

  // scene modals
  registerDialogueModal();
  registerCraftingModal();
  registerERC721BridgeModal();
  registerEMABoardModal();
  registerFundOperatorModal();
  registerGachaModal();
  registerKamiModal();
  registerLeaderboardModal();
  registerRevealModal();
  registerMerchantModal();
  registerNameKamiModal();
  registerNodeModal();
  registerGoalModal();
}

export function registerValidators() {
  registerAccountRegistrar();
  registerOperatorUpdater();
  registerWalletConnecter();
  registerGasHarasser();
}
