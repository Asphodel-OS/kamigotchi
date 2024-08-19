import { interval, map } from 'rxjs';
import { erc20Abi, formatUnits } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { abi as Mint20ProxySystemABI } from 'abi/Mint20ProxySystem.json';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { inventoryIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { GachaTicketInventory } from 'network/shapes/utils';
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
          return { network, data: { account } };
        })
      );
    },

    // Render
    ({ network, data }) => {
      const { actions, api, systems, world, localSystems } = network;
      const { DTRevealer } = localSystems;
      const { account } = data;

      /////////////////
      // SUBSCRIPTIONS

      // $KAMI Contract Address
      const { data: mint20Addy } = useReadContract({
        address: systems['system.Mint20.Proxy']?.address as `0x${string}`,
        abi: Mint20ProxySystemABI,
        functionName: 'getTokenAddy',
      });

      // $KAMI Balance of Owner EOA
      const { data: ticketBal } = useReadContracts({
        contracts: [
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'balanceOf',
            args: [account.ownerEOA as `0x${string}`],
          },
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'decimals',
          },
        ],
      });

      /////////////////
      // ACTIONS

      // feed a kami
      const feedKami = (kami: Kami, item: Item) => {
        actions.add({
          action: 'KamiFeed',
          params: [kami.id, item.index],
          description: `Feeding ${item.name} to ${kami.name}`,
          execute: async () => {
            return api.player.pet.feed(kami.id, item.index);
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
            return api.player.account.consume(item.index);
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

      const getInventories = () => {
        const inventories = [...(account.inventories ?? [])];
        if (ticketBal) {
          const numTicketsRaw = ticketBal[0].result ?? 0n;
          const numTicketsDecimals = ticketBal[1].result ?? 18;
          if (numTicketsRaw > 0) {
            const ticketInventory = GachaTicketInventory;
            ticketInventory.balance = Number(formatUnits(numTicketsRaw, numTicketsDecimals));
            inventories.unshift(ticketInventory);
          }
        }
        return inventories;
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
            actions={{ feedKami, feedAccount, openLootbox }}
          />
        </ModalWrapper>
      );
    }
  );
}
