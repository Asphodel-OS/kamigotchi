import styled from 'styled-components';

import { Listing } from 'network/shapes/Listing';
import { CartItem } from '../types';
import { CartRow } from './CartRow';

export interface Props {
  listings: Listing[];
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
}

export const Cart = (props: Props) => {
  const { listings, cart, setCart } = props;

  const clearItem = (itemIndex: number) => {
    const newCart = [...cart];
    const cartIndex = cart.find((c) => c.listing.item.index === itemIndex);
    if (cartIndex) newCart.splice(newCart.indexOf(cartIndex), 1);
    setCart(newCart);
  };

  return (
    <Container>
      <Title>Cart</Title>
      <Items>
        {cart.map((c) => (
          <CartRow
            key={c.listing.item.index}
            listing={c.listing}
            clear={() => clearItem(c.listing.item.index)}
          />
        ))}
      </Items>
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow-y: scroll;
  flex-grow: 1;
`;

const Title = styled.div`
  width: 100%;
  padding: 1.2vw 0.9vw;
  color: black;
  font-family: Pixel;
  font-size: 1.2vw;
  text-align: left;
`;

const Items = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;
