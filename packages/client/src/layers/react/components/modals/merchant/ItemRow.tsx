import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { Listing } from 'layers/react/shapes/Listing';

import pompom from 'assets/images/food/pompom.png';
import gakki from 'assets/images/food/gakki.png';
import gum from 'assets/images/food/gum.png';
import ribbon from 'assets/images/food/ribbon.png';


const ItemImages = new Map([
  [1, gum],
  [2, pompom],
  [3, gakki],
  [4, ribbon],
]);

export interface Props {
  listing: Listing;
  handleBuy: (listing: Listing, amt: number) => void;
}

// TODO: support multiple buys
export const ItemRow = (props: Props) => {
  const BuyButton = (listing: Listing) => (
    <ActionButton
      id={`button-buy-${listing.item.index}`}
      onClick={() => props.handleBuy(listing, 1)}
      text='Buy'
    />
  );

  return (
    <Row key={props.listing.item.index}>
      <Image src={ItemImages.get(props.listing.item.index)} />
      <Name>{props.listing.item.name}</Name>
      <Price>{props.listing.buyPrice}</Price>
      <ButtonWrapper>{BuyButton(props.listing)}</ButtonWrapper>
    </Row>
  );
}

const Row = styled.div`
  border-bottom: .15vw solid black;

  display: flex;
  flex-direction: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Image = styled.img`
  border-right: .15vw solid black;
  width: 3vw;
  padding: .3vw;
  font-family: Pixel;
`;

const Name = styled.div`
  padding-left: 1vw;

  color: black;
  font-family: Pixel;
  font-size: .9vw;
  
  text-align: left;
  flex-grow: 1;
`;

const Price = styled.div`
  padding-right: .5vw;

  color: black;
  font-family: Pixel;
  font-size: .9vw;
`;

const ButtonWrapper = styled.div`
  padding: .5vw;
  display: flex;
`;