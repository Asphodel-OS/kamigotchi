import { interval, map } from 'rxjs';
import { useReadContract, useReadContracts } from 'wagmi';

import { abi as Mint20ProxySystemABI } from 'abi/Mint20ProxySystem.json';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { inventoryIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import { GachaTicketInventory } from 'network/shapes/utils/EntityTypes';
import { erc20Abi, formatUnits } from 'viem';
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
          const account = getAccountFromBurner(network, { inventory: true });
          return { network, data: { account } };
        })
      );
    },
    // Render
    ({ network, data }) => {
      /////////////////
      // DATA SUBSCRIPTIONS

      // $KAMI Contract Address
      const { data: mint20Addy } = useReadContract({
        address: network.systems['system.Mint20.Proxy']?.address as `0x${string}`,
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
            args: [data.account.ownerEOA as `0x${string}`],
          },
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'decimals',
          },
        ],
      });

      const getInventories = () => {
        const inventories = data.account.inventories || [];
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
          footer={<MusuRow key='musu' balance={data.account.coin} />}
          canExit
          overlay
          truncate
        >
          <ItemGrid key='grid' inventories={getInventories()} />
        </ModalWrapper>
      );
    }
  );
}
