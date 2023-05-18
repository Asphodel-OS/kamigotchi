import React from 'react';
import { of } from 'rxjs';
import mapImage from '../../../../assets/images/map_native.png';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerMapButton() {
  registerUIComponent(
    'MapButton',
    {
      colStart: 88,
      colEnd: 91,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleModals: { mapButton },
      } = dataStore();

      const hideSettingsModal = { dialogue: false };
      return (
        <MenuButton
          id='map_button'
          targetDiv='map'
          text='Map'
          visible={mapButton}
          hideModal={hideSettingsModal}
        >
          <img style={{ height: '100%', width: 'auto' }} src={mapImage} alt='map_icon' />
        </MenuButton>
      );
    }
  );
}
