import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
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
}: {
  isVisible: boolean;
  onClose: () => void;
  utils: {
    getAccountKamis: () => Kami[];
  };
  createSellOrder: (kamiIndex: number, price: BigNumberish, expiry: BigNumberish) => void;
  createBuyOrder: (price: BigNumberish, quantity: number, expiry: BigNumberish) => void;
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

  const restingKamis = useMemo(() => {
    return utils.getAccountKamis().filter((kami) => isResting(kami));
  }, [utils]);

  const kamiOptions = useMemo(
    () => restingKamis.map((k) => ({ text: k.name, object: k, img: k.image })),
    [restingKamis]
  );

  const handleKamiSelect = (selected: Kami[]) => {
    setSelectedKami(selected ?? NullKami);
  };

  const handleCreate = () => {
    if (orderType === 'Sell') {
      if (!selectedKami[0] || !price) return;
      createSellOrder(selectedKami[0].index, price, expiration);
    }
    if (orderType === 'Buy') {
      if (!quantity || !price) return;
      createBuyOrder(price, Number(quantity), expiration);
    }
  };

  const handleClear = () => {
    setPrice('');
    setQuantity('');
    setSelectedKami([NullKami]);
    setExpiration(1);
  };

  const toggleOrderType = () => {
    handleClear();
    if (orderType === 'Sell') setOrderType('Buy');
    if (orderType === 'Buy') setOrderType('Sell');
  };

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
      />
      <Buy
        isVisible={orderType === 'Buy'}
        quantity={quantity}
        setQuantity={setQuantity}
        price={price}
        setPrice={setPrice}
        expiration={expiration}
        setExpiration={setExpiration}
      />
      <Actions>
        <IconButton text='Create' onClick={handleCreate} />
        <IconButton text='Clear' onClick={handleClear} />
      </Actions>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 45%;
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
