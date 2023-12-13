import React from 'react';
import { of } from 'rxjs';
import { kamiIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useComponentSettings } from 'layers/react/store/componentSettings';

export function registerSocialButton() {
  registerUIComponent(
    'SocialButton',
    {
      colStart: 76,
      colEnd: 79,
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
        kami: false,
        leaderboard: false,
        map: false,
        nameKami: false,
      };

      return (
        <MenuButton
          id='social_button'
          image={kamiIcon}
          tooltip='social'
          targetDiv='social'
          hideModals={modalsToHide}
          visible={buttons.party}
        />
      );
    }
  );
}
