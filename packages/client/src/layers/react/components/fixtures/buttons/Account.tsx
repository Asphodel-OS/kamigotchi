import { of } from 'rxjs';

import { operatorIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { useAccount } from 'layers/react/store/account';
import { useSelected } from 'layers/react/store/selected';
import { Modals, useVisibility } from 'layers/react/store/visibility';

export function registerAccountButton() {
  registerUIComponent(
    'AccountButton',
    {
      colStart: 3,
      colEnd: 6,
      rowStart: 3,
      rowEnd: 6,
    },
    (layers) => of(layers),
    () => {
      const { buttons } = useVisibility();
      const { setAccount } = useSelected();
      const { account } = useAccount();

      const modalsToHide: Partial<Modals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        kami: false,
        leaderboard: false,
        map: false,
        nameKami: false,
        party: false,
      };

      return (
        <MenuButton
          id='account_button'
          image={operatorIcon}
          tooltip={`Account`}
          targetDiv='account'
          visible={buttons.account}
          hideModals={modalsToHide}
          onClick={() => setAccount(account.index)}
        />
      );
    }
  );
}
