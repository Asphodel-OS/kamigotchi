import { registerActionQueue } from './ActionQueue';
import { registerLoadingState } from './LoadingState';
import { registerMerchantWindow } from './modals/MerchantWindow';
import { registerObjectModal } from './ObjectModal';
import { registerMyKamiButton } from './buttons/MyKamiButton';
import { registerMapButton } from './buttons/MapButton';
import { registerChatButton } from './buttons/ChatButton';
import { registerFoodShopButton } from './buttons/FoodShopButton';
import { registerPetList } from './modals/PetList';
import { registerRequestQueue } from './modals/RequestQueue';
import { registerTradeWindow } from './modals/TradeWindow';
import { registerDetectAccount } from './modals/DetectAccount';
import { registerPetMint } from './modals/PetMint';
import { registerPetDetails } from './modals/PetDetails';
import { registerChat } from './modals/Chat';
import { registerWorldMap } from './modals/WorldMap';

export function registerUIComponents() {
  registerLoadingState();
  registerDetectAccount();
  registerPetList();
  registerMerchantWindow();
  registerRequestQueue();
  registerTradeWindow();
  registerMyKamiButton();
  registerChatButton();
  registerFoodShopButton();
  registerObjectModal();
  registerChat();
  registerPetMint();
  registerPetDetails();
  registerWorldMap();
  registerMapButton();
  registerActionQueue();
}
