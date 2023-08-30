import React, { useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import {
  EntityID,
  Has,
  HasValue,
  runQuery,
} from '@latticexyz/recs';

import { registerUIComponent } from 'layers/react/engine/store';
import { Listings } from './Listings';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccount } from 'layers/react/shapes/Account';
import { Listing } from 'layers/react/shapes/Listing';
import { Merchant, getMerchant } from 'layers/react/shapes/Merchant';
import { dataStore } from 'layers/react/store/createStore';

// merchant window with listings. assumes at most 1 merchant per room
export function registerMerchantModal() {
  registerUIComponent(
    'MerchantWindow',

    // Grid Config
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 20,
      rowEnd: 60,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          api: { player },
          network,
          components: {
            AccountID,
            Description,
            IsAccount,
            IsMerchant,
            IsListing,
            ItemIndex,
            Location,
            Name,
            OperatorAddress,
          },
          actions,
        },
      } = layers;

      return merge(
        AccountID.update$,
        Description.update$,
        IsListing.update$,
        ItemIndex.update$,
        Location.update$,
        Name.update$,
      ).pipe(
        map(() => {
          // get the account through the account entity of the controlling wallet
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];
          const account = getAccount(layers, accountIndex);

          // get the merchant in this room
          const merchantResults = runQuery([
            Has(IsMerchant),
            HasValue(Location, { value: account.location }),
          ]);

          // if we have a merchant retrieve its listings
          // only support one merchant per room for now
          let merchant, merchantIndex;
          if (merchantResults.size != 0) {
            merchantIndex = Array.from(merchantResults)[0];
            merchant = getMerchant(layers, merchantIndex);
          }

          return {
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
    ({ actions, api, data }) => {
      // console.log('mMerchant: data', data);
      const { visibleModals, setVisibleModals } = dataStore();


      /////////////////
      // ACTIONS

      // buy from a listing
      const buy = (listing: Listing, amt: number) => {
        const actionID = `Buying ${amt} of ${listing.item.index} at ${Date.now()}` as EntityID; // itemIndex should be replaced with the item's name
        actions.add({
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
          header={<Title>{`${data.merchant?.name}'s Shop`}</Title>}
          canExit
        >
          <Listings listings={data.merchant?.listings} handleBuy={buy} />
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