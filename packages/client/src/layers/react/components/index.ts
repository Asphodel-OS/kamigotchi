import { registerActionQueue } from './ActionQueue';
import { registerLoadingState } from './LoadingState';
import { registerDialogueModal } from './modals/Dialogue';

import { registerChatButton } from './buttons/Chat';
import { registerMapButton } from './buttons/Map';
import { registerPartyButton } from './buttons/Party';
import { registerSettingsButton } from './buttons/Settings';
import { registerHelpButton } from './buttons/Help';
import { registerOperatorHealthButton } from './buttons/OperatorInfo';

import { registerChatModal } from './modals/Chat';
import { registerDetectAccountModal } from './modals/DetectAccount';
import { registerKamiMintModal } from './modals/MintKami';
import { registerMintAfterModal } from './modals/MintAfter';
import { registerKamiModal } from './modals/Kami';
import { registerMapModal } from './modals/Map';
import { registerMerchantModal } from './modals/Merchant';
import { registerPartyModal } from './modals/Party';
import { registerNodeModal } from './modals/Node';
import { registerSettingsModal } from './modals/Settings';
import { registerHelpModal } from './modals/Help';
import { registerKamisNamingModal } from './modals/KamisNaming';
import { registerNameKamiModal } from './modals/NameKami';

export function registerUIComponents() {
  registerActionQueue();
  registerLoadingState();
  registerDialogueModal();

  registerOperatorHealthButton();
  registerChatButton();
  registerMapButton();
  registerPartyButton();
  registerSettingsButton();
  registerHelpButton();

  registerChatModal();
  registerDetectAccountModal();
  registerKamiMintModal();
  registerMintAfterModal();
  registerMapModal();
  registerNodeModal();
  registerMerchantModal();
  registerPartyModal();
  registerKamiModal();
  registerSettingsModal();
  registerKamisNamingModal();
  registerNameKamiModal();
  registerHelpModal();
}
