import { settingsIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { Modals } from 'layers/react/store';

export const SettingsMenuButton = () => {
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
      targetModal='settings'
      hideModals={modalsToHide}
    />
  );
};
