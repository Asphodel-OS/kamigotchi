import { settingsIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { Modals, useVisibility } from 'layers/react/store';

export const SettingsMenuButton = () => {
  const { buttons } = useVisibility();
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    chat: false,
    dialogue: false,
    emaBoard: false,
    help: false,
    inventory: false,
    kami: false,
    leaderboard: false,
    nameKami: false,
    quests: false,
  };

  return (
    <MenuButton
      id='settings_button'
      image={settingsIcon}
      tooltip='Settings'
      targetDiv='settings'
      hideModals={modalsToHide}
      visible={buttons.settings}
    />
  );
};
