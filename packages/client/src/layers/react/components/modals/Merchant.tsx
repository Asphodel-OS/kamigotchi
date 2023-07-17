import React, { useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { registerUIComponent } from 'layers/react/engine/store';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccount } from 'layers/react/shapes/Account';
import { Listing } from 'layers/react/shapes/Listing';
import { Merchant, getMerchant } from 'layers/react/shapes/Merchant';

import pompom from 'assets/images/food/pompom.png';
import gakki from 'assets/images/food/gakki.png';
import gum from 'assets/images/food/gum.png';
import ribbon from 'assets/images/food/ribbon.png';
import { dataStore } from 'layers/react/store/createStore';

const ItemImages = new Map([
  [1, gum],
  [2, pompom],
  [3, gakki],
  [4, ribbon],
]);

const ItemNames = new Map([
  [1, 'Maple-Flavor Ghost Gum'],
  [2, 'Pom-Pom Fruit Candy'],
  [3, 'Gakki Cookie Sticks'],
  [4, 'Red Gakki Ribbon'],
]);

// merchant window with listings. assumes at most 1 merchant per room
export function registerMerchantModal() {
  registerUIComponent(
    'MerchantWindow',

    // Grid Config
    {
      colStart: 34,
      colEnd: 68,
      rowStart: 10,
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
      const { visibleModals, setVisibleModals, selectedEntities, setSelectedEntities } =
        dataStore();
      ///////////////////
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

      ///////////////////
      // DISPLAY

      const BuyButton = (listing: Listing) => (
        <ActionButton
          id={`button-buy-${listing.item.index}`}
          disabled={data.coin < listing.buyPrice}
          onClick={() => buy(listing, 1)}
          text='Buy'
        />
      );

      // [listing: {id, index, itemIndex, buyPrice, sellPrice}]
      const listings = (listings: Listing[]) => {
        if (!listings) return;
        return listings.map((listing) => (
          <ShopEntry key={listing.item.index}>
            <ItemImage src={ItemImages.get(listing.item.index)} />
            <ItemName>{listing.item.name}</ItemName>
            <ItemPrice>{listing.buyPrice}</ItemPrice>
            <ButtonWrapper>{BuyButton(listing)}</ButtonWrapper>
          </ShopEntry>
        ));
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, merchant: false });
      }, [setVisibleModals, visibleModals]);

      return (
        <ModalWrapperFull divName='merchant' id='merchant'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          {data.merchant && <ShopList>{listings(data.merchant.listings)}</ShopList>}
        </ModalWrapperFull>
      );
    }
  );
}

const ButtonWrapper = styled.div`
  grid-column: 4;
  align-self: center;
`;

const ItemImage = styled.img`
  font-family: Pixel;
  grid-column: 1;
  align-self: center;
  width: 50px;
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
  padding: 5px;
  margin: 0px;
`;

const ItemName = styled.p`
  font-family: Pixel;
  grid-column: 2;
  align-self: center;
  font-size: 15px;
`;

const ItemPrice = styled.p`
  font-family: Pixel;
  grid-column: 3;
  align-self: center;
  font-size: 14px;
`;

const ShopEntry = styled.li`
  font-family: Pixel;
  color: black;
  display: grid;
  border-style: solid;
  border-width: 0px 0px 2px 0px;
  border-color: black;
  padding: 0px;
`;

const ShopList = styled.ul`
  font-family: Pixel;
  color: black;
  grid-row: 2;
  border-style: solid;
  border-width: 2px 2px 0px 2px;
  border-color: black;
  grid-column: 1;
  margin: 2px 0px 0px 0px;
  border-radius: 5px;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
  margin-bottom: 5px;
`;
