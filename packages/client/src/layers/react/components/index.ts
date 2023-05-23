import { registerActionQueue } from './ActionQueue';
import { registerLoadingState } from './LoadingState';
import { registerDialogueModal } from './modals/Dialogue';

import { registerChatButton } from './buttons/Chat';
import { registerHelpButton } from './buttons/Help';
import { registerMapButton } from './buttons/Map';
import { registerOperatorInfoButton } from './buttons/OperatorInfo';
import { registerPartyButton } from './buttons/Party';
import { registerSettingsButton } from './buttons/Settings';
import { registerWalletButton } from './buttons/Wallet';

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

import { registerConnectModal } from './modals/Connect';
import { registerAccountRegistrationModal } from './modals/AccountRegistration';

export function registerUIComponents() {
  registerActionQueue();
  registerLoadingState();
  registerDialogueModal();

  registerChatButton();
  registerHelpButton();
  registerMapButton();
  registerOperatorInfoButton();
  registerPartyButton();
  registerSettingsButton();
  registerWalletButton();

  registerChatModal();
  // registerDetectAccountModal();
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

  registerConnectModal();
  registerAccountRegistrationModal();
}
