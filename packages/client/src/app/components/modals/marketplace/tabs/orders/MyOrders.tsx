import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { useAccount, useSelected, useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { ClockIcon, InventoryIcon, ResetIcon, TradeIcon } from 'assets/images/icons/menu';
import { TriggerIcons } from 'assets/images/icons/triggers';
import placeholderKami from 'assets/images/kamis/placeholderKami.gif';
import { TokenIcons } from 'assets/images/tokens';
import { getKamidenClient, KamiMarketBidType, KamiMarketOrder } from 'clients/kamiden';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { formatExpiry, isExpired } from '../../helpers';

const KamidenClient = getKamidenClient();
const PAGE_SIZE = 35;

type OrderStatus = 'Active' | 'Cancelled' | 'Filled' | 'Expired';

const STATUS_FILTER_CYCLE = ['All', 'Active', 'Cancelled', 'Filled', 'Expired'] as const;
type StatusFilter = (typeof STATUS_FILTER_CYCLE)[number];

const StatusFilterIcons: Record<StatusFilter, string> = {
  All: TriggerIcons.eyeOpen,
  Active: TradeIcon,
  Cancelled: ResetIcon,
  Filled: InventoryIcon,
  Expired: ClockIcon,
};

const SORT_CYCLE = ['Price', 'Type'] as const;
type SortMethod = (typeof SORT_CYCLE)[number];

const SortIcons: Record<SortMethod, string> = {
  Price: ArrowIcons.up,
  Type: TradeIcon,
};

const STATUS_COLORS: Record<OrderStatus, { color: string; bg: string }> = {
  Active: { color: '#2E7D32', bg: '#E8F5E9' },
  Cancelled: { color: '#C62828', bg: '#FDECEC' },
  Filled: { color: '#1A4DB0', bg: '#E8F0FE' },
  Expired: { color: '#666', bg: '#ECECEC' },
};

export type MyOrder = {
  type: 'Listing' | 'Bid';
  orderId: string;
  price: string;
  kamiIndex: number;
  expiry: string;
  status: OrderStatus;
  bidType?: 'generic' | 'specific';
  total?: number;
  quantity?: number;
};

const parseOrder = (order: KamiMarketOrder): MyOrder | null => {
  if (order.Listing) {
    const expiry = order.Listing.Expiry;
    let status: OrderStatus = 'Active';
    if (order.IsCanceled) status = 'Cancelled';
    else if (order.IsComplete) status = 'Filled';
    else if (isExpired(expiry)) status = 'Expired';

    return {
      type: 'Listing',
      orderId: order.OrderID,
      price: order.Listing.Price,
      kamiIndex: order.Listing.KamiIndex,
      expiry,
      status,
    };
  }
  if (!order.Bid) return null;

  const expiry = order.Bid.Expiry;
  let status: OrderStatus = 'Active';
  if (order.IsCanceled) status = 'Cancelled';
  else if (order.IsComplete) status = 'Filled';
  else if (isExpired(expiry)) status = 'Expired';

  return {
    type: 'Bid',
    orderId: order.OrderID,
    price: order.Bid.Price,
    kamiIndex: order.Bid.KamiIndex,
    expiry,
    status,
    bidType:
      order.Bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC
        ? 'specific'
        : 'generic',
    total: order.Bid.Total,
    quantity: order.Bid.Quantity,
  };
};

const sortOrders = (orders: MyOrder[], sortBy: SortMethod) => {
  switch (sortBy) {
    case 'Price':
      return [...orders].sort((a, b) => {
        try {
          return Number(BigInt(b.price) - BigInt(a.price));
        } catch {
          return 0;
        }
      });
    case 'Type':
      return [...orders].sort((a, b) => a.type.localeCompare(b.type));
    default:
      return orders;
  }
};

export const MyOrders = ({
  isVisible,
  onCancelOrder,
  utils,
}: {
  isVisible: boolean;
  onCancelOrder: (orderID: string) => void;
  utils: {
    queryKamiByIndex: (index: number) => EntityIndex | undefined;
    getKami: (entity: EntityIndex) => Kami;
    normalizeAccountId: (accountId: string) => string;
    formatEthPrice: (weiString: string, decimals: number) => string;
  };
}) => {
  /////////////////
  // INSTANTIATIONS

  const isMarketplaceOpen = useVisibility((s) => s.modals.marketplace);

  const [sortBy, setSortBy] = useState<SortMethod>('Type');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [orders, setOrders] = useState<KamiMarketOrder[]>([]);
  const [page, setPage] = useState(0);

  const account = useAccount((s) => s.account);
  const kamiIndex = useSelected((s) => s.kamiIndex);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setModals = useVisibility((s) => s.setModals);

  const accountId = useMemo(() => utils.normalizeAccountId(account.id), [account.id]);

  // Reset on modal open
  useEffect(() => {
    if (!isMarketplaceOpen) return;
    setSortBy('Type');
    setStatusFilter('All');
    setPage(0);
  }, [isMarketplaceOpen]);

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;
    let isActive = true;

    const refresh = async () => {
      const res = await KamidenClient.getKamiMarketHistory({
        AccountId: accountId,
        Timestamp: 0,
        Size: 500,
      });
      if (!isActive) return;
      setOrders((res as { Orders?: KamiMarketOrder[] })?.Orders ?? []);
    };

    refresh();
    const intervalId = window.setInterval(refresh, 5000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isVisible, accountId]);

  /////////////////
  // PREPARATION

  const allOrders = useMemo<MyOrder[]>(() => {
    const mapped = orders.map(parseOrder).filter((o): o is MyOrder => o !== null);
    return sortOrders(mapped, sortBy);
  }, [orders, sortBy]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'All') return allOrders;
    return allOrders.filter((o) => o.status === statusFilter);
  }, [allOrders, statusFilter]);

  /////////////////
  // ACTIONS

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(sortBy);
    setSortBy(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  const cycleStatusFilter = () => {
    const idx = STATUS_FILTER_CYCLE.indexOf(statusFilter);
    setStatusFilter(STATUS_FILTER_CYCLE[(idx + 1) % STATUS_FILTER_CYCLE.length]);
  };

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const pagedOrders = filteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasPrevPage = page > 0;
  const hasNextPage = page < totalPages - 1;

  const goNextPage = () => { if (hasNextPage) setPage((p) => p + 1); };
  const goPrevPage = () => { if (hasPrevPage) setPage((p) => p - 1); };

  // Reset page when sort/filter changes
  useEffect(() => { setPage(0); }, [sortBy, statusFilter]);

  const formatPrice = (weiString: string) => utils.formatEthPrice(weiString, 6);

  const getBidProgress = (total: number, quantity: number) => {
    if (total <= 1) return '';
    return `${total - quantity}/${total}`;
  };

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

  /////////////////
  // DISPLAY

  return (
    <Tab isVisible={isVisible}>
      <ButtonWrapper>
        <ButtonGroup />
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
          <TextTooltip text={[`Filter: ${statusFilter}`]}>
            <IconButton
              img={StatusFilterIcons[statusFilter]}
              onClick={cycleStatusFilter}
              radius={0.6}
            />
          </TextTooltip>
          <TextTooltip text={[`Sort: ${sortBy}`]}>
            <IconButton img={SortIcons[sortBy]} onClick={cycleSort} radius={0.6} />
          </TextTooltip>
        </ButtonGroup>
      </ButtonWrapper>
      <HeaderRow>
        <Column flex={2}>
          <ColumnHeader>Kami</ColumnHeader>
        </Column>
        <Column>
          <ColumnHeader>Type</ColumnHeader>
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
          <ColumnHeader>Status</ColumnHeader>
        </Column>
        <Column>
          <ColumnHeader>Actions</ColumnHeader>
        </Column>
      </HeaderRow>
      <OrdersBody>
        {pagedOrders.length === 0 && (
          <EmptyCenter>
            <EmptyText text={['No orders found']} size={0.9} />
          </EmptyCenter>
        )}
        {pagedOrders.map((order) => (
          <OrderRow
            key={`${order.type}-${order.orderId}`}
            order={order}
            resolveKami={resolveKami}
            openKamiModal={openKamiModal}
            getBidProgress={getBidProgress}
            formatPrice={formatPrice}
            onCancelOrder={onCancelOrder}
          />
        ))}
      </OrdersBody>
    </Tab>
  );
};

const OrderRow = ({
  order,
  resolveKami,
  openKamiModal,
  getBidProgress,
  formatPrice,
  onCancelOrder,
}: {
  order: MyOrder;
  resolveKami: (index: number) => Kami | undefined;
  openKamiModal: (index: number) => void;
  getBidProgress: (total: number, quantity: number) => string;
  formatPrice: (weiString: string) => string;
  onCancelOrder: (orderID: string) => void;
}) => {
  const isGenericBid = order.type === 'Bid' && order.bidType === 'generic';
  const kami = isGenericBid ? undefined : resolveKami(order.kamiIndex);
  const progress =
    order.type === 'Bid' && order.total && order.quantity != null
      ? getBidProgress(order.total, order.quantity)
      : '';

  const typeLabel = order.type === 'Listing' ? 'Listing' : isGenericBid ? 'Gen. Bid' : 'Kami Bid';

  const statusColors = STATUS_COLORS[order.status];
  const isCancellable = order.status === 'Active' || order.status === 'Expired';

  return (
    <Row>
      <Column flex={2}>
        <KamiCell>
          <KamiThumbnail
            src={isGenericBid ? placeholderKami : kami?.image}
            alt={isGenericBid ? 'Any Kami' : (kami?.name ?? `Kami #${order.kamiIndex}`)}
            $clickable={!isGenericBid}
            onClick={isGenericBid ? undefined : () => openKamiModal(order.kamiIndex)}
          />
          <KamiInfo>
            <KamiName>
              {isGenericBid ? 'Any Kami' : (kami?.name ?? `Kami #${order.kamiIndex}`)}
            </KamiName>
            {progress && <ProgressText>{progress}</ProgressText>}
          </KamiInfo>
        </KamiCell>
      </Column>
      <Column>
        <TypeText $type={order.type}>{typeLabel}</TypeText>
      </Column>
      <Column>
        <CellText>{formatPrice(order.price)}</CellText>
      </Column>
      <Column>
        <CellText>{formatExpiry(order.expiry)}</CellText>
      </Column>
      <Column>
        <StatusPill $color={statusColors.color} $bg={statusColors.bg}>
          {order.status}
        </StatusPill>
      </Column>
      <Column>
        {isCancellable ? (
          <IconButton text='Cancel' onClick={() => onCancelOrder(order.orderId)} color='#FDECEC' />
        ) : (
          <CellText style={{ opacity: 0.4 }}>—</CellText>
        )}
      </Column>
    </Row>
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
  font-size: 0.8vw;
  font-weight: 600;
  min-width: 1.4vw;
  text-align: center;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  min-height: 3vw;
`;

const OrdersBody = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const EmptyCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
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

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4vw 0.6vw;
  font-size: 1.05vw;
  line-height: 1.2;
`;

const CellText = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95vw;
  line-height: 1.2;
  padding: 0.4vw 0.6vw;
`;

const TypeText = styled.span<{ $type: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85vw;
  font-weight: 600;
  line-height: 1.2;
  padding: 0.3vw 0.5vw;
  border-radius: 0.3vw;
  color: ${({ $type }) => ($type === 'Listing' ? '#C45A00' : '#1A4DB0')};
  background: ${({ $type }) => ($type === 'Listing' ? '#FFF3E0' : '#E8F0FE')};
`;

const StatusPill = styled.span<{ $color: string; $bg: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8vw;
  font-weight: 600;
  line-height: 1.2;
  padding: 0.25vw 0.45vw;
  border-radius: 0.3vw;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
`;

const KamiCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  padding: 0.4vw;
  width: 11vw;
`;

const KamiThumbnail = styled.img<{ $clickable: boolean }>`
  width: 3vw;
  height: 3vw;
  flex-shrink: 0;
  border-radius: 0.3vw;
  border: 0.1vw solid black;
  image-rendering: pixelated;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
`;

const KamiInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1vw;
  min-width: 0;
`;

const KamiName = styled.span`
  font-size: 0.9vw;
  white-space: nowrap;
`;

const ProgressText = styled.span`
  font-size: 0.7vw;
  color: #888;
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;
