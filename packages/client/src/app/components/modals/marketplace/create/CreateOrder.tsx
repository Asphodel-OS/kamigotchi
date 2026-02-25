import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { parseEther } from 'viem';

import { IconButton, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';

import { BigNumberish } from 'ethers';
import { Kami, NullKami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

import { Buy } from './Buy';
import { Sell } from './Sell';

type OrderType = 'listing' | 'bid';
const DEFAULT_EXPIRY_HOURS = 0;

const getExpiryTimestamp = (expirationHours: number) => {
  if (expirationHours === 0) return 0;
  return Math.floor(Date.now() / 1000) + expirationHours * 60 * 60;
};

const isKamiResting = (state: string) => state === 'RESTING';

const parseEthToWei = (ethAmount: string) => {
  if (!ethAmount) return null;
  try {
    return parseEther(ethAmount);
  } catch {
    return null;
  }
};

export const CreateOrder = ({
  isVisible,
  onClose,
  utils,
  createSellOrder,
  createBuyOrder,
  createBuyKamiOrder,
}: {
  isVisible: boolean;
  onClose: () => void;
  utils: {
    getAccountKamis: () => Kami[];
    getAllKamis: () => Kami[];
    getRestingKamis: () => Kami[];
  };
  createSellOrder: (
    kamiIndex: number,
    price: BigNumberish,
    expiry: BigNumberish
  ) => Promise<boolean>;
  createBuyOrder: (price: BigNumberish, quantity: number, expiry: BigNumberish) => Promise<boolean>;
  createBuyKamiOrder: (
    kamiIndex: number,
    price: BigNumberish,
    expiry: BigNumberish
  ) => Promise<boolean>;
}) => {
  /////////////////
  // INSTANTIATIONS

  const [orderType, setOrderType] = useState<OrderType>('listing');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiration, setExpiration] = useState(DEFAULT_EXPIRY_HOURS);
  const [selectedKami, setSelectedKami] = useState<Kami[]>([NullKami]);
  const [accountKamis, setAccountKamis] = useState<Kami[]>([]);
  const [restingKamis, setRestingKamis] = useState<Kami[]>([]);
  const [allKamis, setAllKamis] = useState<Kami[]>([]);
  const setModals = useVisibility((s) => s.setModals);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const kamiIndex = useSelected((s) => s.kamiIndex);

  /////////////////
  // PREPARATION

  useEffect(() => {
    if (!isVisible) return;
    const refreshKamiLists = () => {
      setAccountKamis(utils.getAccountKamis());
      setRestingKamis(utils.getRestingKamis());
      setAllKamis(utils.getAllKamis());
    };

    refreshKamiLists();
    const intervalId = window.setInterval(refreshKamiLists, 1000);
    return () => window.clearInterval(intervalId);
  }, [isVisible, utils]);

  const sellableKamis = restingKamis;

  useEffect(() => {
    setSelectedKami((prev) => {
      const current = prev[0];

      if (sellableKamis.length === 0) {
        return current?.id === NullKami.id ? prev : [NullKami];
      }

      if (!current || current.id === NullKami.id) return [sellableKamis[0]];

      const updatedSelection = sellableKamis.find((kami) => kami.index === current.index);
      if (!updatedSelection) return [sellableKamis[0]];

      const isSameSelectionContent =
        current.id === updatedSelection.id &&
        current.name === updatedSelection.name &&
        current.image === updatedSelection.image &&
        current.state === updatedSelection.state;

      return isSameSelectionContent ? prev : [updatedSelection];
    });
  }, [sellableKamis]);

  const kamiOptions = useMemo(
    () => sellableKamis.map((k) => ({ text: k.name, object: k, img: k.image })),
    [sellableKamis]
  );

  const [selectedBuyKami, setSelectedBuyKami] = useState<Kami | null>(null);

  const accountKamiIds = useMemo(() => new Set(accountKamis.map((k) => k.id)), [accountKamis]);
  const unownedKamis = useMemo(
    () => allKamis.filter((k) => !accountKamiIds.has(k.id)),
    [allKamis, accountKamiIds]
  );
  const allKamiOptions = useMemo(
    () =>
      unownedKamis.map((k) => ({
        text: k.name,
        image: k.image,
        onClick: () => {
          setSelectedBuyKami(k);
          setQuantity('');
        },
      })),
    [unownedKamis]
  );

  const isPriceValid = parseEthToWei(price) !== null;
  const isSellComplete = selectedKami[0]?.id !== NullKami.id && isPriceValid;
  const isBuyComplete = isPriceValid && (!!selectedBuyKami || Number(quantity) > 0);
  const selectedKamiState = selectedKami[0]?.state ?? '';
  const isSelectedKamiResting = isKamiResting(selectedKamiState);
  const isSelectedKamiNotListed = selectedKami[0]?.state !== 'LISTED';
  const sellBlockedReason = (() => {
    if (orderType !== 'listing' || selectedKami[0]?.id === NullKami.id) return '';
    if (!isSelectedKamiNotListed) return 'This Kami already has an active listing.';
    if (!isSelectedKamiResting) return 'This Kami is not resting.';
    return '';
  })();
  const isCreateDisabled =
    orderType === 'listing' ? !isSellComplete || !!sellBlockedReason : !isBuyComplete;
  const sellSelectionTooltip = `You don't have resting Kami.`;
  const actionText = orderType === 'listing' ? 'Place Listing' : 'Place Bid';

  /////////////////
  // ACTIONS

  const handleKamiClick = () => {
    if (!selectedKami[0]) return;
    const sameKami = kamiIndex === selectedKami[0].index;
    setKami(selectedKami[0].index);
    if (kamiModalOpen && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  const handleKamiSelect = (selected: Kami[]) => {
    setSelectedKami(selected?.length ? selected : [NullKami]);
  };

  const handleCreate = async () => {
    const expiry = getExpiryTimestamp(expiration);
    const priceWei = parseEthToWei(price);

    if (orderType === 'listing') {
      if (!selectedKami[0] || priceWei === null) return;
      const completed = await createSellOrder(selectedKami[0].index, priceWei, expiry);
      if (completed) handleClear();
    }
    if (orderType === 'bid') {
      if (priceWei === null) return;
      if (selectedBuyKami) {
        const completed = await createBuyKamiOrder(selectedBuyKami.index, priceWei, expiry);
        if (completed) handleClear();
      } else {
        if (!quantity) return;
        const qty = Number(quantity);
        const perKamiWei = BigInt(priceWei.toString()) / BigInt(qty);
        const completed = await createBuyOrder(perKamiWei, qty, expiry);
        if (completed) handleClear();
      }
    }
  };

  const handleClear = () => {
    setPrice('');
    setQuantity('');
    setSelectedKami([NullKami]);
    setSelectedBuyKami(null);
    setExpiration(DEFAULT_EXPIRY_HOURS);
  };

  const handleTabSwitch = (newType: OrderType) => {
    if (newType === orderType) return;
    handleClear();
    setOrderType(newType);
    playClick();
  };

  /////////////////
  // DISPLAY

  return (
    <Container isVisible={isVisible}>
      <Header>
        <HeaderTitle>Create Order</HeaderTitle>
        <IconButton text='X' onClick={onClose} scale={1.5} />
      </Header>
      <BookmarkRow>
        <BookmarkTab
          $active={orderType === 'listing'}
          $color='#FFF0E0'
          onClick={() => handleTabSwitch('listing')}
        >
          Listing
        </BookmarkTab>
        <BookmarkTab
          $active={orderType === 'bid'}
          $color='#E0EEFF'
          onClick={() => handleTabSwitch('bid')}
        >
          Bid
        </BookmarkTab>
      </BookmarkRow>
      <ContentArea>
        <Sell
          isVisible={orderType === 'listing'}
          kamiOptions={kamiOptions}
          handleKamiSelect={handleKamiSelect}
          selectedKami={selectedKami}
          onKamiClick={handleKamiClick}
          price={price}
          setPrice={setPrice}
          expiration={expiration}
          setExpiration={setExpiration}
          hasSellableKamis={sellableKamis.length > 0}
          disabledTooltip={sellSelectionTooltip}
        />
        <Buy
          isVisible={orderType === 'bid'}
          quantity={quantity}
          setQuantity={(val) => {
            setQuantity(val);
            if (val) setSelectedBuyKami(null);
          }}
          price={price}
          setPrice={setPrice}
          expiration={expiration}
          setExpiration={setExpiration}
          kamiOptions={allKamiOptions}
          selectedBuyKami={selectedBuyKami}
          onClearBuyKami={() => setSelectedBuyKami(null)}
        />
      </ContentArea>
      <Actions>
        {sellBlockedReason ? (
          <TextTooltip text={[sellBlockedReason]}>
            <span>
              <IconButton
                text={actionText}
                onClick={handleCreate}
                disabled={isCreateDisabled}
                color='#E8F5E9'
              />
            </span>
          </TextTooltip>
        ) : (
          <IconButton
            text={actionText}
            onClick={handleCreate}
            disabled={isCreateDisabled}
            color='#E8F5E9'
          />
        )}
        <IconButton text='Clear' onClick={handleClear} color='#E0EEFF' />
      </Actions>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
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
  padding: 0.5vw 0.8vw;
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

const BookmarkRow = styled.div`
  display: flex;
  width: 100%;
`;

const BookmarkTab = styled.button<{ $active: boolean; $color: string }>`
  flex: 1;
  padding: 0.5vw 0;
  font-size: 0.9vw;
  line-height: 1.2vw;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  background: ${({ $active, $color }) => ($active ? $color : '#f0f0f0')};
  border: none;
  border-bottom: 0.15vw solid ${({ $active }) => ($active ? 'transparent' : '#ccc')};
  cursor: pointer;
  transition: background 0.15s;
  color: ${({ $active }) => ($active ? '#222' : '#888')};

  &:hover {
    background: ${({ $active, $color }) => ($active ? $color : '#e8e8e8')};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  gap: 0.6vw;
  padding: 0.6vw;
  margin-top: auto;
  background: rgb(240, 240, 240);
  border-top: 0.1vw solid #ccc;
`;
