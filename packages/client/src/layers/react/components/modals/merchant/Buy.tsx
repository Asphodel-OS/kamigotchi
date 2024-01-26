import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import crypto from "crypto";

import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { Listing, getListing } from 'layers/network/shapes/Listing';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected } from 'layers/react/store/selected';
import { EntityID } from '@latticexyz/recs';
import { ActionButton } from '../../library/ActionButton';
import { useVisibility } from 'layers/react/store/visibility';

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

    // Requirement
    (layers) => interval(1000).pipe(map(() => {
      return { network: layers.network };
    })),

    // Render
    ({ network }) => {
      const { api, actions } = network;
      const { modals, setModals } = useVisibility();
      const { listingEntityIndex } = useSelected();
      const [listing, setListing] = useState(getListing(network, listingEntityIndex));
      const [quantity, setQuantity] = useState(1);

      // update current item based on selection
      // NOTE: may need to subscribe to component updates too, to resolve edge cases
      useEffect(() => {
        setListing(getListing(network, listingEntityIndex));
        setQuantity(1);
      }, [listingEntityIndex]);

      /////////////////
      // ACTIONS

      // buy from a listing
      const buy = (listing: Listing, amt: number) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'ListingBuy',
          params: [listing.id, amt],
          description: `Buying ${amt} of ${listing.item!.name}`,
          execute: async () => {
            return api.player.listing.buy(listing.id, amt);
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
        setModals({ ...modals, buy: false });
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
        <ModalWrapper
          id='buy'
          divName='buy'
          header={<Title>Confirm Purchase</Title>}
          overlay
        >
          <Content>
            <Image src={listing.item.image.default} />
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
        </ModalWrapper>
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