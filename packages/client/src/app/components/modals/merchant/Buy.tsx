import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { Listing, getListing } from 'network/shapes/Listing';
import { ActionButton } from '../../library';

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
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          return { network };
        })
      ),

    // Render
    ({ network }) => {
      const { api, actions, components, world } = network;
      const { modals, setModals } = useVisibility();
      const { listingEntityIndex } = useSelected();
      const [listing, setListing] = useState(getListing(world, components, listingEntityIndex));
      const [quantity, setQuantity] = useState(1);

      // update current item based on selection
      // NOTE: may need to subscribe to component updates too, to resolve edge cases
      useEffect(() => {
        setListing(getListing(world, components, listingEntityIndex));
        setQuantity(1);
      }, [listingEntityIndex]);

      /////////////////
      // ACTIONS

      // buy from a listing
      const buy = (listing: Listing, amt: number) => {
        actions.add({
          action: 'ListingBuy',
          params: [listing.id, amt],
          description: `Buying ${amt} of ${listing.item!.name}`,
          execute: async () => {
            return api.player.listing.buy(listing.NPCIndex, [listing.item.index], amt);
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
      };

      /////////////////
      // RENDER

      const ConfirmButton = () => (
        <ActionButton onClick={() => buy(listing, quantity)} text='Confirm' />
      );

      const CancelButton = () => <ActionButton onClick={() => closeModal()} text='Cancel' />;

      return (
        <ModalWrapper id='buy' header={<Title>Confirm Purchase</Title>} overlay>
          <Content>
            <Image src={listing.item.image} />
            <InfoSection>
              <Name>{listing.item.name}</Name>
              <Description>{`lorem ipsum, description will go here`}</Description>
              <Description>{`unit price: $${listing.buyPrice}`}</Description>
              <InputRow>
                <Description>{`Quantity:  `}</Description>
                <Input
                  type='number'
                  min='1'
                  max='99'
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
    }
  );
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
  padding-left: 0.5vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
`;

const Name = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
  text-align: left;
`;

const Description = styled.div`
  padding-left: 0.2vw;
  color: black;
  font-family: Pixel;
  font-size: 0.7vw;
  text-align: left;
`;

const InputRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const Input = styled.input`
  border: 0.1vw solid black;
  border-radius: 0.5vw;
  width: 3vw;
  padding: 0.3vw;
  cursor: pointer;

  color: black;
  font-family: Pixel;
  font-size: 0.7vw;
  text-align: left;

  justify-content: center;
  align-items: center;
`;
