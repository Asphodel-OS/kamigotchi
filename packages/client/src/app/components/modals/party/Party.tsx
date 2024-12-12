import { interval, map } from 'rxjs';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UseItemButton } from 'app/components/library/actions';
import { registerUIComponent } from 'app/root';
import { useAccount } from 'app/stores';
import { kamiIcon } from 'assets/images/icons/menu';
import { Account, queryAccountFromEmbedded } from 'network/shapes/Account';
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
          const { world, components } = network;
          const { debug } = useAccount.getState();

          const accountEntity = queryAccountFromEmbedded(network);
          const accRefreshOptions = {
            live: 0,
            inventory: 2,
          };
          const kamiRefreshOptions = {
            live: 0,
            bonuses: 5, // set this to 3600 once we get explicit triggers for updates
            config: 3600,
            flags: 10, // set this to 3600 once we get explicit triggers for updates
            harvest: 5, // set this to 60 once we get explicit triggers for updates
            skills: 5, // set this to 3600 once we get explicit triggers for updates
            stats: 3600,
            traits: 3600,
          };

          return {
            network,
            data: {
              accountEntity: accountEntity,
            },
            display: {
              UseItemButton: (kami: Kami, account: Account, icon: string) =>
                UseItemButton(network, kami, account, icon),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity, accRefreshOptions),
              getKamis: () =>
                getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
            },
          };
        })
      ),

    // Render
    ({ display, data, utils }) => {
      return (
        <ModalWrapper
          id='party'
          header={<ModalHeader title='Party' icon={kamiIcon} />}
          canExit
          truncate
        >
          <Kards data={data} display={display} utils={utils} />
        </ModalWrapper>
      );
    }
  );
}
