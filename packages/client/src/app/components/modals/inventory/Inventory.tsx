import { interval, map } from 'rxjs';

import { getAccount, getAccountInventories, getAccountKamis } from 'app/cache/account';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount } from 'app/stores';
import { InventoryIcon } from 'assets/images/icons/menu';
import { Account, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Allo, parseAllos } from 'network/shapes/Allo';
import { parseConditionalText, passesConditions } from 'network/shapes/Conditional';
import { getMusuBalance, Item } from 'network/shapes/Item';
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
          const { debug } = useAccount.getState();
          const accountEntity = queryAccountFromEmbedded(network);
          const kamiRefreshOptions = {
            live: 0,
            bonuses: 5,
            config: 3600,
            flags: 10,
            harvest: 2,
            skills: 5,
            stats: 3600,
            traits: 3600,
          };

          return {
            network,
            data: {
              accountEntity,
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity),
              getInventories: () => getAccountInventories(world, components, accountEntity),
              getKamis: () =>
                getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
              meetsRequirements: (holder: Kami | Account, item: Item) =>
                passesConditions(world, components, item.requirements.use, holder),
              getMusuBalance: () => getMusuBalance(world, components, accountEntity),
              displayRequirements: (recipe: Item) =>
                recipe.requirements.use
                  .map((req) => parseConditionalText(world, components, req))
                  .join(', '),
              parseAllos: (allo: Allo[]) => parseAllos(world, components, allo),
            },
          };
        })
      );
    },

    // Render
    ({ network, data, utils }) => {
      const { actions, api } = network;
      const { accountEntity } = data;
      const { getMusuBalance } = utils;

      /////////////////
      // ACTIONS

      const useForKami = (kami: Kami, item: Item) => {
        actions.add({
          action: 'KamiFeed',
          params: [kami.id, item.index],
          description: `Using ${item.name} on ${kami.name}`,
          execute: async () => {
            return api.player.pet.item.use(kami.id, item.index);
          },
        });
      };

      const useForAccount = (item: Item, amount: number) => {
        // really hacky way to determine if we're using a giftbox
        let actionKey = 'Using';
        if (item.name === 'Giftbox') actionKey = 'Opening';

        actions.add({
          action: 'AccountFeed',
          params: [item.index],
          description: `${actionKey} ${item.name}`,
          execute: async () => {
            return api.player.account.item.use(item.index, amount);
          },
        });
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='inventory'
          header={<ModalHeader title='Inventory' icon={InventoryIcon} />}
          footer={<MusuRow key='musu' balance={getMusuBalance()} />}
          canExit
          overlay
          truncate
        >
          {!accountEntity ? (
            <EmptyText text={['Failed to Connect Account']} size={1} />
          ) : (
            <ItemGrid
              key='grid'
              accountEntity={accountEntity}
              actions={{ useForAccount, useForKami }}
              utils={utils}
            />
          )}
        </ModalWrapper>
      );
    }
  );
}
