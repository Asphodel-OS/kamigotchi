import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { inventoryIcon } from 'assets/images/icons/menu';
import { Account, getAccountFromBurner } from 'network/shapes/Account';
import { passesConditions } from 'network/shapes/Conditional';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { ItemGrid } from './ItemGrid';
import { MusuRow } from './MusuRow';

export function registerInventoryModal() {
  registerUIComponent(
    'Inventory',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 75,
    },

    // Requirement
    (layers) => {
      return interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;

          const account = getAccountFromBurner(network, {
            kamis: { flags: true, harvest: true },
            inventory: true,
          });
          return {
            network,
            data: {
              account: account,
            },
            utils: {
              meetsRequirements: (holder: Kami | Account, item: Item) =>
                passesConditions(world, components, item.requirements.use, holder),
            },
          };
        })
      );
    },

    // Render
    ({ network, data, utils }) => {
      const { actions, api } = network;
      const { account } = data;

      /////////////////
      // ACTIONS

      const useForKami = (kami: Kami, item: Item) => {
        actions.add({
          action: 'KamiFeed',
          params: [kami.id, item.index],
          description: `Using ${item.name} on ${kami.name}`,
          execute: async () => {
            return api.player.pet.use.item(kami.id, item.index);
          },
        });
      };

      const useForAccount = (item: Item) => {
        actions.add({
          action: 'AccountFeed',
          params: [item.index],
          description: `Using ${item.name}`,
          execute: async () => {
            return api.player.account.use.item(item.index, 1);
          },
        });
      };

      /////////////////
      // INTERPRETATION

      // get the list of inventories for an account including gacha tickets
      const getInventories = () => {
        const raw = [...(account.inventories ?? [])];
        const cleaned = raw.filter((inv) => !!inv.item.index);
        return cleaned;
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='inventory'
          header={<ModalHeader title='Inventory' icon={inventoryIcon} />}
          footer={<MusuRow key='musu' balance={account.coin} />}
          canExit
          overlay
          truncate
        >
          <ItemGrid
            key='grid'
            account={account}
            inventories={getInventories()}
            actions={{
              useForAccount,
              useForKami,
            }}
            utils={utils}
          />
        </ModalWrapper>
      );
    }
  );
}
