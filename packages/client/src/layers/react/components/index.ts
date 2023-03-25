import { registerActionQueue } from './ActionQueue';
import { registerLoadingState } from './LoadingState';
import { registerObjectModal } from './ObjectModal';

import { registerChatButton } from './buttons/Chat';
import { registerFoodShopButton } from './buttons/FoodShop';
import { registerMapButton } from './buttons/Map';
import { registerPartyButton } from './buttons/Party';

import { registerChatModal } from './modals/Chat';
import { registerDetectAccount } from './modals/DetectAccount';
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
  registerObjectModal();

  registerChatButton();
  registerFoodShopButton();
  registerMapButton();
  registerPartyButton();

  registerChatModal();
  registerDetectAccount();
  registerKamiMintModal();
  registerKamiModal();
  registerMapModal();
  registerMerchantModal();
  registerPartyModal();
  registerRequestQueue();
  registerTradeModal();
}
