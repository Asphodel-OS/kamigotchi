import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerPartyButton() {
  registerUIComponent(
    'PartyButton',
    {
      colStart: 88,
      colEnd: 100,
      rowStart: 74,
      rowEnd: 78,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="party_button" targetDiv="party">
          My Kami
        </MenuButton>
      );
    }
  );
}