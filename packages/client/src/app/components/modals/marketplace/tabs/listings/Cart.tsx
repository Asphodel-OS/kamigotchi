import styled from 'styled-components';
import { formatUnits } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { useAccount } from 'app/stores';
import { OperatorIcon } from 'assets/images/icons/menu';
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
  const account = useAccount((s) => s.account);
  const { data: balanceData, refetch } = useBalance({
    address: account.ownerAddress,
  });
  useWatchBlockNumber({ onBlockNumber: () => refetch() });

  const formattedBalance = balanceData
    ? Number(formatUnits(balanceData.value, 18)).toFixed(6).replace(/\.?0+$/, '')
    : '—';

  const totalPrice = cart.reduce((sum, item) => sum + BigInt(item.Price), 0n);
  const formattedTotal = cart.length > 0 ? formatPrice(totalPrice.toString()) : '0';
  const overBudget = balanceData ? totalPrice > balanceData.value : false;

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
        <FooterInfo>
          <InfoChip $variant='blue'>
            <ChipIcon src={OperatorIcon} />
            <CartEthIcon src={TokenIcons.eth} alt='ETH' />
            <InfoValue>{formattedBalance}</InfoValue>
          </InfoChip>
          <InfoChip $variant={overBudget ? 'red' : 'green'}>
            <StyledCartIcon />
            <CartEthIcon src={TokenIcons.eth} alt='ETH' />
            <InfoValue>{formattedTotal}</InfoValue>
          </InfoChip>
        </FooterInfo>
        <FooterButtons>
          <TextTooltip
            text={['Newly adopted Kami need to take a 60m nap!']}
            size={0.9}
            delay={0}
            alignText='center'
          >
            <HintIcon>?</HintIcon>
          </TextTooltip>
          <IconButton
            text='Remove All'
            onClick={onClear}
            disabled={cart.length === 0}
            color='#FDECEC'
            scale={3}
          />
          {overBudget ? (
            <NoFundsButton
              text='Not Enough Funds'
              disabled
              color='#FDECEC'
              scale={3}
            />
          ) : (
            <BuyButton
              text={cart.length <= 1 ? 'Buy' : 'Buy All'}
              onClick={onBuy}
              disabled={cart.length === 0}
              color='#A2D9CE'
              scale={3}
            />
          )}
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

const FooterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
`;

const CHIP_STYLES = {
  blue: { bg: '#E8F0FE', border: '#A0C0E8' },
  green: { bg: '#E8F5E9', border: '#A0D8A8' },
  red: { bg: '#FDECEC', border: '#E8A0A0' },
};

const InfoChip = styled.div<{ $variant: 'blue' | 'green' | 'red' }>`
  display: flex;
  align-items: center;
  gap: 0.25vw;
  padding: 0.3vw 0.5vw;
  border-radius: 0.3vw;
  background: ${({ $variant }) => CHIP_STYLES[$variant].bg};
  border: 0.06vw solid ${({ $variant }) => CHIP_STYLES[$variant].border};
`;

const ChipIcon = styled.img`
  width: 1.2vw;
  height: 1.2vw;
`;

const StyledCartIcon = styled(ShoppingCartIcon)`
  && {
    width: 1.2vw;
    height: 1.2vw;
    font-size: 1.2vw;
    color: #555;
  }
`;

const InfoValue = styled.span`
  font-size: 0.85vw;
  font-weight: 700;
`;

const FooterButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
`;

const HintIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8vw;
  height: 1.8vw;
  border-radius: 50%;
  border: 0.15vw solid #999;
  background: #f0f0f0;
  color: #555;
  font-size: 1.1vw;
  font-weight: 900;
  cursor: help;
  flex-shrink: 0;
`;

const BuyButton = styled(IconButton)`
  font-weight: bold;
`;

const NoFundsButton = styled(IconButton)`
  font-weight: bold;
`;
