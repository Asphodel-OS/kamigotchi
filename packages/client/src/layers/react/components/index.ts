import { registerActionQueue } from './ActionQueue';
import { registerLoadingState } from './LoadingState';
import { registerObjectModal } from './ObjectModal';

import { registerChatButton } from './buttons/ChatButton';
import { registerFoodShopButton } from './buttons/FoodShopButton';
import { registerMyKamiButton } from './buttons/MyKamiButton';
import { registerMapButton } from './buttons/MapButton';

import { registerChat } from './modals/Chat';
import { registerDetectAccount } from './modals/DetectAccount';
import { registerMerchantWindow } from './modals/MerchantWindow';
import { registerPetList } from './modals/PetList';
import { registerPetMint } from './modals/PetMint';
import { registerPetDetails } from './modals/PetDetails';
import { registerRequestQueue } from './modals/RequestQueue';
import { registerTradeWindow } from './modals/TradeWindow';
import { registerWorldMap } from './modals/WorldMap';

export function registerUIComponents() {
  registerActionQueue();
  registerLoadingState();
  registerObjectModal();

  registerChatButton();
  registerFoodShopButton();
  registerMapButton();
  registerMyKamiButton();

  registerChat();
  registerDetectAccount();
  registerMerchantWindow();
  registerPetList();
  registerPetMint();
  registerPetDetails();
  registerRequestQueue();
  registerTradeWindow();
  registerWorldMap();
}
