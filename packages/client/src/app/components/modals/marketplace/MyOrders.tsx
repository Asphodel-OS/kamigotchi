import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { EmptyText, IconButton, IconListButton, TextTooltip } from 'app/components/library';
import { TokenIcons } from 'assets/images/tokens';
import {
  getKamidenClient,
  KamiMarketBid,
  KamiMarketBidType,
  KamiMarketListing,
} from 'clients/kamiden';
import { useAccount, useSelected, useVisibility } from 'app/stores';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

const KamidenClient = getKamidenClient();

type MyOrder =
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
  };
}) => {
  const [sortBy, setSortBy] = useState<string>('');
  const [listings, setListings] = useState<KamiMarketListing[]>([]);
  const [bids, setBids] = useState<KamiMarketBid[]>([]);
  const account = useAccount((s) => s.account);
  const kamiIndex = useSelected((s) => s.kamiIndex);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setModals = useVisibility((s) => s.setModals);

  const sortOptions = [
    { text: 'Price', onClick: () => setSortBy('Price') },
    { text: 'Type', onClick: () => setSortBy('Type') },
  ];

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;
    KamidenClient.getKamiMarketListings({}).then((res) => setListings(res.Listings ?? []));
    KamidenClient.getKamiMarketBids({}).then((res) => setBids(res.Bids ?? []));
  }, [isVisible]);

  const accountId = useMemo(() => {
    try {
      return BigInt(account.id).toString();
    } catch {
      return account.id;
    }
  }, [account.id]);

  const myOrders = useMemo<MyOrder[]>(() => {
    const ownListings = listings
      .filter((listing) => {
        try {
          return BigInt(listing.SellerAccountID).toString() === accountId;
        } catch {
          return listing.SellerAccountID === accountId;
        }
      })
      .map((listing) => ({
        type: 'Listing' as const,
        orderId: listing.OrderID,
        price: listing.Price,
        kamiIndex: listing.KamiIndex,
      }));

    const ownBids = bids
      .filter((bid) => {
        try {
          return BigInt(bid.BuyerAccountID).toString() === accountId;
        } catch {
          return bid.BuyerAccountID === accountId;
        }
      })
      .map((bid) => ({
        type: 'Bid' as const,
        orderId: bid.OrderID,
        price: bid.Price,
        total: bid.Total,
        quantity: bid.Quantity,
        bidType: bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC ? 'Kami' : '',
        kamiIndex: bid.KamiIndex,
      }));

    const combined = [...ownListings, ...ownBids];
    if (sortBy === 'Price') {
      return combined.sort((a, b) => Number(BigInt(b.price) - BigInt(a.price)));
    }
    if (sortBy === 'Type') {
      return combined.sort((a, b) => a.type.localeCompare(b.type));
    }
    return combined;
  }, [listings, bids, accountId, sortBy]);

  const formatPrice = (weiString: string) => {
    if (!weiString || weiString === '0') return '0';
    const num = Number(formatUnits(BigInt(weiString), 18));
    if (num < 0.001) return '<0.001';
    return num.toFixed(3);
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

  return (
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
      </ButtonWrapper>
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
        <Row key={`${order.type}-${order.orderId}`}>
          <Column>
            <CellText>{order.type}</CellText>
          </Column>
          <Column>
            {order.type === 'Listing' ? (
              <OrderKami>
                {resolveKami(order.kamiIndex) && (
                  <OrderKamiImage
                    src={resolveKami(order.kamiIndex)?.image}
                    alt={resolveKami(order.kamiIndex)?.name ?? `Kami #${order.kamiIndex}`}
                    onClick={() => openKamiModal(order.kamiIndex)}
                  />
                )}
              </OrderKami>
            ) : (
              <TextTooltip
                text={[
                  `${order.total}/${order.quantity} kami in this bid have already been purchased.`,
                ]}
              >
                <CellText>
                  {order.bidType === 'Kami' ? `Kami #${order.kamiIndex} ` : ''}
                  {order.total}/{order.quantity}
                </CellText>
              </TextTooltip>
            )}
          </Column>
          <Column>
            <CellText>{formatPrice(order.price)}</CellText>
          </Column>
          <Column>
            <IconButton text='Cancel' onClick={() => onCancelOrder(order.orderId)} />
          </Column>
        </Row>
      ))}
    </Tab>
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
