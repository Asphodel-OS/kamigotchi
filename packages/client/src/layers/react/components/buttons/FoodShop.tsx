import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerFoodShopButton() {
  registerUIComponent(
    'FoodShopButton',
    {
      colStart: 87,
      colEnd: 99,
      rowStart: 79,
      rowEnd: 89,
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
