import React from 'react';
import { map, merge } from 'rxjs';

import { ItemGrid } from './ItemGrid';
import { MusuRow } from './MusuRow';
import { inventoryIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Inventory } from 'layers/network/shapes/Inventory';


export function registerInventoryModal() {
  registerUIComponent(
    'Inventory',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 75,
    },
    (layers) => {
      const { network } = layers;
      const {
        AccountID,
        Balance,
        Coin,
        Description,
        HolderID,
        ItemIndex,
        MediaURI,
        Name,
        OwnerAddress,
      } = network.components;

      return merge(
        AccountID.update$,
        Balance.update$,
        Coin.update$,
        Description.update$,
        HolderID.update$,
        ItemIndex.update$,
        MediaURI.update$,
        Name.update$,
        OwnerAddress.update$,
      ).pipe(
        map(() => {
          return {
            data: {
              account: getAccountFromBurner(network, { inventory: true }),
            }
          };
        })
      );
    },

    ({ data }) => {
      const getInventories = () => {
        let accInv = data.account.inventories;
        let inventories: Inventory[] = [];

        if (accInv?.food) inventories = inventories.concat(accInv.food);
        if (accInv?.revives) inventories = inventories.concat(accInv.revives);
        if (accInv?.mods) inventories = inventories.concat(accInv.mods);
        if (accInv?.gear) inventories = inventories.concat(accInv.gear);
        if (accInv?.consumables) inventories = inventories.concat(accInv.consumables);
        if (accInv?.lootboxes) inventories = inventories.concat(accInv.lootboxes);

        return inventories.filter((inv) => !inv.item.isFungible || inv.balance! > 0);
      }

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='inventory-modal'
          divName='inventory'
          header={<ModalHeader title='Inventory' icon={inventoryIcon} />}
          footer={<MusuRow key='musu' balance={data.account.coin} />}
          canExit
          overlay
        >
          <ItemGrid key='grid' inventories={getInventories()} />
        </ModalWrapper>
      );
    }
  );
}