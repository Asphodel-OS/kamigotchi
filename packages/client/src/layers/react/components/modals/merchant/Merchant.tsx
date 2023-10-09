import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID } from '@latticexyz/recs';

import { Listings } from './Listings';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Listing } from 'layers/react/shapes/Listing';
import { Merchant, getMerchantByIndex } from 'layers/react/shapes/Merchant';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';


// merchant window with listings. assumes at most 1 merchant per room
export function registerMerchantModal() {
  registerUIComponent(
    'MerchantWindow',

    // Grid Config
    {
      colStart: 33,
      colEnd: 75,
      rowStart: 20,
      rowEnd: 60,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          api: { player },
          components: {
            AccountID,
            Description,
            IsListing,
            IsNPC,
            ItemIndex,
            NPCIndex,
            Location,
            Name,
          },
          actions,
        },
      } = layers;

      return merge(
        AccountID.update$,
        Description.update$,
        IsListing.update$,
        IsNPC.update$,
        ItemIndex.update$,
        NPCIndex.update$,
        Location.update$,
        Name.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(layers, { inventory: true });
          const { npcIndex } = useSelectedEntities.getState();
          console.log('mMerchant: npcIndex', npcIndex);
          const merchant = getMerchantByIndex(layers, npcIndex);

          return {
            layers,
            actions,
            api: player,
            data: {
              account,
              merchant,
            } as any,
          };
        })
      );
    },

    // Render
    ({ layers, actions, api, data }) => {
      console.log('mMerchant: data', data);
      const { npcIndex } = useSelectedEntities();
      const [merchant, setMerchant] = useState<Merchant>(data.merchant);

      // updates from component subscription updates
      useEffect(() => {
        setMerchant(data.merchant);
      }, [data.merchant]);

      // updates from selected Merchant updates
      useEffect(() => {
        setMerchant(getMerchantByIndex(layers, npcIndex));
      }, [npcIndex]);


      /////////////////
      // ACTIONS

      // buy from a listing
      const buy = (listing: Listing, amt: number) => {
        const actionID = `Buying ${amt} ${listing.item.name}` as EntityID; // itemIndex should be replaced with the item's name
        actions?.add({
          id: actionID,
          components: {},
          // on: data.account.index, // what's the appropriate value here?
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.listing.buy(listing.id, amt);
          },
        });
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          divName='merchant'
          id='merchant'
          header={<Title>{`${merchant?.name}'s Shop`}</Title>}
          canExit
        >
          <Listings listings={merchant?.listings} handleBuy={buy} />
        </ModalWrapperFull>
      );
    }
  );
}


const Title = styled.div`
  width: 100%;
  padding: 2vw;

  color: black;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;