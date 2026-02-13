import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { IconButton } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { BigNumberish } from 'ethers';
import { Kami, NullKami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

import { Buy } from './Buy';
import { Sell } from './Sell';

type OrderType = 'Sell' | 'Buy';

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
    getExternalKamis: () => Kami[];
  };
  createSellOrder: (kamiIndex: number, price: BigNumberish, expiry: BigNumberish) => void;
  createBuyOrder: (price: BigNumberish, quantity: number, expiry: BigNumberish) => void;
  createBuyKamiOrder: (kamiIndex: number, price: BigNumberish, expiry: BigNumberish) => void;
}) => {
  const [orderType, setOrderType] = useState<OrderType>('Sell');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiration, setExpiration] = useState(1);
  const [selectedKami, setSelectedKami] = useState<Kami[]>([NullKami]);

  const setModals = useVisibility((s) => s.setModals);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const kamiIndex = useSelected((s) => s.kamiIndex);

  const handleKamiClick = () => {
    if (!selectedKami[0]) return;
    const sameKami = kamiIndex === selectedKami[0].index;
    setKami(selectedKami[0].index);
    if (kamiModalOpen && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  const accountKamis = useMemo(() => utils.getAccountKamis(), [utils]);
  const externalKamis = useMemo(() => utils.getExternalKamis(), [utils]);
  const allKamis = useMemo(() => utils.getAllKamis(), [utils]);

  const restingKamis = useMemo(() => externalKamis, [externalKamis]);

  const kamiOptions = useMemo(
    () => restingKamis.map((k) => ({ text: k.name, object: k, img: k.image })),
    [restingKamis]
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

  const handleKamiSelect = (selected: Kami[]) => {
    setSelectedKami(selected ?? NullKami);
  };

  const handleCreate = () => {
    const getExpiryTs = () => {
      if (expiration === 0) return 0;
      const now = Math.floor(Date.now() / 1000);
      return now + expiration * 60 * 60;
    };

    if (orderType === 'Sell') {
      if (!selectedKami[0] || !price) return;
      createSellOrder(selectedKami[0].index, price, getExpiryTs());
    }
    if (orderType === 'Buy') {
      if (!price) return;
      if (selectedBuyKami) {
        createBuyKamiOrder(selectedBuyKami.index, price, getExpiryTs());
      } else {
        if (!quantity) return;
        createBuyOrder(price, Number(quantity), getExpiryTs());
      }
    }
  };

  const handleClear = () => {
    setPrice('');
    setQuantity('');
    setSelectedKami([NullKami]);
    setSelectedBuyKami(null);
    setExpiration(1);
  };

  const toggleOrderType = () => {
    handleClear();
    if (orderType === 'Sell') setOrderType('Buy');
    if (orderType === 'Buy') setOrderType('Sell');
  };

  const isSellComplete = selectedKami[0]?.id !== NullKami.id && !!price;
  const isBuyComplete = !!price && (!!selectedBuyKami || !!quantity);
  const isCreateDisabled = orderType === 'Sell' ? !isSellComplete : !isBuyComplete;

  return (
    <Container isVisible={isVisible}>
      <Header>
        <HeaderTitle>Create order</HeaderTitle>
        <IconButton text='X' onClick={onClose} scale={1.5} />
      </Header>
      <Body>
        <Row style={{ alignItems: `center` }}>
          <Label>I want to:</Label>
          <IconButton text={`< ${orderType} >`} onClick={toggleOrderType} />
        </Row>
      </Body>
      <Sell
        isVisible={orderType === 'Sell'}
        kamiOptions={kamiOptions}
        handleKamiSelect={handleKamiSelect}
        selectedKami={selectedKami}
        onKamiClick={handleKamiClick}
        price={price}
        setPrice={setPrice}
        expiration={expiration}
        setExpiration={setExpiration}
        hasExternalKamis={restingKamis.length > 0}
      />
      <Buy
        isVisible={orderType === 'Buy'}
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
      />
      <Actions>
        <IconButton text='Create' onClick={handleCreate} disabled={isCreateDisabled} />
        <IconButton text='Clear' onClick={handleClear} />
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

const Body = styled.div`
  padding: 0.3vw 0 0 0.3vw;
  gap: 0.6vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;
  display: flex;
  flex-flow: row nowrap;
`;

const Label = styled.span`
  font-size: 1vw;
`;

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  gap: 0.6vw;
  padding: 0.6vw;
  margin-top: auto;
`;
