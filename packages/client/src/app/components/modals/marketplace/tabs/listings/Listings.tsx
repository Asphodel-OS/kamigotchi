import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

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
import { Cart } from './Cart';

const KamidenClient = getKamidenClient();
const SwapVertIconImage = SwapVertIcon as unknown as string;

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
  onCloseFilter,
  onCloseCreateOrder,
  createOrderOpen,
  accountId,
  filters,
  utils,
}: {
  isVisible: boolean;
  onOpenFilter: () => void;
  onBuyListings: (listingIDs: string[], kamiIndices: number[]) => void;
  onCloseFilter: () => void;
  onCloseCreateOrder: () => void;
  createOrderOpen: boolean;
  accountId: string;
  filters: {
    selected: Record<string, Set<string>>;
    stats: Record<string, number>;
  };
  utils: {
    queryKamiByIndex: (index: number) => EntityIndex | undefined;
    getKami: (entity: EntityIndex) => Kami;
    getKamiDetailed: (entity: EntityIndex) => Kami;
    isDifferentAccountId: (lhs: string, rhs: string) => boolean;
    formatEthPrice: (weiString: string, decimals: number) => string;
  };
}) => {
  /////////////////
  // INSTANTIATIONS

  const kamiIndex = useSelected((s) => s.kamiIndex);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setModals = useVisibility((s) => s.setModals);

  const [listings, setListings] = useState<KamiMarketListing[]>([]);
  const [sortBy, setSortBy] = useState('Latest');
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<KamiMarketListing[]>([]);

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;

    let isActive = true;
    const refreshListings = async () => {
      const res = await KamidenClient.getKamiMarketListings({});
      if (!isActive) return;
      const all = res.Listings ?? [];
      const filtered = all.filter((listing) =>
        utils.isDifferentAccountId(listing.SellerAccountID, accountId)
      );
      setListings(filtered);
    };

    refreshListings();
    const intervalId = window.setInterval(refreshListings, 10000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isVisible, accountId]);

  const formatPrice = (weiString: string) => utils.formatEthPrice(weiString, 3);

  useEffect(() => {
    if (createOrderOpen) setShowCart(false);
  }, [createOrderOpen]);

  useEffect(() => {
    setCart((prev) => prev.filter((item) => listings.some((l) => l.OrderID === item.OrderID)));
  }, [listings]);

  /////////////////
  // PREPARATION

  const resolvedListings = useMemo(
    () =>
      listings.map((listing) => {
        const entity = utils.queryKamiByIndex(listing.KamiIndex);
        const kami = entity !== undefined ? utils.getKami(entity) : undefined;
        return { listing, kami, entity };
      }),
    [listings, utils]
  );

  const hasActiveFilters = useMemo(() => {
    const traitActive = Object.values(filters.selected).some((set) => set.size > 0);
    const statActive = Object.entries(filters.stats).some(([key, value]) =>
      key === 'Slots' ? value > 1 : value > 10
    );
    return traitActive || statActive;
  }, [filters.selected, filters.stats]);

  const activeFilterCount = useMemo(() => {
    const traitCount = Object.values(filters.selected).reduce(
      (sum, set) => sum + (set.size > 0 ? 1 : 0),
      0
    );
    const statCount = Object.entries(filters.stats).reduce(
      (sum, [key, value]) => sum + (key === 'Slots' ? (value > 1 ? 1 : 0) : value > 10 ? 1 : 0),
      0
    );
    return traitCount + statCount;
  }, [filters.selected, filters.stats]);

  const filteredListings = useMemo(() => {
    if (!hasActiveFilters) return resolvedListings;
    return resolvedListings.filter(({ entity }) => {
      if (entity === undefined) return false;
      const kamiDetailed = utils.getKamiDetailed(entity);
      const traits = kamiDetailed?.traits;
      const stats = kamiDetailed?.stats;
      if (!traits || !stats) return false;

      const traitMatches = (key: string, value?: string) => {
        const selected = filters.selected[key];
        if (!selected || selected.size === 0) return true;
        if (!value) return false;
        return selected.has(value);
      };

      if (!traitMatches('Face', traits.face?.name)) return false;
      if (!traitMatches('Hands', traits.hand?.name)) return false;
      if (!traitMatches('Body Type', traits.body?.name)) return false;
      if (!traitMatches('Body Color', traits.color?.name)) return false;
      if (!traitMatches('Background', traits.background?.name)) return false;

      const meetsStat = (key: string, statTotal?: number) => {
        const min = filters.stats[key] ?? 10;
        const base = key === 'Slots' ? 1 : 10;
        if (min <= base) return true;
        if (statTotal == null) return false;
        return statTotal >= min;
      };

      if (!meetsStat('Health', stats.health?.total)) return false;
      if (!meetsStat('Power', stats.power?.total)) return false;
      if (!meetsStat('Violence', stats.violence?.total)) return false;
      if (!meetsStat('Harmony', stats.harmony?.total)) return false;
      if (!meetsStat('Slots', stats.slots?.total)) return false;

      return true;
    });
  }, [resolvedListings, hasActiveFilters, filters.selected, filters.stats, utils]);

  const sorted = useMemo(() => {
    const copy = [...filteredListings];
    if (sortBy === 'Price Low')
      return copy.sort((a, b) => Number(BigInt(a.listing.Price) - BigInt(b.listing.Price)));
    if (sortBy === 'Price High')
      return copy.sort((a, b) => Number(BigInt(b.listing.Price) - BigInt(a.listing.Price)));
    return copy.sort((a, b) => b.listing.Timestamp - a.listing.Timestamp);
  }, [filteredListings, sortBy]);

  const sortOptions = [
    { text: 'Latest', onClick: () => setSortBy('Latest') },
    { text: 'Price Low', onClick: () => setSortBy('Price Low') },
    { text: 'Price High', onClick: () => setSortBy('Price High') },
  ];

  /////////////////
  // ACTIONS

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

  /////////////////
  // DISPLAY

  return (
    <>
      <Tab isVisible={isVisible}>
        <ButtonWrapper>
          <IconListButton
            img={SwapVertIconImage}
            text={sortBy}
            options={sortOptions}
            radius={0.6}
            tooltip={{ text: ['Sorting.'] }}
          />
          <TextTooltip text={['Filters.']}>
            <IndicatorWrapper>
              <IconButton
                img={FilterListIcon}
                onClick={() => {
                  setShowCart(false);
                  onOpenFilter();
                }}
              />
              {hasActiveFilters && <IndicatorBadge>{activeFilterCount}</IndicatorBadge>}
            </IndicatorWrapper>
          </TextTooltip>
          <TextTooltip text={['Cart.']}>
            <IndicatorWrapper>
              <IconButton
                img={ShoppingCartIcon}
                onClick={() => {
                  onCloseCreateOrder();
                  onCloseFilter();
                  setShowCart((prev) => !prev);
                }}
              />
              {cart.length > 0 && <IndicatorBadge>{cart.length}</IndicatorBadge>}
            </IndicatorWrapper>
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
        <ListingsBody>
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
                  <TextTooltip text={['Listing expired.']}>
                    <IconButton text='Add' onClick={() => addToCart(listing)} disabled />
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
        </ListingsBody>
      </Tab>
      <Cart
        isVisible={isVisible && showCart && !createOrderOpen}
        cart={cart}
        onClose={() => setShowCart(false)}
        onBuy={handleBuyCart}
        onClear={() => setCart([])}
        onRemove={removeFromCart}
        onOpenKami={openKamiModal}
        resolveKami={resolveKami}
        formatPrice={formatPrice}
      />
    </>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  width: 100%;
  min-height: 10vw;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 0.4vw;
  padding: 0.4vw;
  width: fit-content;
`;

const IndicatorWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const IndicatorBadge = styled.span`
  position: absolute;
  top: -0.3vw;
  right: -0.3vw;
  min-width: 1vw;
  height: 1vw;
  padding: 0 0.2vw;
  border-radius: 1vw;
  background: #d04a2f;
  color: white;
  font-size: 0.7vw;
  line-height: 1vw;
  text-align: center;
  border: 0.08vw solid white;
  z-index: 2;
`;
const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  min-height: 3vw;
`;

const ListingsBody = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
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
