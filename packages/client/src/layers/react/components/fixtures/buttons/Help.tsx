import React from 'react';
import { of } from 'rxjs';
import { helpIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useComponentSettings } from 'layers/react/store/componentSettings';

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
      const { buttons } = useComponentSettings();
      const modalsToHide: Partial<Modals> = {
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
        social: false,
      }

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
    }
  );
}
