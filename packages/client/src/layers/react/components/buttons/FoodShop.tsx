import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerFoodShopButton() {
  registerUIComponent(
    'FoodShopButton',
    {
      colStart: 88,
      colEnd: 100,
      rowStart: 82,
      rowEnd: 86,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="foodshop_button" targetDiv="merchant">
          Food Shop
        </MenuButton>
      );
    }
  );
}