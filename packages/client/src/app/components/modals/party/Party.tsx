import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { kamiIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
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
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { account } = data;
      const { actions, api } = network;

      /////////////////
      // INTERACTION

      // feed a kami
      const feed = (kami: Kami, itemIndex: number) => {
        actions.add({
          action: 'KamiFeed',
          params: [kami.id, itemIndex],
          description: `Feeding ${kami.name}`,
          execute: async () => {
            return api.player.pet.use.item(kami.id, itemIndex);
          },
        });
      };

      // revive a kami using a revive item
      const revive = (kami: Kami, itemIndex: number) => {
        actions.add({
          action: 'KamiRevive',
          params: [kami.id, itemIndex],
          description: `Reviving ${kami.name}`,
          execute: async () => {
            return api.player.pet.use.item(kami.id, itemIndex);
          },
        });
      };

      return (
        <ModalWrapper
          id='party'
          header={<ModalHeader title='Party' icon={kamiIcon} />}
          canExit
          truncate
        >
          <Kards account={account} kamis={account.kamis} actions={{ feed, revive }} />
        </ModalWrapper>
      );
    }
  );
}
