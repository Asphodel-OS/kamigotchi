import styled from 'styled-components';

import { EmptyText, IconButton } from 'app/components/library';
import { TokenIcons } from 'assets/images/tokens';
import { KamiMarketListing } from 'clients/kamiden';
import { Kami } from 'network/shapes/Kami';

export const Cart = ({
  isVisible,
  cart,
  onClose,
  onBuy,
  onClear,
  onRemove,
  onOpenKami,
  resolveKami,
  formatPrice,
}: {
  isVisible: boolean;
  cart: KamiMarketListing[];
  onClose: () => void;
  onBuy: () => void;
  onClear: () => void;
  onRemove: (orderId: string) => void;
  onOpenKami: (index: number) => void;
  resolveKami: (index: number) => Kami | undefined;
  formatPrice: (weiString: string) => string;
}) => (
  <CartSection isVisible={isVisible}>
    <CartHeader>
      <HeaderTitle>Cart</HeaderTitle>
      <IconButton text='X' onClick={onClose} scale={1.5} />
    </CartHeader>
    <CartHeaderRow>
      <CartHeaderCell>Kami</CartHeaderCell>
      <CartHeaderCell>
        <CartEthIcon src={TokenIcons.eth} alt='ETH' />
      </CartHeaderCell>
      <CartHeaderCell>Actions</CartHeaderCell>
    </CartHeaderRow>
    <CartBody>
      {cart.length === 0 && <EmptyText text={['Your cart is empty']} size={0.9} />}
      {cart.map((item) => {
        const kami = resolveKami(item.KamiIndex);
        return (
          <CartRow key={item.OrderID}>
            <CartItem>
              {kami && (
                <CartKamiThumbnail
                  src={kami.image}
                  alt={kami.name}
                  onClick={() => onOpenKami(item.KamiIndex)}
                />
              )}
              <CartItemText>{kami?.name ?? `Kami #${item.KamiIndex}`}</CartItemText>
            </CartItem>
            <CartPriceText>{formatPrice(item.Price)}</CartPriceText>
            <CartActions>
              <IconButton text='Remove' onClick={() => onRemove(item.OrderID)} />
            </CartActions>
          </CartRow>
        );
      })}
    </CartBody>
    <CartFooter>
      <IconButton text='Buy' onClick={onBuy} disabled={cart.length === 0} />
      <IconButton text='Clear' onClick={onClear} disabled={cart.length === 0} />
    </CartFooter>
  </CartSection>
);

const CartSection = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 50%;
  overflow: hidden;
  border-top: 0.15vw solid black;
  width: 100%;
`;

const CartHeader = styled.div`
  display: flex;
  align-items: center;
  background-color: rgb(221, 221, 221);
  padding: 0.8vw;
  font-size: 1.2vw;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const HeaderTitle = styled.span`
  flex: 1;
  text-align: center;
  font-size: 1.1vw;
`;

const CartBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
  padding: 0.6vw;
  flex: 1;
  overflow-y: auto;
`;

const CartHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  padding: 0.3vw 0.6vw;
  min-height: 2.6vw;
`;

const CartHeaderCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1vw;
  line-height: 1.2;
  height: 100%;

  &:first-child {
    justify-content: flex-start;
  }
`;

const CartEthIcon = styled.img`
  width: 1.1vw;
  height: 1.1vw;
`;

const CartRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  gap: 0.6vw;
  padding: 0.4vw 0.6vw;
  border: 0.06vw solid #ccc;
  border-radius: 0.3vw;
`;

const CartItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
`;

const CartItemText = styled.span`
  font-size: 0.9vw;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const CartKamiThumbnail = styled.img`
  width: 2.4vw;
  height: 2.4vw;
  border-radius: 0.3vw;
  border: 0.1vw solid black;
  image-rendering: pixelated;
  cursor: pointer;
`;

const CartPriceText = styled.span`
  font-size: 0.9vw;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CartActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
  justify-content: center;
`;

const CartFooter = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.6vw;
  padding: 0.6vw;
  position: sticky;
  bottom: 0;
  background-color: rgb(255, 255, 255);
  margin-top: auto;
`;
