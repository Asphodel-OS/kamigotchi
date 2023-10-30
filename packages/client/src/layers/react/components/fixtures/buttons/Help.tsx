import React from 'react';
import { of } from 'rxjs';
import { helpIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { VisibleModals, dataStore } from 'layers/react/store/createStore';

export function registerHelpButton() {
  registerUIComponent(
    'HelpButton',
    {
      colStart: 88,
      colEnd: 91,
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
        inventory: false,
        kami: false,
        leaderboard: false,
        nameKami: false,
        quests: false,
        settings: false,
      }

      return (
        <MenuButton
          id='help_button'
          targetDiv='help'
          text='Help'
          visible={visibleButtons.help}
          hideModal={modalsToHide}
        >
          <img style={{ height: '100%', width: 'auto' }} src={helpIcon} alt='help_icon' />
        </MenuButton>
      );
    }
  );
}
