import React from 'react';
import { of } from 'rxjs';
import { kamiIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { VisibleModals, dataStore } from 'layers/react/store/createStore';

export function registerPartyButton() {
  registerUIComponent(
    'PartyButton',
    {
      colStart: 3,
      colEnd: 10,
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
        kami: false,
        leaderboard: false,
        map: false,
        nameKami: false,
      };

      return (
        <MenuButton
          id='party_button'
          image={kamiIcon}
          tooltip='Party'
          targetDiv='party'
          hideModals={modalsToHide}
          visible={visibleButtons.party}
        />
      );
    }
  );
}
