import { EntityID, EntityIndex } from '@mud-classic/recs';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { inventoryIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { waitForActionCompletion } from 'network/utils';
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

          const account = getAccountFromBurner(network, {
            kamis: { flags: true, production: true },
            inventory: true,
          });
          return {
            network,
            data: {
              account: account,
            },
          };
        })
      );
    },

    // Render
    ({ network, data }) => {
      const { actions, api, systems, world, localSystems } = network;
      const { DTRevealer } = localSystems;
      const { account } = data;

      /////////////////
      // ACTIONS

      // feed a kami
      const feedKami = (kami: Kami, item: Item) => {
        actions.add({
          action: 'KamiFeed',
          params: [kami.id, item.index],
          description: `Feeding ${item.name} to ${kami.name}`,
          execute: async () => {
            return api.player.pet.use.food(kami.id, item.index);
          },
        });
      };

      const reviveKami = (kami: Kami, item: Item) => {
        actions.add({
          action: 'KamiRevive',
          params: [kami.id, item.index],
          description: `Reviving ${item.name} to ${kami.name}`,
          execute: async () => {
            return api.player.pet.use.revive(kami.id, item.index);
          },
        });
      };

      const renamePotionKami = (kami: Kami, item: Item) => {
        actions.add({
          action: 'KamiRenamePotion',
          params: [kami.id, item.index],
          description: `Allowing ${kami.name} to be renamed`,
          execute: async () => {
            return api.player.pet.use.renamePotion(kami.id, item.index);
          },
        });
      };

      const t1ToT2Kami = (kami: Kami, item: Item) => {
        actions.add({
          action: 'Sending kami to the next world',
          params: [kami.id, item.index],
          description: `Sending ${kami.name} to the next world`,
          execute: async () => {
            return api.player.pet.use.transferrer(kami.id, item.index);
          },
        });
      };

      // feed the account
      const feedAccount = (item: Item) => {
        actions.add({
          action: 'AccountFeed',
          params: [item.index],
          description: `Consuming ${item.name}`,
          execute: async () => {
            return api.player.account.use.food(item.index);
          },
        });
      };

      const teleportAccount = (item: Item) => {
        actions.add({
          action: 'AccountTeleport',
          params: [item.index],
          description: `Consuming ${item.name}`,
          execute: async () => {
            return api.player.account.use.teleport(item.index);
          },
        });
      };

      const openLootbox = async (item: Item, amount: number) => {
        DTRevealer.nameEntity(item.id, item.name); // name for commits

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'LootboxCommit',
          params: [item.index, amount],
          description: `Opening ${amount} ${item.name}`,
          execute: async () => {
            return api.player.item.lootbox.commit(item.index, amount);
          },
        });
        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
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
              feedKami,
              reviveKami,
              renamePotionKami,
              feedAccount,
              teleportAccount,
              openLootbox,
              t1ToT2Kami,
            }}
          />
        </ModalWrapper>
      );
    }
  );
}
