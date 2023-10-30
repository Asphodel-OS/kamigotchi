import React from 'react';
import { of } from 'rxjs';
import { settingsIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { VisibleModals, dataStore } from 'layers/react/store/createStore';

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
      const { visibleButtons } = dataStore();
      const modalsToHide: Partial<VisibleModals> = {
        bridgeERC20: false,
        bridgeERC721: false,
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
          targetDiv='settings'
          text='Settings'
          visible={visibleButtons.settings}
          hideModal={modalsToHide}
        >
          <img style={{ height: '100%', width: 'auto' }} src={settingsIcon} alt='settings_icon' />
        </MenuButton>
      );
    }
  );
}
