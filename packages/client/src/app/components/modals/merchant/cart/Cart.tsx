import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import musuIcon from 'assets/images/icons/musu.png';
import { Account } from 'network/shapes/Account';
import { CartItem } from '../types';
import { CartRow } from './CartRow';

export interface Props {
  account: Account;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
}

export const Cart = (props: Props) => {
  const { account, cart, setCart } = props;

  const clearItem = (itemIndex: number) => {
    const newCart = [...cart];
    const cartIndex = cart.find((c) => c.listing.item.index === itemIndex);
    if (cartIndex) newCart.splice(newCart.indexOf(cartIndex), 1);
    setCart(newCart);
  };

  const setCartQuantity = (itemIndex: number, quantity: number) => {
    const newCart = [...cart];
    const cartIndex = cart.find((c) => c.listing.item.index === itemIndex);
    if (cartIndex) newCart[newCart.indexOf(cartIndex)].quantity = quantity;
    setCart(newCart);
  };

  const calcTotalPrice = () => {
    let total = 0;
    for (const c of cart) {
      total += c.listing.buyPrice * c.quantity;
    }
    return total;
  };

  return (
    <Container>
      <Title>Cart</Title>
      <Items>
        {cart.map((c) => (
          <CartRow
            key={c.listing.item.index}
            listing={c.listing}
            remove={() => clearItem(c.listing.item.index)}
            quantity={c.quantity}
            setQuantity={(quantity) => setCartQuantity(c.listing.item.index, quantity)}
          />
        ))}
      </Items>
      {cart.length > 0 && (
        <Checkout>
          <MusuReport>
            <Icon src={musuIcon} />
            <Text>{calcTotalPrice().toLocaleString()}</Text>
          </MusuReport>
          <ActionButton
            text='Buy'
            disabled={calcTotalPrice() > account.coin}
            onClick={() => setCart([])}
          />
        </Checkout>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow-y: scroll;
  min-width: 15vw;
`;

const Title = styled.div`
  position: absolute;
  background-color: #ddd;
  border-radius: 0 0.25vw 0 0;
  width: 100%;
  padding: 2.4vh 1.8vh;
  opacity: 0.9;

  color: black;
  font-family: Pixel;
  font-size: 1.8vh;
  text-align: left;
  z-index: 2;
`;

const Items = styled.div`
  padding: 7.5vh 0.6vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;

const Checkout = styled.div`
  position: absolute;
  background-color: #ddd;
  border-radius: 0 0 0.25vw 0;
  width: 100%;
  height: 4.5vh;
  bottom: 0;
  padding: 1.2vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const MusuReport = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.6vw;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  margin-right: 0.3vw;
`;

const Text = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;
