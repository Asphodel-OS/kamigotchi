import { chatIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { Modals, useVisibility } from 'layers/react/store';

export const ChatMenuButton = () => {
  const { buttons } = useVisibility();
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
      targetDiv='chat'
      hideModals={modalsToHide}
      visible={buttons.chat}
    />
  );
};
