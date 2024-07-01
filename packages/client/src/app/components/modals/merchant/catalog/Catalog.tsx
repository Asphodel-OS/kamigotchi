import styled from 'styled-components';

import { Listing } from 'network/shapes/Listing';
import { CartItem } from '../types';
import { CatalogRow } from './CatalogRow';

export interface Props {
  listings: Listing[];
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
}

export const Catalog = (props: Props) => {
  const { listings, cart, setCart } = props;

  const toggleListing = (itemIndex: number) => {
    const newCart = [...cart];
    const cartIndex = cart.find((c) => c.listing.item.index === itemIndex);
    const listingIndex = listings.findIndex((l) => l.item.index === itemIndex);

    if (cartIndex) newCart.splice(newCart.indexOf(cartIndex), 1);
    else newCart.push({ listing: listings[listingIndex], quantity: 1 });
    setCart(newCart);
  };

  return (
    <Container>
      <Title>Catalog</Title>
      <Items>
        {listings.map((l) => (
          <CatalogRow
            key={l.entityIndex}
            listing={l}
            cart={cart}
            toggle={() => toggleListing(l.item.index)}
          />
        ))}
      </Items>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-right: solid black 0.15vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  overflow-y: scroll;
  flex-grow: 2;
`;

const Title = styled.div`
  position: absolute;
  background-color: #ddd;
  border-radius: 0.25vw 0 0 0;
  width: 100%;
  padding: 2.4vh 1.8vh;
  opacity: 0.9;

  color: black;
  font-family: Pixel;
  font-size: 1.8vh;
  text-align: left;
  z-index: 1;
`;

const Items = styled.div`
  padding: 7.5vh 0.6vw 0.6vw 0.6vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;
