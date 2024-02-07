import React from 'react';
import { of } from 'rxjs';

import { inventoryIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { useVisibility, Modals } from 'layers/react/store/visibility';

export function registerInventoryButton() {
  registerUIComponent(
    'InventoryButton',
    {
      colStart: 79,
      colEnd: 82,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const { buttons } = useVisibility();
      const modalsToHide: Partial<Modals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        help: false,
        kami: false,
        leaderboard: false,
        nameKami: false,
        quests: false,
        settings: false,
      };

      return (
        <MenuButton
          id='inventory-button'
          image={inventoryIcon}
          tooltip='Inventory'
          targetDiv='inventory'
          hideModals={modalsToHide}
          visible={buttons.inventory}
        />
      );
    }
  );
}
