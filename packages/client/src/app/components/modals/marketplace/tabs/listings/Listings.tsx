import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { ClockIcon, ResetIcon } from 'assets/images/icons/menu';
import { TriggerIcons } from 'assets/images/icons/triggers';
import { getKamidenClient, KamiMarketListing } from 'clients/kamiden';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { formatExpiry, isExpired } from '../../helpers';
import { Cart } from './Cart';
import { ListingCard } from './ListingCard';
import { ListingsListView } from './ListingsListView';

const KamidenClient = getKamidenClient();
const PAGE_SIZE = 35;

const SORT_CYCLE = ['Latest', 'Price Low', 'Price High'] as const;
type SortMethod = (typeof SORT_CYCLE)[number];

const SortIcons: Record<SortMethod, string> = {
  Latest: ClockIcon,
  'Price Low': ArrowIcons.up,
  'Price High': ArrowIcons.down,
};

const VIEW_CYCLE = ['grid', 'list'] as const;
type ViewMode = (typeof VIEW_CYCLE)[number];
const ViewIcons: Record<ViewMode, string> = {
  grid: TriggerIcons.eyeOpen,
  list: TriggerIcons.eyeHalf,
};

export const Listings = ({
  isVisible,
  onOpenFilter,
  onBuyListings,
  onCancelListing,
  onCloseFilter,
  onCloseCreateOrder,
  createOrderOpen,
  accountId,
  filters,
  utils,
}: {
  isVisible: boolean;
  onOpenFilter: () => void;
  onBuyListings: (listingIDs: string[], kamiIndices: number[], totalPrice: bigint) => Promise<boolean>;
  onCancelListing: (orderID: string) => void;
  onCloseFilter: () => void;
  onCloseCreateOrder: () => void;
  createOrderOpen: boolean;
  accountId: string;
  filters: {
    selected: Record<string, Set<string>>;
    stats: Record<string, number>;
    affinity: { body: string | null; hand: string | null };
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
  const isMarketplaceOpen = useVisibility((s) => s.modals.marketplace);
  const setModals = useVisibility((s) => s.setModals);

  const [listings, setListings] = useState<KamiMarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortMethod>('Price Low');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<KamiMarketListing[]>([]);
  const [allFlipped, setAllFlipped] = useState(false);
  const [sweepActive, setSweepActive] = useState(false);
  const [sweepCount, setSweepCount] = useState(0);
  const [page, setPage] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [recentlyBoughtListings, setRecentlyBoughtListings] = useState<Set<string>>(new Set());

  // Reset on modal open
  useEffect(() => {
    if (!isMarketplaceOpen) return;
    setSortBy('Price Low');
    setShowCart(false);
    setCart([]);
    setSweepActive(false);
    setSweepCount(0);
    setAllFlipped(false);
    setPage(0);
    setRecentlyBoughtListings(new Set());
  }, [isMarketplaceOpen]);

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;

    let isActive = true;
    const refreshListings = async () => {
      const res = await KamidenClient.getKamiMarketListings({ Size: 500 });
      if (!isActive) return;
      setListings(res.Listings ?? []);
      setLoading(false);
    };

    refreshListings();
    const intervalId = window.setInterval(refreshListings, 10000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isVisible, accountId]);

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

  const formatPrice = (weiString: string) => utils.formatEthPrice(weiString, 6);

  const resolvedListings = useMemo(
    () =>
      listings
        .filter((listing) => !recentlyBoughtListings.has(listing.OrderID))
        .filter((listing) => !isExpired(listing.Expiry))
        .map((listing) => {
          const entity = utils.queryKamiByIndex(listing.KamiIndex);
          const getter = viewMode === 'grid' ? utils.getKamiDetailed : utils.getKami;
          const kami = entity !== undefined ? getter(entity) : undefined;
          return { listing, kami, entity };
        }),
    [listings, utils, viewMode, recentlyBoughtListings]
  );

  const hasActiveFilters = useMemo(() => {
    const traitActive = Object.values(filters.selected).some((set) => set.size > 0);
    const statActive = Object.entries(filters.stats).some(([key, value]) =>
      key === 'Slots' ? value > 0 : value > 10
    );
    const affinityActive = filters.affinity.body !== null || filters.affinity.hand !== null;
    return traitActive || statActive || affinityActive;
  }, [filters.selected, filters.stats, filters.affinity]);

  const activeFilterCount = useMemo(() => {
    const traitCount = Object.values(filters.selected).reduce(
      (sum, set) => sum + (set.size > 0 ? 1 : 0),
      0
    );
    const statCount = Object.entries(filters.stats).reduce(
      (sum, [key, value]) => sum + (key === 'Slots' ? (value > 0 ? 1 : 0) : value > 10 ? 1 : 0),
      0
    );
    const affinityCount = (filters.affinity.body !== null ? 1 : 0) + (filters.affinity.hand !== null ? 1 : 0);
    return traitCount + statCount + affinityCount;
  }, [filters.selected, filters.stats, filters.affinity]);

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
      if (!traitMatches('Body', traits.body?.name)) return false;
      if (!traitMatches('Color', traits.color?.name)) return false;
      if (!traitMatches('Background', traits.background?.name)) return false;

      if (filters.affinity.body && traits.body?.affinity !== filters.affinity.body) return false;
      if (filters.affinity.hand && traits.hand?.affinity !== filters.affinity.hand) return false;

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
  }, [resolvedListings, hasActiveFilters, filters.selected, filters.stats, filters.affinity, utils]);

  const sorted = useMemo(() => {
    const copy = [...filteredListings];
    switch (sortBy) {
      case 'Price Low':
        return copy.sort((a, b) => Number(BigInt(a.listing.Price) - BigInt(b.listing.Price)));
      case 'Price High':
        return copy.sort((a, b) => Number(BigInt(b.listing.Price) - BigInt(a.listing.Price)));
      default:
        return copy.sort((a, b) => b.listing.Timestamp - a.listing.Timestamp); // by latest
    }
  }, [filteredListings, sortBy]);

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(sortBy);
    setSortBy(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  const cycleView = () => {
    const idx = VIEW_CYCLE.indexOf(viewMode);
    setViewMode(VIEW_CYCLE[(idx + 1) % VIEW_CYCLE.length]);
  };

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasPrevPage = page > 0;
  const hasNextPage = page < totalPages - 1;

  const goNextPage = () => { if (hasNextPage) setPage((p) => p + 1); };
  const goPrevPage = () => { if (hasPrevPage) setPage((p) => p - 1); };

  // Scroll grid to top on page change
  useEffect(() => { gridRef.current?.scrollTo(0, 0); }, [page]);

  // Reset page when sort/filter changes
  useEffect(() => { setPage(0); }, [sortBy, filters.selected, filters.stats, filters.affinity]);

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
        if (isOwnListing(listing)) return false;
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

  const isListingExpired = isExpired;

  const isOwnListing = (listing: KamiMarketListing) =>
    !utils.isDifferentAccountId(listing.SellerAccountID, accountId);

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
    if (isInCart(listing.OrderID) || isOwnListing(listing)) return;
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

  const handleBuyCart = async () => {
    if (cart.length === 0) return;
    const totalPrice = cart.reduce((sum, item) => sum + BigInt(item.Price), 0n);
    const boughtIds = cart.map((item) => item.OrderID);
    const success = await onBuyListings(boughtIds, cart.map((item) => item.KamiIndex), totalPrice);
    if (success) {
      setRecentlyBoughtListings((prev) => {
        const next = new Set(prev);
        boughtIds.forEach((id) => next.add(id));
        return next;
      });
    }
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
            <TextTooltip text={['Cart']}>
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
            <TextTooltip text={[`View: ${viewMode === 'list' ? 'List' : 'Grid'}`]}>
              <IconButton img={ViewIcons[viewMode]} onClick={cycleView} radius={0.6} />
            </TextTooltip>
            {viewMode === 'grid' && (
              <IconButton
                img={ResetIcon}
                onClick={() => setAllFlipped((prev) => !prev)}
                radius={0.6}
              />
            )}
          </ButtonGroup>
          <PageNav>
            <IconButton
              img={ArrowIcons.left}
              onClick={goPrevPage}
              disabled={!hasPrevPage}
              radius={0.6}
            />
            <PageLabel>{page + 1}</PageLabel>
            <IconButton
              img={ArrowIcons.right}
              onClick={goNextPage}
              disabled={!hasNextPage}
              radius={0.6}
            />
          </PageNav>
          <ButtonGroup>
            <SweepControl>
              <TextTooltip text={['Auto-fill your cart with the', 'cheapest listings available']}>
                <IconButton
                  text='Sweep!'
                  onClick={toggleSweep}
                  radius={0.6}
                  color={sweepActive ? '#d4edda' : undefined}
                />
              </TextTooltip>
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
            <TextTooltip text={['Filters']}>
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
            <TextTooltip text={[`Sort: ${sortBy}`]}>
              <IconButton img={SortIcons[sortBy]} onClick={cycleSort} radius={0.6} />
            </TextTooltip>
          </ButtonGroup>
        </ButtonRow>
        {viewMode === 'list' ? (
          <ListingsListView
            listings={paged}
            formatPrice={formatPrice}
            formatExpiry={formatExpiry}
            isOwnListing={isOwnListing}
            isListingExpired={isListingExpired}
            isInCart={isInCart}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onCancelListing={onCancelListing}
            onOpenKami={openKamiModal}
            getAccountByID={utils.getAccountByID}
            loading={loading}
          />
        ) : (
          <ListingsGrid ref={gridRef}>
            {loading && (
              <EmptyCenter>
                <EmptyText text={['Loading listings...']} size={0.9} />
              </EmptyCenter>
            )}
            {paged.length === 0 && !loading && (
              <EmptyCenter>
                <EmptyText text={['No listings found']} size={0.9} />
              </EmptyCenter>
            )}
            {paged.map(({ listing, kami }) => (
              <ListingCard
                key={listing.OrderID}
                listing={listing}
                kami={kami}
                isInCart={isInCart(listing.OrderID)}
                isExpired={isListingExpired(listing.Expiry)}
                isOwn={isOwnListing(listing)}
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
        sweepActive={sweepActive}
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
  position: relative;
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

const PageNav = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const PageLabel = styled.span`
  font-size: 1vw;
  font-weight: 800;
  min-width: 1.4vw;
  text-align: center;
  margin: 0 0.4vw;
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
const EmptyCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
  grid-column: 1 / -1;
`;

const ListingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.8vw, 1fr));
  align-content: start;
  gap: 0.5vw;
  padding: 0.4vw;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
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
  transition:
    max-width 0.3s ease,
    opacity 0.2s ease;
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
