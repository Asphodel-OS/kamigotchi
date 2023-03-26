import { registerActionQueue } from './ActionQueue';
import { registerLoadingState } from './LoadingState';
import { registerDialogueModal } from './modals/Dialogue';

import { registerChatButton } from './buttons/Chat';
import { registerFoodShopButton } from './buttons/FoodShop';
import { registerMapButton } from './buttons/Map';
import { registerPartyButton } from './buttons/Party';

import { registerChatModal } from './modals/Chat';
import { regiesterDetectAccountModal } from './modals/DetectAccount';
import { registerKamiMintModal } from './modals/KamiMint';
import { registerKamiModal } from './modals/Kami';
import { registerMapModal } from './modals/Map';
import { registerMerchantModal } from './modals/Merchant';
import { registerPartyModal } from './modals/Party';
import { registerRequestQueue } from './modals/RequestQueue';
import { registerTradeModal } from './modals/Trade';

export function registerUIComponents() {
  registerActionQueue();
  registerLoadingState();
  registerDialogueModal();

  registerChatButton();
  registerFoodShopButton();
  registerMapButton();
  registerPartyButton();

  registerChatModal();
  regiesterDetectAccountModal();
  registerKamiMintModal();
  registerKamiModal();
  registerMapModal();
  registerMerchantModal();
  registerPartyModal();
  registerRequestQueue();
  registerTradeModal();
}
