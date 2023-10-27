import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Listing, getListing } from 'layers/react/shapes/Listing';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { FoodImages, ReviveImages } from 'constants/food';
import { Item, getItem, getItemByIndex } from 'layers/react/shapes/Item';
import { EntityID } from '@latticexyz/recs';
import { ActionButton } from '../../library/ActionButton';
import { dataStore } from 'layers/react/store/createStore';

// merchant window with listings. assumes at most 1 merchant per room
export function registerBuyModal() {
  registerUIComponent(
    'BuyModal',
    {
      colStart: 35,
      colEnd: 65,
      rowStart: 22,
      rowEnd: 58,
    },
    (layers) => {
      const {
        network: {
          api: { player },
          components: {
            FoodIndex,
            ReviveIndex,
            ItemIndex,
            Description,
            Name,
          },
          actions,
        },
      } = layers;

      return merge(
        FoodIndex.update$,
        ReviveIndex.update$,
        ItemIndex.update$,
        Description.update$,
        Name.update$,
      ).pipe(
        map(() => {
          return {
            layers,
            actions,
            api: player,
          };
        })
      );
    },

    ({ layers, actions, api }) => {
      const { visibleModals, setVisibleModals } = dataStore();
      const { listingEntityIndex } = useSelectedEntities();
      const [listing, setListing] = useState(getListing(layers, listingEntityIndex));
      const [quantity, setQuantity] = useState(1);

      // update current item based on selection
      // NOTE: may need to subscribe to component updates too, to resolve edge cases
      useEffect(() => {
        setListing(getListing(layers, listingEntityIndex));
        setQuantity(1);
      }, [listingEntityIndex]);


      /////////////////
      // INTERPRETATION

      const getImage = (item: Item) => {
        if (item.type == 'FOOD') {
          return FoodImages.get(item.familyIndex ? item.familyIndex : 0);
        } else if (item.type == 'REVIVE') {
          return ReviveImages.get(item.familyIndex ? item.familyIndex : 0);
        }
      }

      /////////////////
      // ACTIONS

      // buy from a listing
      const buy = (listing: Listing, amt: number) => {
        const actionID = `Buying ${amt} ${listing.item.name}` as EntityID;
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.listing.buy(listing.id, amt);
          },
        });
        closeModal();
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = Number(event.target.value);
        if (value > 99) value = 99;
        if (value < 1) value = 1;
        setQuantity(value);
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          buy(listing, quantity);
        }
      };

      const closeModal = () => {
        setVisibleModals({ ...visibleModals, buy: false });
        setQuantity(1);
      }


      /////////////////
      // RENDER

      const ConfirmButton = () => (
        <ActionButton
          id={`button-confirm`}
          onClick={() => buy(listing, quantity)}
          text='Confirm'
        />
      );

      const CancelButton = () => (
        <ActionButton
          id={`button-cancel`}
          onClick={() => closeModal()}
          text='Cancel'
        />
      );

      return (
        <ModalWrapperFull
          id='buy'
          divName='buy'
          header={<Title>Confirm Purchase</Title>}
          overlay
        >
          <Content>
            <Image src={getImage(listing.item)} />
            <InfoSection>
              <Name>{listing.item.name}</Name>
              <Description>{`lorem ipsum, description will go here`}</Description>
              <Description>{`unit price: $${listing.buyPrice}`}</Description>
              <InputRow>
                <Description>{`Quantity:  `}</Description>
                <Input
                  type='number'
                  min="1"
                  max="99"
                  value={quantity}
                  onKeyDown={(e) => catchKeys(e)}
                  onChange={(e) => handleChange(e)}
                />
                <Description>{` ($${quantity * listing.buyPrice})`}</Description>
              </InputRow>
            </InfoSection>
          </Content>
          <ButtonRow>
            <CancelButton />
            <ConfirmButton />
          </ButtonRow>
        </ModalWrapperFull>
      );
    })
}


const Title = styled.div`
  width: 100%;
  padding: 1vw;
  color: black;
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
`;

const Content = styled.div`
  padding-top: 1vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const ButtonRow = styled.div`
  padding: 2vw;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-evenly;
`;

const Image = styled.img`
  width: 7.5vw;
  margin: 1vw;
`;

const InfoSection = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
  padding-left: .5vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
`;

const Name = styled.div`
  color: black;
  font-family: Pixel;
  font-size: .9vw;
  text-align: left;
`;

const Description = styled.div`
  padding-left: .2vw;
  color: black;
  font-family: Pixel;
  font-size: .7vw;
  text-align: left
`;

const InputRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const Input = styled.input`
  border: .1vw solid black;
  border-radius: .5vw;
  width: 3vw;
  padding: .3vw;
  cursor: pointer;
  
  color: black;
  font-family: Pixel;
  font-size: .7vw;
  text-align: left;

  justify-content: center;
  align-items: center;
`;