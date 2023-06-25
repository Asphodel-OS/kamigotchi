import React from 'react';
import { of } from 'rxjs';
import mapImage from '../../../../assets/images/map_native.png';

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
      const modalsToHide: Partial<VisibleModals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        kamisNaming: false,
        nameKami: false,
        node: false,
        merchant: false,
        leaderboard: false,
      };

      return (
        <MenuButton
          id='map_button'
          targetDiv='map'
          text='Map'
          visible={visibleButtons.map}
          hideModal={modalsToHide}
        >
          <img style={{ height: '100%', width: 'auto' }} src={mapImage} alt='map_icon' />
        </MenuButton>
      );
    }
  );
}
