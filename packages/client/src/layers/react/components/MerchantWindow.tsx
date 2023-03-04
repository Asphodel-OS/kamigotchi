import React, { useState, useEffect } from 'react';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { registerUIComponent } from '../engine/store';
import pompom from '../../../public/img/pompom.png';
import gakki from '../../../public/img/gakki.png';
import ribbon from '../../../public/img/ribbon.png';
import gum from '../../../public/img/gum.png';
import { ModalWrapper } from './styled/AnimModalWrapper';
import { dataStore } from '../store/createStore';

const ItemImages = new Map([
  [1, pompom],
  [2, gakki],
  [3, ribbon],
  [4, gum],
]);

const ItemNames = new Map([
  [1, 'Pom-Pom Fruit Candy'],
  [2, 'Cookie Sticks'],
  [3, 'Ribbon Licorice'],
  [4, 'Maple-Flavor Ghost Gum'],
]);

// merchant window with listings. assumes at most 1 merchant per room
export function registerMerchantWindow() {
  registerUIComponent(
    'MerchantWindow',

    // Grid Config
    {
      colStart: 33,
      colEnd: 65,
      rowStart: 2,
      rowEnd: 60,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          world,
          api: { player },
          network,
          components: {
            Coin,
            IsListing,
            IsInventory,
            IsMerchant,
            IsOperator,
            ItemIndex,
            Location,
            MerchantID,
            Name,
            OperatorID,
            PlayerAddress,
            PriceBuy,
            PriceSell,
          },
          actions,
        },
      } = layers;

      // get a Merchant object by index
      const getMerchant = (index: EntityIndex) => {
        return {
          id: world.entities[index],
          index,
          name: getComponentValue(Name, index)?.value as string,
          location: getComponentValue(Location, index)?.value as number,
        };
      };

      // get a Listing object by index
      const getListing = (index: EntityIndex) => {
        return {
          id: world.entities[index],
          index,
          itemType: getComponentValue(ItemIndex, index)?.value as number,
          buyPrice: getComponentValue(PriceBuy, index)?.value as number,
          sellPrice: getComponentValue(PriceSell, index)?.value as number,
        };
      };

      return merge(OperatorID.update$, Location.update$).pipe(
        map(() => {
          // get the operator entity of the controlling wallet
          const operatorIndex = Array.from(
            runQuery([
              Has(IsOperator),
              HasValue(PlayerAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];
          const operatorID = world.entities[operatorIndex];

          // get player location and list of merchants in this room
          const location = getComponentValue(Location, operatorIndex)
            ?.value as number;
          const merchantResults = runQuery([
            Has(IsMerchant),
            HasValue(Location, { value: location }),
          ]);

          // if we have a merchant retrieve its listings
          let listings: any = [];
          let merchant, merchantIndex;
          if (merchantResults.size != 0) {
            merchantIndex = Array.from(merchantResults)[0];
            merchant = getMerchant(merchantIndex);
            const listingIndices = Array.from(
              runQuery([
                Has(IsListing),
                HasValue(MerchantID, { value: merchant.id }),
              ])
            );

            let listing;
            for (let i = 0; i < listingIndices.length; i++) {
              listing = getListing(listingIndices[i]);
              listings.push(listing);
            }
          }

          return {
            actions,
            api: player,
            data: {
              operator: {
                id: operatorID,
                // inventory, // we probably want this, filtered by the sellable items
                coin: getComponentValue(Coin, operatorIndex)?.value as number,
              },
              merchant,
              listings,
            } as any,
          };
        })
      );
    },

    // Render
    ({ actions, api, data }) => {
      const { visibleDivs, setVisibleDivs } = dataStore();
      // hide this component if merchant.index == 0

      ///////////////////
      // ACTIONS

      // buy from a listing
      const buy = (listing: any, amt: number) => {
        const actionID = `Buying ${amt} of ${
          listing.itemType
        } at ${Date.now()}` as EntityID; // itemType should be replaced with the item's name
        actions.add({
          id: actionID,
          components: {},
          // on: data.operator.index, // what's the appropriate value here?
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.listing.buy(listing.id, amt);
          },
        });
      };

      // sell to a listing
      const sell = (listing: any, amt: number) => {
        const actionID = `Selling ${amt} of ${
          listing.itemType
        } at ${Date.now()}` as EntityID; // itemType should be replaced with the item's name
        actions.add({
          id: actionID,
          components: {},
          // on: data.operator.index, // what's the appropriate value here?
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.listing.sell(listing.id, amt);
          },
        });
      };

      ///////////////////
      // DISPLAY

      // [listing: {id, index, itemType, buyPrice, sellPrice}]
      const listings = (slots: any) =>
        slots.map((listing: any) => (
          <ShopEntry key={listing.itemType}>
            <ItemImage src={ItemImages.get(parseInt(listing.itemType, 16))} />
            <ItemName>
              {ItemNames.get(parseInt(listing.itemType, 16))}{' '}
            </ItemName>
            <ItemPrice>{parseInt(listing.buyPrice, 16)}</ItemPrice>
            <Button
              style={{ pointerEvents: 'auto' }}
              onClick={() => buy(listing, 1)}
            >
              Buy
            </Button>
          </ShopEntry>
        ));

      const hideModal = () => {
        setVisibleDivs({
          ...visibleDivs,
          merchant: !visibleDivs.merchant,
        });
      };

      useEffect(() => {
        if (visibleDivs.merchant === true)
          document.getElementById('merchant')!.style.display = 'block';
      }, [visibleDivs.merchant]);

      return (
        <ModalWrapper id="merchant" isOpen={visibleDivs.merchant}>
          <ModalContent>
            <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
              X
            </TopButton>
            <ShopList>{listings(data.listings)}</ShopList>
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
  grid-column: 4;
  width: 50px;
  align-self: center;
`;

const ModalContent = styled.div`
  display: grid;
  background-color: white;
  border-radius: 10px;
  padding: 8px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
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
  grid-column: 1;
  grid-row: 1;
  width: 30px;
  &:active {
    background-color: #c2c2c2;
  }
  justify-self: right;
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
