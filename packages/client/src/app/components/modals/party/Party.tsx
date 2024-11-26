import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UseItemButton } from 'app/components/library/actions';
import { registerUIComponent } from 'app/root';
import { kamiIcon } from 'assets/images/icons/menu';
import { Account, getAccountFromBurner } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Kards } from './Kards';

export function registerPartyModal() {
  registerUIComponent(
    'PartyModal',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const account = getAccountFromBurner(network, {
            inventory: true,
            kamis: { harvest: true, traits: true },
          });

          return {
            network,
            data: { account },
            display: {
              UseItemButton: (kami: Kami, account: Account, icon: string) =>
                UseItemButton(network, kami, account, icon),
            },
          };
        })
      ),

    // Render
    ({ network, display, data }) => {
      const { account } = data;

      return (
        <ModalWrapper
          id='party'
          header={<ModalHeader title='Party' icon={kamiIcon} />}
          canExit
          truncate
        >
          <Kards account={account} kamis={account.kamis} display={display} />
        </ModalWrapper>
      );
    }
  );
}
