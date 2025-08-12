import styled from 'styled-components';

import { calcListingBuyPrice } from 'app/cache/npc';
import { clickFx, hoverFx } from 'app/styles/effects';
import { ItemImages } from 'assets/images/items';
import { Account } from 'network/shapes/Account';
import { CartItem } from '../types';
import { CartRow } from './CartRow';

export const Cart = ({
  account,
  cart,
  setCart,
  buy,
}: {
  account: Account;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  buy: (cart: CartItem[]) => void;
}) => {

  const calcTotalPrice = () => {
    let total = 0;
    for (const c of cart) {
      total += calcListingBuyPrice(c.listing, c.quantity);
    }
    return total;
  };

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

  const handleBuy = (cart: CartItem[]) => {
    const filteredCart = cart.filter((c) => c.quantity > 0);
    buy(filteredCart);
    setCart([]);
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
      {cart.length > 0 ? (
        <Checkout>
          <BuyButton onClick={() => handleBuy(cart)} disabled={calcTotalPrice() > account.coin}>
            <Total>
              <Icon src={ItemImages.musu} />
              <Text>{calcTotalPrice().toLocaleString()}</Text>
            </Total>
            <Text>Buy</Text>
          </BuyButton>
        </Checkout>
      ) : (
        <EmptyText>Your cart is empty.</EmptyText>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 35%;

  display: flex;
  flex-flow: column nowrap;
  flex-grow: 2;
`;

const Title = styled.div`
  position: absolute;
  background-color: rgba(92, 83, 86, 0.9);
  border-radius: 0 0.25vw 0 0;
  width: 100%;
  padding: 1.2vw;

  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 1;
`;

const Items = styled.div`
  padding: 4.2vw 0 3.5vw 0;
  gap: 0.6vw;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;

  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  scrollbar-color: transparent transparent;
`;

const Checkout = styled.div`
  position: absolute;
  border-radius: 0 0 0.25vw 0;
  width: 66%;
  height: 4.5vh;
  bottom: 0;
  right: 0;
  padding: 0 0.6vw 1.8vw 0;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const BuyButton = styled.div<{
  disabled?: boolean;
}>`
  border: solid 0.15vw black;
  border-radius: 0.4vw;

  width: 100%;
  margin: 0.6vh 0;
  padding: 0.6vh 0.9vw;
  gap: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
  &:active {
    animation: ${() => clickFx()} 0.3s;
  }
`;

const Total = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.6vw;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
`;

const Text = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
`;

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1.2vw;
  text-align: center;
  color: #333;
  padding: 0.9vh 0vw;
  margin: 3vh;
  height: 100%;
`;
