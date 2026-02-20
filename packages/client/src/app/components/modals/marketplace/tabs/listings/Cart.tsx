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
}) => {
  const totalPrice = cart.reduce((sum, item) => sum + BigInt(item.Price), 0n);
  const formattedTotal = cart.length > 0 ? formatPrice(totalPrice.toString()) : '0';

  return (
    <CartSection isVisible={isVisible}>
      <CartHeader>
        <HeaderTitle>Cart</HeaderTitle>
        <IconButton text='X' onClick={onClose} scale={1.5} />
      </CartHeader>
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
              <CartPriceCell>
                <CartEthIcon src={TokenIcons.eth} alt='ETH' />
                <CartPriceText>{formatPrice(item.Price)}</CartPriceText>
              </CartPriceCell>
              <CartActions>
                <IconButton
                  text='Remove'
                  onClick={() => onRemove(item.OrderID)}
                  color='#FDECEC'
                />
              </CartActions>
            </CartRow>
          );
        })}
      </CartBody>
      <CartFooter>
        <TotalSection>
          <TotalLabel>Total Price:</TotalLabel>
          <CartEthIcon src={TokenIcons.eth} alt='ETH' />
          <TotalValue>{formattedTotal}</TotalValue>
        </TotalSection>
        <FooterButtons>
          <IconButton
            text='Remove All'
            onClick={onClear}
            disabled={cart.length === 0}
            color='#FDECEC'
            scale={3}
          />
          <BuyButton
            text='Buy All'
            onClick={onBuy}
            disabled={cart.length === 0}
            color='#A2D9CE'
            scale={3}
          />
        </FooterButtons>
      </CartFooter>
    </CartSection>
  );
};

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
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const CartRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.8fr;
  align-items: center;
  gap: 0.6vw;
  padding: 0.4vw 0.6vw;
  border: 0.06vw solid #ccc;
  border-radius: 0.3vw;
  background: #fafafa;
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

const CartPriceCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3vw;
`;

const CartEthIcon = styled.img`
  width: 1.1vw;
  height: 1.1vw;
`;

const CartPriceText = styled.span`
  font-size: 0.9vw;
`;

const CartActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
  justify-content: center;
`;

const CartFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6vw;
  position: sticky;
  bottom: 0;
  background-color: rgb(240, 240, 240);
  border-top: 0.1vw solid #ccc;
  margin-top: auto;
`;

const TotalSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const TotalLabel = styled.span`
  font-size: 0.95vw;
  font-weight: bold;
`;

const TotalValue = styled.span`
  font-size: 0.95vw;
  font-weight: bold;
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 0.4vw;
`;

const BuyButton = styled(IconButton)`
  font-weight: bold;
`;
