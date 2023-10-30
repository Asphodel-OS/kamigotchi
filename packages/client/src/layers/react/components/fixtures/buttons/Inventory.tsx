import React from 'react';
import { of } from 'rxjs';

import placeholderIcon from "assets/images/icons/exit_native.png";
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';

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
      const { visibleButtons } = dataStore();
      const modalsToHide: Partial<VisibleModals> = {
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
          targetDiv='inventory'
          text='Inventory'
          visible={visibleButtons.inventory}
          hideModal={modalsToHide}
        >
          <img style={{ height: '100%', width: 'auto' }} src={placeholderIcon} alt='map_icon' />
        </MenuButton>
      );
    }
  );
}
