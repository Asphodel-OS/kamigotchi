import { registerActionQueue } from './ActionQueue';
import { registerLoadingState } from './LoadingState';

import { registerChatButton } from './menuButtons/Chat';
import { registerHelpButton } from './menuButtons/Help';
import { registerMapButton } from './menuButtons/Map';
import { registerOperatorInfoButton } from './menuButtons/OperatorInfo';
import { registerPartyButton } from './menuButtons/Party';
import { registerSettingsButton } from './menuButtons/Settings';
import { registerWalletButton } from './menuButtons/Wallet';

import { registerChatModal } from './modals/Chat';
import { registerDialogueModal } from './modals/Dialogue';
import { registerERC20BridgeModal } from './modals/BridgeERC20';
import { registerERC721BridgeModal } from './modals/BridgeERC721';
import { registerKamiMintModal } from './modals/MintKami';
import { registerKamiModal } from './modals/Kami';
import { registerMapModal } from './modals/Map';
import { registerMerchantModal } from './modals/Merchant';
import { registerPartyModal } from './modals/Party';
import { registerNodeModal } from './modals/Node';
import { registerSettingsModal } from './modals/Settings';
import { registerHelpModal } from './modals/Help';
import { registerKamisNamingModal } from './modals/KamisNaming';
import { registerNameKamiModal } from './modals/NameKami';

import { registerAccountRegistrar } from './validators/AccountRegistrar';
import { registerBurnerDetector } from './validators/BurnerDetector';
import { registerDetectAccountModal } from './validators/DetectAccount';
import { registerWalletConnecter } from './validators/WalletConnector';
import { registerOperatorUpdater } from './validators/OperatorUpdater';

export function registerUIComponents() {
  registerActionQueue();
  registerLoadingState();

  registerChatButton();
  registerHelpButton();
  registerMapButton();
  registerOperatorInfoButton();
  registerPartyButton();
  registerSettingsButton();
  registerWalletButton();

  registerChatModal();
  // registerDetectAccountModal();
  registerERC20BridgeModal();
  registerERC721BridgeModal();
  registerKamiMintModal();
  registerMapModal();
  registerNodeModal();
  registerMerchantModal();
  registerPartyModal();
  registerKamiModal();
  registerSettingsModal();
  registerKamisNamingModal();
  registerNameKamiModal();
  registerHelpModal();

  registerAccountRegistrar();
  registerBurnerDetector();
  registerOperatorUpdater();
  registerWalletConnecter();

  registerDialogueModal();
}
