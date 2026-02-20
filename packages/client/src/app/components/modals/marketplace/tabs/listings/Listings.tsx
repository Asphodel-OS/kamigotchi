import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { ClockIcon, ResetIcon } from 'assets/images/icons/menu';
import { TriggerIcons } from 'assets/images/icons/triggers';
import { getKamidenClient, KamiMarketListing } from 'clients/kamiden';
import { TokenIcons } from 'assets/images/tokens';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { Cart } from './Cart';
import { ListingCard } from './ListingCard';

const KamidenClient = getKamidenClient();

const SORT_CYCLE = ['Latest', 'Price Low', 'Price High'] as const;
type SortMethod = (typeof SORT_CYCLE)[number];

const SortIcons: Record<SortMethod, string> = {
  'Latest': ClockIcon,
  'Price Low': ArrowIcons.up,
  'Price High': ArrowIcons.down,
};

const VIEW_CYCLE = ['grid', 'list'] as const;
type ViewMode = (typeof VIEW_CYCLE)[number];
const ViewIcons: Record<ViewMode, string> = {
  grid: TriggerIcons.eyeOpen,
  list: TriggerIcons.eyeHalf,
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
  onCloseFilter,
  onCloseCreateOrder,
  createOrderOpen,
  accountId,
  filters,
  utils,
}: {
  isVisible: boolean;
  onOpenFilter: () => void;
  onBuyListings: (listingIDs: string[], kamiIndices: number[], totalPrice: bigint) => void;
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
    getAccountByID: (id: string) => { name: string; index: number };
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
  const [sortBy, setSortBy] = useState<SortMethod>('Price Low');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<KamiMarketListing[]>([]);
  const [allFlipped, setAllFlipped] = useState(false);
  const [sweepActive, setSweepActive] = useState(false);
  const [sweepCount, setSweepCount] = useState(0);

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;

    let isActive = true;
    const refreshListings = async () => {
      const res = await KamidenClient.getKamiMarketListings({});
      if (!isActive) return;
      const all = res.Listings ?? [];
      const now = Math.floor(Date.now() / 1000);
      const filtered = all.filter(
        (listing) =>
          utils.isDifferentAccountId(listing.SellerAccountID, accountId) &&
          (!Number(listing.Expiry) || Number(listing.Expiry) > now)
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

  const formatPrice = (weiString: string) => utils.formatEthPrice(weiString, 5);

  useEffect(() => {
    if (createOrderOpen) {
      setShowCart(false);
      setSweepActive(false);
      setSweepCount(0);
    }
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
        const getter = viewMode === 'grid' ? utils.getKamiDetailed : utils.getKami;
        const kami = entity !== undefined ? getter(entity) : undefined;
        return { listing, kami, entity };
      }),
    [listings, utils, viewMode]
  );

  const hasActiveFilters = useMemo(() => {
    const traitActive = Object.values(filters.selected).some((set) => set.size > 0);
    const statActive = Object.entries(filters.stats).some(([key, value]) =>
      key === 'Slots' ? value > 0 : value > 10
    );
    return traitActive || statActive;
  }, [filters.selected, filters.stats]);

  const activeFilterCount = useMemo(() => {
    const traitCount = Object.values(filters.selected).reduce(
      (sum, set) => sum + (set.size > 0 ? 1 : 0),
      0
    );
    const statCount = Object.entries(filters.stats).reduce(
      (sum, [key, value]) => sum + (key === 'Slots' ? (value > 0 ? 1 : 0) : value > 10 ? 1 : 0),
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
        const base = key === 'Slots' ? 0 : 10;
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

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(sortBy);
    setSortBy(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  const cycleView = () => {
    const idx = VIEW_CYCLE.indexOf(viewMode);
    setViewMode(VIEW_CYCLE[(idx + 1) % VIEW_CYCLE.length]);
  };

  /////////////////
  // SWEEP

  const toggleSweep = () => {
    const next = !sweepActive;
    setSweepActive(next);
    if (next) {
      setShowCart(true);
      onCloseCreateOrder();
      onCloseFilter();
    } else {
      setSweepCount(0);
      setShowCart(false);
    }
  };

  useEffect(() => {
    if (!sweepActive) return;
    const priceAsc = [...filteredListings]
      .filter(({ listing }) => {
        const expiry = Number(listing.Expiry);
        if (!expiry) return true;
        return expiry > Math.floor(Date.now() / 1000);
      })
      .sort((a, b) => Number(BigInt(a.listing.Price) - BigInt(b.listing.Price)));
    const swept = priceAsc.slice(0, sweepCount).map(({ listing }) => listing);
    setCart(swept);
  }, [sweepActive, sweepCount, filteredListings]);

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
    if (sweepActive) setSweepActive(false);
    setCart((prev) => [...prev, listing]);
    setShowCart(true);
  };

  const removeFromCart = (orderId: string) => {
    if (sweepActive) setSweepActive(false);
    setCart((prev) => {
      const next = prev.filter((item) => item.OrderID !== orderId);
      if (next.length === 0) setShowCart(false);
      return next;
    });
  };

  const handleBuyCart = () => {
    if (cart.length === 0) return;
    const totalPrice = cart.reduce((sum, item) => sum + BigInt(item.Price), 0n);
    onBuyListings(
      cart.map((item) => item.OrderID),
      cart.map((item) => item.KamiIndex),
      totalPrice
    );
    setCart([]);
    setShowCart(false);
  };

  /////////////////
  // DISPLAY

  return (
    <>
      <Tab isVisible={isVisible}>
        <ButtonRow>
          <ButtonGroup>
            <TextTooltip text={['Cart.']}>
              <IndicatorWrapper>
                <IconButton
                  img={ShoppingCartIcon}
                  text='Cart'
                  onClick={() => {
                    onCloseCreateOrder();
                    onCloseFilter();
                    setShowCart((prev) => !prev);
                  }}
                />
                {cart.length > 0 && <IndicatorBadge>{cart.length}</IndicatorBadge>}
              </IndicatorWrapper>
            </TextTooltip>
            {viewMode === 'grid' && (
              <IconButton
                img={ResetIcon}
                onClick={() => setAllFlipped((prev) => !prev)}
                radius={0.6}
              />
            )}
          </ButtonGroup>
          <ButtonGroup>
            <SweepControl>
              <IconButton
                text='Sweep!'
                onClick={toggleSweep}
                radius={0.6}
                color={sweepActive ? '#d4edda' : undefined}
              />
              <SweepSliderWrap $active={sweepActive}>
                <SweepRange
                  type='range'
                  min={0}
                  max={30}
                  value={sweepCount}
                  onChange={(e) => setSweepCount(Number(e.target.value))}
                />
                <SweepLabel>{sweepCount}</SweepLabel>
              </SweepSliderWrap>
            </SweepControl>
            <TextTooltip text={[`View: ${viewMode === 'list' ? 'List' : 'Grid'}.`]}>
              <IconButton
                img={ViewIcons[viewMode]}
                onClick={cycleView}
                radius={0.6}
              />
            </TextTooltip>
            <TextTooltip text={[`Sort: ${sortBy}.`]}>
              <IconButton
                img={SortIcons[sortBy]}
                onClick={cycleSort}
                radius={0.6}
              />
            </TextTooltip>
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
          </ButtonGroup>
        </ButtonRow>
        {viewMode === 'list' && (
          <HeaderRow>
            <Column flex={2}>
              <ColumnHeader align='left'>Kami</ColumnHeader>
            </Column>
            <Column>
              <ColumnHeader>Seller</ColumnHeader>
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
        )}
        {viewMode === 'list' ? (
          <ListingsBody>
            {sorted.length === 0 && (
              <EmptyCenter>
                <EmptyText text={['No listings found']} size={0.9} />
              </EmptyCenter>
            )}
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
                  <CellText>{utils.getAccountByID(listing.SellerAccountID).name || 'Unknown'}</CellText>
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
                  ) : isInCart(listing.OrderID) ? (
                    <IconButton
                      text='Remove'
                      onClick={() => removeFromCart(listing.OrderID)}
                      color='#FDECEC'
                    />
                  ) : (
                    <IconButton
                      text='Add'
                      onClick={() => addToCart(listing)}
                      color='#E8F5E9'
                    />
                  )}
                </Column>
              </Row>
            ))}
          </ListingsBody>
        ) : (
          <ListingsGrid>
            {sorted.length === 0 && (
              <EmptyCenter>
                <EmptyText text={['No listings found']} size={0.9} />
              </EmptyCenter>
            )}
            {sorted.map(({ listing, kami }) => (
              <ListingCard
                key={listing.OrderID}
                listing={listing}
                kami={kami}
                isInCart={isInCart(listing.OrderID)}
                isExpired={isListingExpired(listing.Expiry)}
                formatPrice={formatPrice}
                onAddToCart={() => addToCart(listing)}
                onRemoveFromCart={() => removeFromCart(listing.OrderID)}
                onOpenKami={() => openKamiModal(listing.KamiIndex)}
                getAccountByID={utils.getAccountByID}
                allFlipped={allFlipped}
              />
            ))}
          </ListingsGrid>
        )}
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

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4vw;
  padding: 0.4vw;
  width: 100%;
  border-bottom: solid #ccc 0.1vw;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.4vw;
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

const EmptyCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
  grid-column: 1 / -1;
`;

const ListingsBody = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const ListingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11vw, 1fr));
  align-content: start;
  gap: 0.6vw;
  padding: 0.4vw;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  flex-shrink: 0;
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

const SweepControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const SweepSliderWrap = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.2vw;
  max-width: ${({ $active }) => ($active ? '14vw' : '0')};
  overflow: hidden;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: max-width 0.3s ease, opacity 0.2s ease;
`;

const SweepRange = styled.input`
  width: 10.5vw;
  height: 0.3vw;
  cursor: pointer;
  accent-color: #333;
`;

const SweepLabel = styled.span`
  font-size: 0.75vw;
  min-width: 1.2vw;
  text-align: center;
  white-space: nowrap;
`;
