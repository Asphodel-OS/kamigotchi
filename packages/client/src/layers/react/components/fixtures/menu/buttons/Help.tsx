import { helpIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { Modals, useVisibility } from 'layers/react/store';

export const HelpMenuButton = () => {
  const { buttons } = useVisibility();
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
      targetDiv='help'
      hideModals={modalsToHide}
      visible={buttons.help}
    />
  );
};
