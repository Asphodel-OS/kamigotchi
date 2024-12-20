import { Modals } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

export const ChatMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    emaBoard: false,
    help: false,
    inventory: false,
    leaderboard: false,
    nameKami: false,
    quests: false,
    settings: false,
  };

  return (
    <MenuButton
      id='chat-button'
      image={ChatIcon}
      tooltip='Chat'
      targetModal='chat'
      hideModals={modalsToHide}
    />
  );
};
