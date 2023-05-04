import React from 'react';
import { of } from 'rxjs';
import mapImage from '../../../../assets/images/map_native.png';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerMapButton() {
  registerUIComponent(
    'MapButton',
    {
      colStart: 92,
      colEnd: 99,
      rowStart: 2,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id='map_button' targetDiv='map' text='Hello Kitty'>
          <img style={{ height: '100%', width: 'auto' }} src={mapImage} alt='map_icon' />
        </MenuButton>
      );
    }
  );
}
