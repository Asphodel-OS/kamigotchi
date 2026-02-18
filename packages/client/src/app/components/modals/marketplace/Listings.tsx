import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { EmptyText, IconButton, IconListButton, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { getKamidenClient, KamiMarketListing } from 'clients/kamiden';
import { TokenIcons } from 'assets/images/tokens';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

const KamidenClient = getKamidenClient();

const formatPrice = (weiString: string) => {
  if (!weiString || weiString === '0') return '0';
  const num = Number(formatUnits(BigInt(weiString), 18));
  if (num < 0.001) return '<0.001';
  return num.toFixed(3);
};

const formatExpiry = (expiryStr: string) => {
  const expiry = Number(expiryStr);
  if (expiry === 0) return 'Never';
  const diff = expiry - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'Expired';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

export const Listings = ({
  isVisible,
  onOpenFilter,
  onBuyListings,
  utils,
}: {
  isVisible: boolean;
  onOpenFilter: () => void;
  onBuyListings: (listingIDs: string[], kamiIndices: number[]) => void;
  utils: {
    queryKamiByIndex: (index: number) => EntityIndex | undefined;
    getKami: (entity: EntityIndex) => Kami;
  };
}) => {
  const kamiIndex = useSelected((s) => s.kamiIndex);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setModals = useVisibility((s) => s.setModals);
  const [listings, setListings] = useState<KamiMarketListing[]>([]);
  const [sortBy, setSortBy] = useState('Latest');
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<KamiMarketListing[]>([]);

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;
    KamidenClient.getKamiMarketListings({}).then((res) => setListings(res.Listings ?? []));
  }, [isVisible]);

  useEffect(() => {
    setCart((prev) => prev.filter((item) => listings.some((l) => l.OrderID === item.OrderID)));
  }, [listings]);

  const resolvedListings = useMemo(
    () =>
      listings.map((listing) => {
        const entity = utils.queryKamiByIndex(listing.KamiIndex);
        const kami = entity !== undefined ? utils.getKami(entity) : undefined;
        return { listing, kami };
      }),
    [listings]
  );

  const sorted = useMemo(() => {
    const copy = [...resolvedListings];
    if (sortBy === 'Price Low')
      return copy.sort((a, b) => Number(BigInt(a.listing.Price) - BigInt(b.listing.Price)));
    if (sortBy === 'Price High')
      return copy.sort((a, b) => Number(BigInt(b.listing.Price) - BigInt(a.listing.Price)));
    return copy.sort((a, b) => b.listing.Timestamp - a.listing.Timestamp);
  }, [resolvedListings, sortBy]);

  const sortOptions = [
    { text: 'Latest', onClick: () => setSortBy('Latest') },
    { text: 'Price Low', onClick: () => setSortBy('Price Low') },
    { text: 'Price High', onClick: () => setSortBy('Price High') },
  ];

  const isListingExpired = (expiryStr: string) => {
    const expiry = Number(expiryStr);
    if (!expiry) return false;
    return expiry <= Math.floor(Date.now() / 1000);
  };

  const isInCart = (orderId: string) => cart.some((item) => item.OrderID === orderId);

  const openKamiModal = (index: number) => {
    const sameKami = kamiIndex === index;
    if (!sameKami) setKami(index);
    if (kamiModalOpen && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  const resolveKami = (index: number) => {
    const entity = utils.queryKamiByIndex(index);
    return entity !== undefined ? utils.getKami(entity) : undefined;
  };

  const addToCart = (listing: KamiMarketListing) => {
    if (isInCart(listing.OrderID)) return;
    setCart((prev) => [...prev, listing]);
  };

  const removeFromCart = (orderId: string) => {
    setCart((prev) => prev.filter((item) => item.OrderID !== orderId));
  };

  const handleBuyCart = () => {
    if (cart.length === 0) return;
    onBuyListings(
      cart.map((item) => item.OrderID),
      cart.map((item) => item.KamiIndex)
    );
    setCart([]);
    setShowCart(false);
  };

  return (
    <>
      <Tab isVisible={isVisible}>
        <ButtonWrapper>
          <TextTooltip text={['Sorting']}>
            <IconListButton
              img={SwapVertIcon as any}
              text={sortBy}
              options={sortOptions}
              radius={0.6}
            />
          </TextTooltip>
          <TextTooltip text={['Filters']}>
            <IconButton img={FilterListIcon} onClick={onOpenFilter} />
          </TextTooltip>
          <TextTooltip text={['Cart']}>
            <IconButton img={ShoppingCartIcon} onClick={() => setShowCart((prev) => !prev)} />
          </TextTooltip>
        </ButtonWrapper>
        <HeaderRow>
          <Column flex={2}>
            <ColumnHeader align='left'>Kami</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>
              <EthIcon src={TokenIcons.eth} alt='ETH' />
            </ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>Expiry</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>Actions</ColumnHeader>
          </Column>
        </HeaderRow>
        {sorted.length === 0 && <EmptyText text={['No listings found']} size={0.9} />}
        {sorted.map(({ listing, kami }) => (
          <Row key={listing.OrderID}>
          <Column flex={2}>
            <KamiCell>
              {kami && (
                <KamiThumbnail
                  src={kami.image}
                  alt={kami.name}
                  onClick={() => openKamiModal(listing.KamiIndex)}
                />
              )}
              <KamiName>{kami?.name ?? `Kami #${listing.KamiIndex}`}</KamiName>
            </KamiCell>
          </Column>
            <Column>
              <CellText>{formatPrice(listing.Price)}</CellText>
            </Column>
            <Column>
              <CellText>{formatExpiry(listing.Expiry)}</CellText>
            </Column>
          <Column>
            {isListingExpired(listing.Expiry) ? (
              <TextTooltip text={['Listing expired']}>
                <IconButton
                  text='Add'
                  onClick={() => addToCart(listing)}
                  disabled
                />
              </TextTooltip>
            ) : (
              <IconButton
                text={isInCart(listing.OrderID) ? 'Added' : 'Add'}
                onClick={() => addToCart(listing)}
                disabled={isInCart(listing.OrderID)}
              />
            )}
          </Column>
        </Row>
      ))}
      </Tab>
      <CartSection isVisible={isVisible && showCart}>
        <CartHeader>
          <HeaderTitle>Cart</HeaderTitle>
          <IconButton text='X' onClick={() => setShowCart(false)} scale={1.5} />
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
                    onClick={() => openKamiModal(item.KamiIndex)}
                  />
                )}
                <CartItemText>{kami?.name ?? `Kami #${item.KamiIndex}`}</CartItemText>
              </CartItem>
              <CartPriceText>{formatPrice(item.Price)}</CartPriceText>
              <CartActions>
                <IconButton text='Remove' onClick={() => removeFromCart(item.OrderID)} />
              </CartActions>
            </CartRow>
          );
        })}
        </CartBody>
        <CartFooter>
          <IconButton text='Buy' onClick={handleBuyCart} disabled={cart.length === 0} />
          <IconButton text='Clear' onClick={() => setCart([])} disabled={cart.length === 0} />
        </CartFooter>
      </CartSection>
    </>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 1;
  overflow: auto;
  width: 100%;
  min-height: 10vw;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 0.4vw;
  padding: 0.4vw;
  width: fit-content;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  min-height: 3vw;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  border-bottom: 0.06vw solid #ccc;
  min-height: 3vw;
  margin: 0.2vw 0;

  &:hover {
    background-color: #eee;
  }
`;

const Column = styled.div<{ flex?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: ${({ flex }) => flex ?? 1};
`;

const ColumnHeader = styled.div<{ align?: 'left' | 'center' }>`
  display: flex;
  align-items: center;
  justify-content: ${({ align }) => (align === 'left' ? 'flex-start' : 'center')};
  padding: 0.4vw 0.6vw;
  font-size: 1.05vw;
  line-height: 1.2;
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const KamiCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  padding: 0.4vw;
`;

const KamiThumbnail = styled.img`
  width: 3vw;
  height: 3vw;
  border-radius: 0.3vw;
  border: 0.1vw solid black;
  image-rendering: pixelated;
  cursor: pointer;
`;

const KamiName = styled.span`
  font-size: 0.9vw;
`;

const CellText = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95vw;
  line-height: 1.2;
  padding: 0.4vw 0.6vw;
`;

const CartSection = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 50%;
  overflow: auto;
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
  margin-top: auto;
`;
