import React from 'react';
import { of } from 'rxjs';
import { kamiIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerPartyButton() {
  registerUIComponent(
    'PartyButton',
    {
      colStart: 76,
      colEnd: 79,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const { visibleButtons } = dataStore();
      const modalsToHide = { dialogue: false, leaderboard: false };

      return (
        <MenuButton
          id='party_button'
          targetDiv='party'
          text='Party'
          hideModals={modalsToHide}
          visible={visibleButtons.party}
        >
          <img style={{ height: '100%', width: 'auto' }} src={kamiIcon} alt='kami_icon' />
        </MenuButton>
      );
    }
  );
}
