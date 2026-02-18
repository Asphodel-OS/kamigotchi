import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton, IconListButton, TextTooltip } from 'app/components/library';
import { useAccount, useSelected, useVisibility } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';
import { getKamidenClient, KamiMarketBidType, KamiMarketOrder } from 'clients/kamiden';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { HistorySection } from './History';

const KamidenClient = getKamidenClient();
const SwapVertIconImage = SwapVertIcon as unknown as string;

export type MyOrder =
  | {
      type: 'Listing';
      orderId: string;
      price: string;
      kamiIndex: number;
    }
  | {
      type: 'Bid';
      orderId: string;
      price: string;
      total: number;
      quantity: number;
      bidType: string;
      kamiIndex: number;
    };

type MyOrderHistory = MyOrder & { state: 'Cancelled' | 'Completed' };

const parseOrder = (order: KamiMarketOrder): MyOrder | null => {
  if (order.Listing) {
    return {
      type: 'Listing',
      orderId: order.OrderID,
      price: order.Listing.Price,
      kamiIndex: order.Listing.KamiIndex,
    };
  }
  if (!order.Bid) return null;
  return {
    type: 'Bid',
    orderId: order.OrderID,
    price: order.Bid.Price,
    total: order.Bid.Total,
    quantity: order.Bid.Quantity,
    bidType: order.Bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC ? 'Kami' : '',
    kamiIndex: order.Bid.KamiIndex,
  };
};

const sortOrders = <T extends MyOrder>(orders: T[], sortBy: string) => {
  if (sortBy === 'Price') {
    return [...orders].sort((a, b) => {
      try {
        return Number(BigInt(b.price) - BigInt(a.price));
      } catch {
        return 0;
      }
    });
  }
  if (sortBy === 'Type') return [...orders].sort((a, b) => a.type.localeCompare(b.type));
  return orders;
};

export const MyOrders = ({
  isVisible,
  onCancelOrder,
  onOpenHistory,
  createOrderOpen,
  utils,
}: {
  isVisible: boolean;
  onCancelOrder: (orderID: string) => void;
  onOpenHistory: () => void;
  createOrderOpen: boolean;
  utils: {
    queryKamiByIndex: (index: number) => EntityIndex | undefined;
    getKami: (entity: EntityIndex) => Kami;
    normalizeAccountId: (accountId: string) => string;
    formatEthPrice: (weiString: string, decimals: number) => string;
  };
}) => {
  /////////////////
  // INSTANTIATIONS

  const [sortBy, setSortBy] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [orders, setOrders] = useState<KamiMarketOrder[]>([]);

  const account = useAccount((s) => s.account);
  const kamiIndex = useSelected((s) => s.kamiIndex);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setModals = useVisibility((s) => s.setModals);

  const accountId = useMemo(() => utils.normalizeAccountId(account.id), [account.id]);

  const sortOptions = [
    { text: 'Price', onClick: () => setSortBy('Price') },
    { text: 'Type', onClick: () => setSortBy('Type') },
  ];

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;
    let isActive = true;

    const refresh = async () => {
      const res = await KamidenClient.getKamiMarketHistory({
        AccountId: accountId,
        Timestamp: 0,
        Size: 200,
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

  useEffect(() => {
    if (createOrderOpen) setShowHistory(false);
  }, [createOrderOpen]);

  /////////////////
  // PREPARATION

  const currentOrders = useMemo<MyOrder[]>(() => {
    const active = orders.filter(
      (order) => !order.IsCanceled && !order.IsComplete
    );
    const mapped = active.map(parseOrder).filter((order): order is MyOrder => order !== null);
    return sortOrders(mapped, sortBy);
  }, [orders, sortBy]);

  const historyMapped = useMemo<MyOrderHistory[]>(() => {
    const history = orders.filter(
      (order) => order.IsCanceled || order.IsComplete
    );
    const mapped: MyOrderHistory[] = history
      .map((order) => {
        const base = parseOrder(order);
        if (!base) return null;
        return {
          ...base,
          state: order.IsCanceled ? 'Cancelled' : 'Completed',
        };
      })
      .filter((order): order is MyOrderHistory => order !== null);
    return sortOrders(mapped, sortBy);
  }, [orders, sortBy]);

  const myOrders = currentOrders;

  /////////////////
  // ACTIONS

  const formatPrice = (weiString: string) => utils.formatEthPrice(weiString, 3);

  const getBidProgress = (total: number, quantity: number) => {
    if (quantity <= 0) return '';
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
        <IconListButton
          img={SwapVertIconImage}
          text={sortBy}
          options={sortOptions}
          radius={0.6}
          tooltip={{ text: ['Sorting'] }}
        />
        <IconButton
          text='History'
          onClick={() => {
            onOpenHistory();
            setShowHistory(true);
          }}
        />
      </ButtonWrapper>
      <OrdersBody>
        <Row>
          <Column>
            <ColumnHeader>Type</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>Offers</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>
              <EthIcon src={TokenIcons.eth} alt='ETH' />
            </ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>Actions</ColumnHeader>
          </Column>
        </Row>
        {myOrders.length === 0 && <EmptyText text={['No active orders']} size={0.9} />}
        {myOrders.map((order) => (
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
      <HistorySection
        isVisible={showHistory && !createOrderOpen}
        onClose={() => setShowHistory(false)}
        orders={historyMapped}
        formatPrice={formatPrice}
        getBidProgress={getBidProgress}
        openKamiModal={openKamiModal}
        resolveKami={resolveKami}
      />
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
  const kami = resolveKami(order.kamiIndex);

  return (
    <Row>
      <Column>
        <CellText>{order.type}</CellText>
      </Column>
      <Column>
        {order.type === 'Listing' ? (
          <OrderKami>
            {kami && (
              <OrderKamiImage
                src={kami.image}
                alt={kami.name ?? `Kami #${order.kamiIndex}`}
                onClick={() => openKamiModal(order.kamiIndex)}
              />
            )}
          </OrderKami>
        ) : getBidProgress(order.total, order.quantity) ? (
          <TextTooltip
            text={[
              `${order.total - order.quantity}/${order.total} kami in this bid have already been purchased.`,
            ]}
          >
            <CellText>
              {order.bidType === 'Kami' ? `Kami #${order.kamiIndex} ` : ''}
              {getBidProgress(order.total, order.quantity)}
            </CellText>
          </TextTooltip>
        ) : (
          <CellText>{order.bidType === 'Kami' ? `Kami #${order.kamiIndex}` : ''}</CellText>
        )}
      </Column>
      <Column>
        <CellText>{formatPrice(order.price)}</CellText>
      </Column>
      <Column>
        <IconButton text='Cancel' onClick={() => onCancelOrder(order.orderId)} />
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

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  min-height: 3vw;
`;

const Column = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
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

const OrderKami = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OrderKamiImage = styled.img`
  width: 2.6vw;
  height: 2.6vw;
  border-radius: 0.3vw;
  border: 0.1vw solid black;
  image-rendering: pixelated;
  cursor: pointer;
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 0.4vw;
  padding: 0.4vw;
  width: fit-content;
`;

const OrdersBody = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
`;
