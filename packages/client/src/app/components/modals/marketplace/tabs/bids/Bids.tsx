import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { OperatorIcon } from 'assets/images/icons/menu';
import { TriggerIcons } from 'assets/images/icons/triggers';
import placeholderKami from 'assets/images/kamis/placeholderKami.gif';
import { TokenIcons } from 'assets/images/tokens';
import { getKamidenClient, KamiMarketBid, KamiMarketBidType } from 'clients/kamiden';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';
import { formatExpiry } from '../../helpers';
import { SelectBidKamis } from './SelectBidKamis';

const FILTER_CYCLE = ['Show all', 'Bids on my kami', 'Only generic'] as const;
type BidFilter = (typeof FILTER_CYCLE)[number];

const FilterIcons: Record<BidFilter, string> = {
  'Show all': TriggerIcons.eyeOpen,
  'Bids on my kami': OperatorIcon,
  'Only generic': placeholderKami,
};

const KamidenClient = getKamidenClient();

export const Bids = ({
  isVisible,
  showCreateOrder,
  setShowFilter,
  onCloseCreateOrder,
  onAcceptOfferBatch,
  accountId,
  utils,
}: {
  isVisible: boolean;
  showCreateOrder: boolean;
  setShowFilter: Dispatch<SetStateAction<boolean>>;
  onCloseCreateOrder: () => void;
  onAcceptOfferBatch: (offerID: string, kamiIndices: number[]) => Promise<void>;
  accountId: string;
  utils: {
    getAccountKamis: () => Kami[];
    getRestingKamis: () => Kami[];
    queryKamiByIndex: (index: number) => EntityIndex | undefined;
    getKami: (entity: EntityIndex) => Kami;
    getAccountByID: (id: string) => { name: string; index: number };
    isDifferentAccountId: (lhs: string, rhs: string) => boolean;
    formatEthPrice: (weiString: string, decimals: number) => string;
  };
}) => {
  /////////////////
  // INSTANTIATIONS

  const isMarketplaceOpen = useVisibility((s) => s.modals.marketplace);

  const [selectedKamis, setSelectedKamis] = useState<Set<number>>(new Set());
  const [showSelectKami, setShowSelectKami] = useState(false);
  const [bids, setBids] = useState<KamiMarketBid[]>([]);
  const [selectedBid, setSelectedBid] = useState<KamiMarketBid | null>(null);
  const [filterBy, setFilterBy] = useState<BidFilter>('Show all');

  // Reset on modal open
  useEffect(() => {
    if (!isMarketplaceOpen) return;
    setFilterBy('Show all');
    setSelectedBid(null);
    setSelectedKamis(new Set());
    setShowSelectKami(false);
  }, [isMarketplaceOpen]);

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;

    let isActive = true;
    const refreshBids = async () => {
      const res = await KamidenClient.getKamiMarketBids({
        Size: 28,
      });
      if (!isActive) return;
      const all = res.Bids ?? [];
      const filtered = all.filter((bid) =>
        utils.isDifferentAccountId(bid.BuyerAccountID, accountId)
      );
      setBids(filtered);
    };

    refreshBids();
    const intervalId = window.setInterval(refreshBids, 10000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isVisible, accountId]);

  useEffect(() => {
    if (isVisible) setShowFilter(false);
  }, [isVisible]);

  useEffect(() => {
    if (!showCreateOrder) return;
    setShowSelectKami(false);
  }, [showCreateOrder]);

  /////////////////
  // PREPARATION

  const restingKamis = useMemo(() => utils.getRestingKamis(), [utils]);
  const accountKamis = useMemo(() => utils.getAccountKamis(), [utils]);
  const ownedKamiIndices = useMemo(
    () => new Set(accountKamis.map((kami) => kami.index)),
    [accountKamis]
  );
  const showBottomSection = isVisible && !showCreateOrder && showSelectKami;

  const formatPrice = (weiString: string) => utils.formatEthPrice(weiString, 6);

  const formatRemainingBid = (bid: KamiMarketBid) => {
    try {
      const remaining = (BigInt(bid.Price) * BigInt(bid.Quantity)).toString();
      return utils.formatEthPrice(remaining, 6);
    } catch {
      return '?';
    }
  };

  const restingIndices = useMemo(() => new Set(restingKamis.map((k) => k.index)), [restingKamis]);
  const allOwnedIndices = useMemo(() => {
    const set = new Set(ownedKamiIndices);
    restingKamis.forEach((k) => set.add(k.index));
    return set;
  }, [ownedKamiIndices, restingKamis]);
  const nonRestingKamis = useMemo(
    () => accountKamis.filter((k) => !restingIndices.has(k.index)),
    [accountKamis, restingIndices]
  );

  const getBidProgress = (bid: KamiMarketBid) => {
    const total = bid.Total ?? 0;
    const quantity = bid.Quantity ?? 0;
    if (total <= 1) return '';
    return `${total - quantity}/${total}`;
  };

  const isSpecificBid = selectedBid?.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC;
  const specificKamiIndex = selectedBid?.KamiIndex;
  const maxFillable = selectedBid?.Quantity ?? 0;
  const isFull = selectedKamis.size >= maxFillable && maxFillable > 0;
  const canSelectKami = (index: number) => {
    if (isSpecificBid && index !== specificKamiIndex) return false;
    // Already selected kamis can always be toggled off
    if (selectedKamis.has(index)) return true;
    // If we've hit the fill limit, lock remaining unselected kamis
    if (isFull) return false;
    return true;
  };

  const filteredBids = useMemo(() => {
    switch (filterBy) {
      case 'Show all':
        return bids;
      case 'Only generic':
        return bids.filter(
          (bid) => bid.BidType !== KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC
        );
      default: // Bids on my kami — only specific bids targeting kami you own (staked + unstaked)
        if (allOwnedIndices.size === 0) return [];
        return bids.filter(
          (bid) =>
            bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC &&
            allOwnedIndices.has(bid.KamiIndex)
        );
    }
  }, [bids, filterBy, allOwnedIndices]);

  const sortedBids = useMemo(() => {
    return [...filteredBids].sort((a, b) => {
      try {
        return Number(BigInt(b.Price) - BigInt(a.Price));
      } catch {
        return 0;
      }
    });
  }, [filteredBids]);

  const getBestBidForKami = (kamiIndex: number) =>
    sortedBids.find((bid) =>
      bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC
        ? bid.KamiIndex === kamiIndex
        : true
    );

  const resolveKami = (bid: KamiMarketBid) => {
    if (bid.BidType !== KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC) return undefined;
    const entity = utils.queryKamiByIndex(bid.KamiIndex);
    return entity !== undefined ? utils.getKami(entity) : undefined;
  };

  /////////////////
  // ACTIONS

  const toggleKami = (index: number) => {
    if (!canSelectKami(index)) return;
    setSelectedKamis((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      if (next.size === 0) {
        setSelectedBid(null);
      } else if (!selectedBid) {
        const bestBid = getBestBidForKami(index);
        if (bestBid) setSelectedBid(bestBid);
      }
      return next;
    });
  };

  const handleSellBid = (bid: KamiMarketBid) => {
    // Clicking the same bid again (whether modal is open or not) deselects
    if (selectedBid?.OrderID === bid.OrderID) {
      setSelectedBid(null);
      setSelectedKamis(new Set());
      setShowSelectKami(false);
      return;
    }
    setSelectedBid(bid);
    // Auto-select kami for specific bids if we own it and it is resting
    const isSpecific = bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC;
    if (isSpecific && restingIndices.has(bid.KamiIndex)) {
      setSelectedKamis(new Set([bid.KamiIndex]));
    } else {
      setSelectedKamis(new Set());
    }
    onCloseCreateOrder();
    setShowSelectKami(true);
  };

  const handleCloseSelect = () => {
    setShowSelectKami(false);
    setSelectedBid(null);
    setSelectedKamis(new Set());
  };

  const cycleFilter = () => {
    const idx = FILTER_CYCLE.indexOf(filterBy);
    setFilterBy(FILTER_CYCLE[(idx + 1) % FILTER_CYCLE.length]);
  };

  const handleSell = async () => {
    if (!selectedBid || selectedKamis.size === 0) return;
    const selectedIndices = Array.from(selectedKamis);
    await onAcceptOfferBatch(selectedBid.OrderID, selectedIndices);
    setSelectedKamis(new Set());
    setShowSelectKami(false);
  };

  const handleClear = () => {
    setSelectedKamis(new Set());
    setSelectedBid(null);
  };

  const handleSelectMax = () => {
    const bestBid = selectedBid ?? sortedBids[0];
    if (!bestBid) return;
    const eligible = restingKamis
      .filter((kami) => canSelectKami(kami.index))
      .filter((kami) =>
        bestBid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC
          ? kami.index === bestBid.KamiIndex
          : true
      );
    const maxCount = Math.min(bestBid.Quantity ?? 0, eligible.length);
    const next = new Set(eligible.slice(0, maxCount).map((kami) => kami.index));
    setSelectedBid(bestBid);
    setSelectedKamis(next);
  };

  /////////////////
  // DISPLAY

  const sellLabel =
    selectedBid && selectedKamis.size > 0
      ? `Sell to ${utils.getAccountByID(selectedBid.BuyerAccountID).name || 'Unknown'} for ${formatPrice((BigInt(selectedBid.Price) * BigInt(selectedKamis.size)).toString())}`
      : 'Sell';

  return (
    <>
      <Tab isVisible={isVisible}>
        <ButtonWrapper>
          <TextTooltip text={[`Filter: ${filterBy}`]}>
            <IconButton img={FilterIcons[filterBy]} onClick={cycleFilter} radius={0.6} />
          </TextTooltip>
        </ButtonWrapper>
        <HeaderRow>
          <Column flex={2}>
            <ColumnHeader>Kami</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>Bidder</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>
              <EthIcon src={TokenIcons.eth} alt='ETH' /> /Kami
            </ColumnHeader>
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
        <BidsBody>
          {sortedBids.length === 0 && (
            <EmptyCenter>
              <EmptyText text={['No bids found']} size={0.9} />
            </EmptyCenter>
          )}
          {sortedBids.map((bid) => {
            const isSpecific = bid.BidType === KamiMarketBidType.KAMI_MARKET_BID_TYPE_SPECIFIC;
            const kami = resolveKami(bid);
            const bidder = utils.getAccountByID(bid.BuyerAccountID);
            const progress = getBidProgress(bid);
            const isSelected = selectedBid?.OrderID === bid.OrderID;
            const notYourKami = isSpecific && !allOwnedIndices.has(bid.KamiIndex);

            return (
              <Row key={bid.OrderID} isSelected={isSelected}>
                <Column flex={2}>
                  <KamiCell>
                    <KamiThumbnail
                      src={isSpecific && kami ? kami.image : placeholderKami}
                      alt={isSpecific ? (kami?.name ?? `Kami #${bid.KamiIndex}`) : 'Any Kami'}
                    />
                    <KamiInfo>
                      <KamiName>
                        {isSpecific ? (kami?.name ?? `Kami #${bid.KamiIndex}`) : 'Any Kami'}
                      </KamiName>
                      {progress && <ProgressText>{progress}</ProgressText>}
                    </KamiInfo>
                  </KamiCell>
                </Column>
                <Column>
                  <CellText>{bidder.name || 'Unknown'}</CellText>
                </Column>
                <Column>
                  <CellText>{formatPrice(bid.Price)}</CellText>
                </Column>
                <Column>
                  <CellText>{formatRemainingBid(bid)}</CellText>
                </Column>
                <Column>
                  <CellText>{formatExpiry(bid.Expiry)}</CellText>
                </Column>
                <Column>
                  {notYourKami ? (
                    <IconButton text='Not Ur Kami' disabled />
                  ) : isSelected ? (
                    <IconButton
                      text='Deselect'
                      onClick={() => handleSellBid(bid)}
                      color='#FDECEC'
                    />
                  ) : (
                    <IconButton
                      text='Fill Bid'
                      onClick={() => handleSellBid(bid)}
                      color='#E8F5E9'
                    />
                  )}
                </Column>
              </Row>
            );
          })}
        </BidsBody>
      </Tab>
      <SelectBidKamis
        isVisible={showBottomSection}
        restingKamis={restingKamis}
        nonRestingKamis={nonRestingKamis}
        selectedCount={selectedKamis.size}
        canSelectKami={canSelectKami}
        isSelected={(index) => selectedKamis.has(index)}
        onToggleKami={toggleKami}
        onClose={handleCloseSelect}
        onClear={handleClear}
        onSelectMax={handleSelectMax}
        onSell={handleSell}
        sellLabel={sellLabel}
        sellDisabled={!selectedBid || selectedKamis.size === 0}
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
  justify-content: flex-end;
  align-items: center;
  gap: 0.4vw;
  padding: 0.4vw;
  width: 100%;
  border-bottom: solid #ccc 0.1vw;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  min-height: 3vw;
`;

const BidsBody = styled.div`
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

const Row = styled.div<{ isSelected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  flex-shrink: 0;
  width: 100%;
  border-bottom: 0.06vw solid #ccc;
  min-height: 3vw;
  margin: 0.2vw 0;
  background-color: ${({ isSelected }) => (isSelected ? '#f3f0d1' : 'transparent')};

  &:hover {
    background-color: ${({ isSelected }) => (isSelected ? '#f3f0d1' : '#eee')};
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
  gap: 0.2vw;
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
  width: 11vw;
`;

const KamiThumbnail = styled.img`
  width: 3vw;
  height: 3vw;
  flex-shrink: 0;
  border-radius: 0.3vw;
  border: 0.1vw solid black;
  image-rendering: pixelated;
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

const CellText = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95vw;
  line-height: 1.2;
  padding: 0.4vw 0.6vw;
`;
