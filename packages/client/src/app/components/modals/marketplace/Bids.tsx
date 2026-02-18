import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import FilterListIcon from '@mui/icons-material/FilterList';
import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { TokenIcons } from 'assets/images/tokens';
import { getKamidenClient, KamiMarketBid, KamiMarketBidType } from 'clients/kamiden';
import { Kami } from 'network/shapes/Kami';

const KamidenClient = getKamidenClient();

export const Bids = ({
  isVisible,
  showCreateOrder,
  setShowFilter,
  onCloseCreateOrder,
  onAcceptOffer,
  accountId,
  utils,
}: {
  isVisible: boolean;
  showCreateOrder: boolean;
  setShowFilter: Dispatch<SetStateAction<boolean>>;
  onCloseCreateOrder: () => void;
  onAcceptOffer: (offerID: string, kamiIndex: number) => void;
  accountId: string;
  utils: {
    getAccountKamis: () => Kami[];
    getExternalKamis: () => Kami[];
  };
}) => {
  const [selectedKamis, setSelectedKamis] = useState<Set<number>>(new Set());
  const [showSelectKami, setShowSelectKami] = useState(false);
  const [bids, setBids] = useState<KamiMarketBid[]>([]);
  const [selectedBid, setSelectedBid] = useState<KamiMarketBid | null>(null);
  const [filterBy, setFilterBy] = useState('Show all');
  const [showFilterSection, setShowFilterSection] = useState(false);

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;
    KamidenClient.getKamiMarketBids({}).then((res) => {
      const all = res.Bids ?? [];
      const parsedAccountId = (() => {
        try {
          return BigInt(accountId).toString();
        } catch {
          return accountId;
        }
      })();
      const filtered = all.filter((bid) => {
        try {
          return BigInt(bid.BuyerAccountID).toString() !== parsedAccountId;
        } catch {
          return bid.BuyerAccountID !== parsedAccountId;
        }
      });
      setBids(filtered);
    });
  }, [isVisible, accountId]);

  useEffect(() => {
    if (isVisible) setShowFilter(false);
  }, [isVisible]);

  useEffect(() => {
    if (showCreateOrder) setShowSelectKami(false);
  }, [showCreateOrder]);

  const restingKamis = useMemo(() => utils.getExternalKamis(), [utils]);
  const accountKamis = useMemo(() => utils.getAccountKamis(), [utils]);
  const ownedKamiIndices = useMemo(
    () => new Set(accountKamis.map((kami) => kami.index)),
    [accountKamis]
  );
  const isTabVisible = isVisible;
  const showBottomSection = isVisible && !showCreateOrder && showSelectKami;
  const showFilterBottom = isVisible && !showCreateOrder && showFilterSection;

  const formatPrice = (weiString: string) => {
    if (!weiString || weiString === '0') return '0';
    const num = Number(formatUnits(BigInt(weiString), 18));
    if (num < 0.001) return '<0.001';
    return num.toFixed(4);
  };

  const getBidLabel = (bid: KamiMarketBid) =>
    bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC
      ? `Kami #${bid.KamiIndex}`
      : '';

  const getBidProgress = (bid: KamiMarketBid) => {
    const total = bid.Total ?? 0;
    const quantity = bid.Quantity ?? 0;
    if (quantity <= 0) return '';
    return `${total}/${quantity}`;
  };

  const isSpecificBid =
    selectedBid?.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC;
  const specificKamiIndex = selectedBid?.KamiIndex;
  const canSelectKami = (index: number) => !isSpecificBid || index === specificKamiIndex;

  const toggleKami = (index: number) => {
    if (!canSelectKami(index)) return;
    setSelectedKamis((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleOpenSell = () => {
    onCloseCreateOrder();
    setShowFilterSection(false);
    setShowSelectKami(true);
  };

  const handleCloseSelect = () => setShowSelectKami(false);
  const handleOpenFilter = () => {
    onCloseCreateOrder();
    setShowSelectKami(false);
    setShowFilterSection(true);
  };
  const handleCloseFilter = () => setShowFilterSection(false);

  const handleSell = () => {
    if (!selectedBid || selectedKamis.size === 0) return;
    const selectedIndices = Array.from(selectedKamis);
    selectedIndices.forEach((kamiIndex) => {
      onAcceptOffer(selectedBid.OrderID, kamiIndex);
    });
    setSelectedKamis(new Set());
    setShowSelectKami(false);
  };
  const handleClear = () => {
    setSelectedKamis(new Set());
    setShowSelectKami(false);
  };

  const filteredBids = useMemo(() => {
    if (filterBy === 'Show all') return bids;
    if (ownedKamiIndices.size === 0) return [];
    return bids.filter((bid) => {
      if (bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC) {
        return ownedKamiIndices.has(bid.KamiIndex);
      }
      return true;
    });
  }, [bids, filterBy, ownedKamiIndices]);

  return (
    <>
      <Tab isVisible={isTabVisible}>
        <ButtonWrapper>
          <TextTooltip text={['Filters', filterBy]}>
            <IconButton img={FilterListIcon} onClick={handleOpenFilter} />
          </TextTooltip>
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
        </HeaderRow>
        {filteredBids.length === 0 && <EmptyText text={['No bids found']} size={0.9} />}
        {filteredBids.map((bid) => (
          <DataRow
            key={bid.OrderID}
            isSelected={selectedBid?.OrderID === bid.OrderID}
            onClick={() => {
              setSelectedBid(bid);
              setSelectedKamis(new Set());
            }}
          >
            <Column>
              {getBidProgress(bid) ? (
                <TextTooltip
                  text={[`${bid.Total}/${bid.Quantity} kami in this bid have already been purchased.`]}
                >
                  <CellText>
                    {getBidLabel(bid)} {getBidProgress(bid)}
                  </CellText>
                </TextTooltip>
              ) : (
                <CellText>{getBidLabel(bid)}</CellText>
              )}
            </Column>
            <Column>
              <CellText>{formatPrice(bid.Price)}</CellText>
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
            <KamiSlot
              key={kami.index}
              onClick={() => toggleKami(kami.index)}
              isDisabled={!canSelectKami(kami.index)}
            >
              <KamiImage src={kami.image} alt={kami.name} />
              <Checkbox
                type='checkbox'
                checked={selectedKamis.has(kami.index)}
                onChange={() => toggleKami(kami.index)}
                onClick={(e) => e.stopPropagation()}
                disabled={!canSelectKami(kami.index)}
              />
            </KamiSlot>
          ))}
        </KamiGrid>
        <Actions>
          <IconButton
            text='Sell'
            onClick={handleSell}
            disabled={!selectedBid || selectedKamis.size === 0}
          />
          <IconButton text='Clear' onClick={handleClear} />
        </Actions>
      </BottomSection>
      <FilterSection isVisible={showFilterBottom}>
        <Header>
          <HeaderTitle>Filter Bids</HeaderTitle>
          <IconButton text='X' onClick={handleCloseFilter} scale={1.5} />
        </Header>
        <FilterBody>
          <FilterOption>
            <input
              type='radio'
              name='bids-filter'
              value='Show all'
              checked={filterBy === 'Show all'}
              onChange={() => setFilterBy('Show all')}
            />
            Show all
          </FilterOption>
          <FilterOption>
            <input
              type='radio'
              name='bids-filter'
              value='Bids on my kami'
              checked={filterBy === 'Bids on my kami'}
              onChange={() => setFilterBy('Bids on my kami')}
            />
            Bids on my kami
          </FilterOption>
        </FilterBody>
      </FilterSection>
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
  width: fit-content;
  padding: 0.4vw;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
`;

const DataRow = styled.div<{ isSelected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;

  &:hover {
    background-color: #eee;
  }

  ${({ isSelected }) =>
    isSelected
      ? `
    background-color: #f3f0d1;
  `
      : ''}
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

const FilterSection = styled.div<{ isVisible: boolean }>`
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

const FilterBody = styled.div`
  padding: 0.6vw;
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
`;

const FilterOption = styled.label`
  font-size: 1vw;
  display: flex;
  align-items: center;
  gap: 0.3vw;
  cursor: pointer;

  input[type='radio'] {
    accent-color: rgb(203, 186, 61);
    cursor: pointer;
  }
`;

const KamiGrid = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;

  gap: 0.4vw;
  padding: 0.6vw;
`;

const KamiSlot = styled.div<{ isDisabled: boolean }>`
  position: relative;
  width: 5vw;
  height: 5vw;
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ isDisabled }) => (isDisabled ? 0.4 : 1)};
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
