import { registerClock } from './fixtures/clock';
import { registerMenuLeft, registerMenuRight } from './fixtures/menu';
import { registerNotificationFixture } from './fixtures/notifications';
import { registerActionQueue } from './fixtures/queue';

import { registerAccountModal } from './modals/account';
import { registerChatModal } from './modals/chat';
import { registerCraftingModal } from './modals/crafting';
import { registerDialogueModal } from './modals/dialogue';
import { registerGachaModal } from './modals/gacha';
import { registerGoalModal } from './modals/goals';
import { registerHelpModal } from './modals/help';
import { registerInventoryModal } from './modals/inventory';
import { registerKamiModal } from './modals/kami';
import { registerKamiBridge } from './modals/kamiBridge';
import { registerLeaderboardModal } from './modals/leaderboard';
import { registerMapModal } from './modals/map';
import { registerMerchantModal } from './modals/merchant';
import { registerEMABoardModal, registerNameKamiModal } from './modals/naming';
import { registerNodeModal } from './modals/node';
import { registerPartyModal } from './modals/party';
import { registerPresaleModal } from './modals/presale';
import { registerQuestsModal } from './modals/quests';
import { registerRevealModal } from './modals/reveal/Reveal';
import { registerSettingsModal } from './modals/settings';
import { registerTradingModal } from './modals/trading';
// unused
import { registerFundOperatorModal } from './modals/FundOperator';

import {
  registerAccountRegistrar,
  registerGasHarasser,
  registerOperatorUpdater,
  registerWalletConnecter,
} from './validators';

export { registerLoadingState } from './boot';
export { registerScene } from './canvas';
export { registerActionQueue };

export function registerFixtures() {
  registerClock();
  registerMenuLeft();
  registerMenuRight();
  registerNotificationFixture();
}

export function registerModals() {
  // menu modals
  registerAccountModal();
  registerChatModal();
  registerCraftingModal();
  registerHelpModal();
  registerInventoryModal();
  registerMapModal();
  registerNodeModal();
  registerPartyModal();
  registerQuestsModal();
  registerSettingsModal();
  registerTradingModal();
  registerPresaleModal();

  // scene modals
  registerDialogueModal();
  registerKamiBridge();
  registerEMABoardModal();
  registerFundOperatorModal();
  registerGachaModal();
  registerKamiModal();
  registerLeaderboardModal();
  registerRevealModal();
  registerMerchantModal();
  registerNameKamiModal();
  registerGoalModal();
}

export function registerValidators() {
  registerWalletConnecter();
  registerAccountRegistrar();
  registerOperatorUpdater();
  registerGasHarasser();
  // registerTokenChecker();
}
