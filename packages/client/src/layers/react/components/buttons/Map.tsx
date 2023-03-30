import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerMapButton() {
  registerUIComponent(
    'MapButton',
    {
      colStart: 88,
      colEnd: 100,
      rowStart: 58,
      rowEnd: 62,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="map_button" targetDiv="map">
          World Map
        </MenuButton>
      );
    }
  );
}