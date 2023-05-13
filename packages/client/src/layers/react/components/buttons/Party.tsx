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
      colStart: 91,
      colEnd: 93,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleModals: { partButton },
      } = dataStore();

      const hideSettingsModal = { settings: false };
      return (
        <MenuButton
          id='party_button'
          targetDiv='party'
          text='Party'
          visible={partButton}
          hideModal={hideSettingsModal}
        >
          <img style={{ height: '100%', width: 'auto' }} src={kamiImage} alt='kami_icon' />
        </MenuButton>
      );
    }
  );
}
