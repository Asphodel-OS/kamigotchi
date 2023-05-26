import React from 'react';
import { of } from 'rxjs';
import kamiImage from '../../../../assets/images/kami_native.png';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerPartyButton() {
  registerUIComponent(
    'PartyButton',
    {
      colStart: 82,
      colEnd: 85,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const { visibleButtons } = dataStore();
      const modalsToHide = { dialogue: false };

      return (
        <MenuButton
          id='party_button'
          targetDiv='party'
          text='Party'
          visible={visibleButtons.party}
          hideModal={modalsToHide}
        >
          <img style={{ height: '100%', width: 'auto' }} src={kamiImage} alt='kami_icon' />
        </MenuButton>
      );
    }
  );
}
