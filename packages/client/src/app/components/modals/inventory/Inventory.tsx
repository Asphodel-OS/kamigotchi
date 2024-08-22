import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { erc20Abi, formatUnits } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

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
      const [numTickets, setNumTickets] = useState<number>(0);

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

      // update the state with the number of tickets whenever that number changes
      useEffect(() => {
        if (!ticketBal) return;
        const numRaw = ticketBal[0].result ?? 0n;
        const decimals = ticketBal[1].result ?? 18;
        const balance = Number(formatUnits(numRaw, decimals));
        if (balance != numTickets) setNumTickets(balance);
      }, [ticketBal]);

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

      // get the list of inventories for an account including gacha tickets
      const getInventories = () => {
        const raw = [...(account.inventories ?? [])];
        const cleaned = raw.filter((inv) => !!inv.item.index);

        if (numTickets > 0) {
          const ticketInventory = GachaTicketInventory;
          ticketInventory.balance = numTickets;
          cleaned.unshift(ticketInventory);
        }
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
            actions={{ feedKami, feedAccount, openLootbox }}
          />
        </ModalWrapper>
      );
    }
  );
}
