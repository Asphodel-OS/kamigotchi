import React from 'react';
import { of } from 'rxjs';
import helpImage from '../../../../assets/images/help_native.png';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerHelpButton() {
  registerUIComponent(
    'HelpButton',
    {
      colStart: 97,
      colEnd: 100,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleModals: { settingsButton },
      } = dataStore();
      return (
        <MenuButton id='settings_button' targetDiv='help' text='Help' visible={settingsButton}>
          <img style={{ height: '100%', width: 'auto' }} src={helpImage} alt='help_icon' />
        </MenuButton>
      );
    }
  );
}
