import { helpIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library';
import { Modals } from 'layers/react/store';

export const HelpMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    chat: false,
    dialogue: false,
    emaBoard: false,
    inventory: false,
    kami: false,
    leaderboard: false,
    nameKami: false,
    quests: false,
    settings: false,
  };

  return (
    <MenuButton
      id='help_button'
      image={helpIcon}
      tooltip='Help'
      targetModal='help'
      hideModals={modalsToHide}
    />
  );
};
