import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerInventoryButton() {
  registerUIComponent(
    'InventoryButton',
    {
      colStart: 87,
      colEnd: 99,
      rowStart: 87,
      rowEnd: 99,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="inventory_button" targetDiv="inventory">
          Inventory
        </MenuButton>
      );
    }
  );
}