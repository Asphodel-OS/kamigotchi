import { of } from 'rxjs';

import { kamiIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useVisibility } from 'layers/react/store/visibility';

export function registerPartyButton() {
  registerUIComponent(
    'PartyButton',
    {
      colStart: 6,
      colEnd: 9,
      rowStart: 3,
      rowEnd: 6,
    },
    (layers) => of(layers),
    () => {
      const { buttons } = useVisibility();
      const modalsToHide: Partial<Modals> = {
        account: false,
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
          visible={buttons.party}
        />
      );
    }
  );
}
