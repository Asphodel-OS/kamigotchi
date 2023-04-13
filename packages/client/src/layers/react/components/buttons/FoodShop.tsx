import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerFoodShopButton() {
  registerUIComponent(
    'FoodShopButton',
    {
      colStart: 1,
      colEnd: 13,
      rowStart: 89,
      rowEnd: 99,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="foodshop_button" targetDiv="merchant">
          Food
        </MenuButton>
      );
    }
  );
}
