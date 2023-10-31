import React from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { ItemGrid } from './ItemGrid';
import { Inventory } from 'layers/react/shapes/Inventory';
import { MusuRow } from './MusuRow';


export function registerInventoryModal() {
  registerUIComponent(
    'Inventory',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 10,
      rowEnd: 75,
    },
    (layers) => {
      const {
        network: {
          actions,
          api: { player },
          components: {
            AccountID,
            Balance,
            Coin,
            Description,
            HolderID,
            ItemIndex,
            MediaURI,
            Name,
            OwnerAddress,
          },
        },
      } = layers;

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
            layers,
            actions: layers.network.actions,
            api: layers.network.api.player,
            data: {
              account: getAccountFromBurner(layers, { inventory: true }),
            }
          };
        })
      );
    },

    ({ layers, actions, api, data }) => {
      // console.log('mInventory', data);
      const getInventories = () => {
        let accInv = data.account.inventories;
        let inventories: Inventory[] = [];

        if (accInv?.food) inventories = inventories.concat(accInv.food);
        if (accInv?.revives) inventories = inventories.concat(accInv.revives);
        if (accInv?.mods) inventories = inventories.concat(accInv.mods);
        if (accInv?.gear) inventories = inventories.concat(accInv.gear);

        return inventories.filter((inv) => !inv.item.isFungible || inv.balance! > 0);
      }

      /////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          id='inventory-modal'
          divName='inventory'
          header={<Header key='header'>Inventory</Header>}
          footer={<MusuRow key='musu' balance={data.account.coin} />}
          canExit
          overlay
        >
          <ItemGrid key='grid' inventories={getInventories()} />
        </ModalWrapperFull>
      );
    }
  );
}


const Header = styled.div`
  font-size: 1.5vw;
  color: #333;
  text-align: left;
  padding: 1.2vw 1.8vw;
  font-family: Pixel;
`;