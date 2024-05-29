import { MenuButton } from 'app/components/library';
import { Modals } from 'app/store';
import { chatIcon } from 'assets/images/icons/menu';

export const ChatMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    emaBoard: false,
    help: false,
    kami: false,
    inventory: false,
    leaderboard: false,
    nameKami: false,
    quests: false,
    settings: false,
  };

  return (
    <MenuButton
      id='chat-button'
      image={chatIcon}
      tooltip='Chat'
      targetModal='chat'
      hideModals={modalsToHide}
    />
  );
};
