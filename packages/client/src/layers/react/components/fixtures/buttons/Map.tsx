import React from 'react';
import { of } from 'rxjs';
import mapImage from 'assets/images/map_native.png';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';

export function registerMapButton() {
  registerUIComponent(
    'MapButton',
    {
      colStart: 79,
      colEnd: 82,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const { visibleButtons } = dataStore();

      return (
        <MenuButton
          id='map_button'
          targetDiv='map'
          text='Map'
          visible={visibleButtons.map}
        >
          <img style={{ height: '100%', width: 'auto' }} src={mapImage} alt='map_icon' />
        </MenuButton>
      );
    }
  );
}
