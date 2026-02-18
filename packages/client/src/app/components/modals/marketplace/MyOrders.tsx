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
import { useAccount } from 'app/stores';

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
      quantity: number;
      bidType: string;
      kamiIndex: number;
    };

export const MyOrders = ({
  isVisible,
  onCancelOrder,
}: {
  isVisible: boolean;
  onCancelOrder: (orderID: string) => void;
}) => {
  const [sortBy, setSortBy] = useState<string>('');
  const [listings, setListings] = useState<KamiMarketListing[]>([]);
  const [bids, setBids] = useState<KamiMarketBid[]>([]);
  const account = useAccount((s) => s.account);

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
        quantity: bid.Quantity,
        bidType:
          bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC ? 'Kami' : 'Collection',
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
            <CellText>
              {order.type === 'Listing'
                ? `Kami #${order.kamiIndex}`
                : `${order.bidType}${order.bidType === 'Kami' ? ` #${order.kamiIndex}` : ''} x${
                    order.quantity
                  }`}
            </CellText>
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
`;

const Column = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex: 1;
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8vw;
  font-size: 1.1vw;
`;

const CellText = styled.span`
  font-size: 0.9vw;
  padding: 0.4vw;
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
