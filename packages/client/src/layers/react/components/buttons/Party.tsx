import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerPartyButton() {
  registerUIComponent(
    'PartyButton',
    {
      colStart: 2,
      colEnd: 13,
      rowStart: 2,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="party_button" targetDiv="party">
          Kami
        </MenuButton>
      );
    }
  );
}
