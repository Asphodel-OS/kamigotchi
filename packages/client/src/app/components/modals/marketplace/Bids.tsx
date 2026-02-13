import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton } from 'app/components/library';
import { TokenIcons } from 'assets/images/tokens';
import { Kami } from 'network/shapes/Kami';

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
  };
}) => {
  const [selectedKamis, setSelectedKamis] = useState<Set<number>>(new Set());
  const [showSelectKami, setShowSelectKami] = useState(false);

  useEffect(() => {
    if (isVisible) setShowFilter(false);
  }, [isVisible]);

  useEffect(() => {
    if (showCreateOrder) setShowSelectKami(false);
  }, [showCreateOrder]);

  const restingKamis = useMemo(() => {
    return utils.getAccountKamis().filter((kami) => kami.state === '721_EXTERNAL');
  }, [utils]);

  const toggleKami = (index: number) => {
    setSelectedKamis((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSell = () => {};
  const handleClear = () => {
    setSelectedKamis(new Set());
    setShowSelectKami(false);
  };

  return (
    <>
      <Tab isVisible={isVisible}>
        <SellButtonWrapper>
          <IconButton
            text='Sell'
            onClick={() => {
              onCloseCreateOrder();
              setShowSelectKami(true);
            }}
          />
        </SellButtonWrapper>
        <Row>
          <Column>
            <ColumnHeader>Offer</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>
              <EthIcon src={TokenIcons.eth} alt='ETH' />
            </ColumnHeader>
          </Column>
        </Row>
      </Tab>
      <BottomSection isVisible={isVisible && !showCreateOrder && showSelectKami}>
        <Header>
          <HeaderTitle>Select Your Kami</HeaderTitle>
          <IconButton text='X' onClick={() => setShowSelectKami(false)} scale={1.5} />
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

const SellButtonWrapper = styled.div`
  width: fit-content;
  padding: 0.4vw;
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

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const BottomSection = styled.div<{ isVisible: boolean }>`
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
