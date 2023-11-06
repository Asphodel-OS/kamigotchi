import { settingsIcon } from 'assets/images/icons/menu';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useVisibility } from 'layers/react/store/visibility';

export function registerSettingsButton() {
  registerUIComponent(
    'SettingsButton',
    {
      colStart: 85,
      colEnd: 88,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
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
        social: false,
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
    }
  );
}
