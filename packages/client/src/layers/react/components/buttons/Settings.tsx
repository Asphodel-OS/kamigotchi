import React from 'react';
import { of } from 'rxjs';
import settingsImage from '../../../../assets/images/settings_native.png';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerSettingsButton() {
  registerUIComponent(
    'SettingsButton',
    {
      colStart: 94,
      colEnd: 97,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleModals: { settingsButton },
      } = dataStore();
      return (
        <MenuButton
          id='settings_button'
          targetDiv='settings'
          text='Settings'
          visible={settingsButton}
        >
          <img style={{ height: '100%', width: 'auto' }} src={settingsImage} alt='settings_icon' />
        </MenuButton>
      );
    }
  );
}
