import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerMapButton() {
  registerUIComponent(
    'MapButton',
    {
      colStart: 87,
      colEnd: 99,
      rowStart: 89,
      rowEnd: 99,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="map_button" targetDiv="map">
          Map
        </MenuButton>
      );
    }
  );
}
