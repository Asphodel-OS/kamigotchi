import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { EmptyText, IconButton } from 'app/components/library';
import { TokenIcons } from 'assets/images/tokens';
import { getKamidenClient, KamiMarketBid, KamiMarketBidType } from 'clients/kamiden';
import { Kami } from 'network/shapes/Kami';

const KamidenClient = getKamidenClient();

export const Bids = ({
  isVisible,
  showCreateOrder,
  setShowFilter,
  onCloseCreateOrder,
  utils,
}: {
  isVisible: boolean;
  showCreateOrder: boolean;
  setShowFilter: Dispatch<SetStateAction<boolean>>;
  onCloseCreateOrder: () => void;
  utils: {
    getAccountKamis: () => Kami[];
    getExternalKamis: () => Kami[];
  };
}) => {
  const formatPrice = (weiString: string) => {
    if (!weiString || weiString === '0') return '0';
    const num = Number(formatUnits(BigInt(weiString), 18));
    if (num < 0.001) return '<0.001';
    return num.toFixed(4);
  };

  const getBidLabel = (bid: KamiMarketBid) =>
    bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC
      ? `Kami #${bid.KamiIndex}`
      : 'Collection';
  const [selectedKamis, setSelectedKamis] = useState<Set<number>>(new Set());
  const [showSelectKami, setShowSelectKami] = useState(false);
  const [bids, setBids] = useState<KamiMarketBid[]>([]);

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;
    KamidenClient.getKamiMarketBids({}).then((res) => setBids(res.Bids ?? []));
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) setShowFilter(false);
  }, [isVisible]);

  useEffect(() => {
    if (showCreateOrder) setShowSelectKami(false);
  }, [showCreateOrder]);

  const restingKamis = useMemo(() => utils.getExternalKamis(), [utils]);
  const isTabVisible = isVisible;
  const showBottomSection = isVisible && !showCreateOrder && showSelectKami;

  const toggleKami = (index: number) => {
    setSelectedKamis((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleOpenSell = () => {
    onCloseCreateOrder();
    setShowSelectKami(true);
  };

  const handleCloseSelect = () => setShowSelectKami(false);

  const handleSell = () => {};
  const handleClear = () => {
    setSelectedKamis(new Set());
    setShowSelectKami(false);
  };

  return (
    <>
      <Tab isVisible={isTabVisible}>
        <ButtonWrapper>
          <IconButton text='Sell' onClick={handleOpenSell} />
        </ButtonWrapper>
        <HeaderRow>
          <Column>
            <ColumnHeader>Offer</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>
              <EthIcon src={TokenIcons.eth} alt='ETH' /> /Kami
            </ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>Total</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>Qty</ColumnHeader>
          </Column>
        </HeaderRow>
        {bids.length === 0 && <EmptyText text={['No bids found']} size={0.9} />}
        {bids.map((bid) => (
          <DataRow key={bid.OrderID}>
            <Column>
              <CellText>{getBidLabel(bid)}</CellText>
            </Column>
            <Column>
              <CellText>{formatPrice(bid.Price)}</CellText>
            </Column>
            <Column>
              <CellText>{bid.Total}</CellText>
            </Column>
            <Column>
              <CellText>{bid.Quantity}</CellText>
            </Column>
          </DataRow>
        ))}
      </Tab>
      <BottomSection isVisible={showBottomSection}>
        <Header>
          <HeaderTitle>Select Your Kami</HeaderTitle>
          <IconButton text='X' onClick={handleCloseSelect} scale={1.5} />
        </Header>
        <KamiGrid>
          {restingKamis.length === 0 && (
            <EmptyText text={[`You don't have out of world Kami`]} size={0.9} />
          )}
          {restingKamis.map((kami) => (
            <KamiSlot key={kami.index} onClick={() => toggleKami(kami.index)}>
              <KamiImage src={kami.image} alt={kami.name} />
              <Checkbox
                type='checkbox'
                checked={selectedKamis.has(kami.index)}
                onChange={() => toggleKami(kami.index)}
                onClick={(e) => e.stopPropagation()}
              />
            </KamiSlot>
          ))}
        </KamiGrid>
        <Actions>
          <IconButton text='Sell' onClick={handleSell} disabled={selectedKamis.size === 0} />
          <IconButton text='Clear' onClick={handleClear} />
        </Actions>
      </BottomSection>
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
  width: fit-content;
  padding: 0.4vw;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  border-bottom: 0.15vw solid black;
`;

const DataRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  border-bottom: 0.06vw solid #ccc;

  &:hover {
    background-color: #eee;
  }
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
  gap: 0.2vw;
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

const BottomSection = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 50%;
  overflow: auto;
  border-top: 0.15vw solid black;
  width: 100%;
`;

const Header = styled.div`
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

const KamiGrid = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;

  gap: 0.4vw;
  padding: 0.6vw;
`;

const KamiSlot = styled.div`
  position: relative;
  width: 5vw;
  height: 5vw;
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const KamiImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.3vw;
`;

const Checkbox = styled.input`
  position: absolute;
  top: 0.1vw;
  right: 0.1vw;
  width: 0.9vw;
  height: 0.9vw;
  cursor: pointer;
  accent-color: rgb(203, 186, 61);
`;

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  gap: 0.6vw;
  padding: 0.6vw;
  margin-top: auto;
`;
