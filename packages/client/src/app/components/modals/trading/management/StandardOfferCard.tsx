import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Card, IconButton, Pairing } from 'app/components/library';
import { Item, NullItem } from 'network/shapes';
import { Trade } from 'network/shapes/Trade';
import { StateColors, TypeColors } from '../constatnts';
import { OrderType } from '../types';

interface Props {
  actions: {
    cancelTrade: (trade: Trade) => void;
    completeTrade: (trade: Trade) => void;
  };
  data: {
    trade: Trade;
    type: OrderType;
  };
}

// represents Buy/Sell Orders
// NOTE: only supports simple (single item) trades against musu atm
export const StandardOfferCard = (props: Props) => {
  const { actions, data } = props;
  const { completeTrade, cancelTrade } = actions;
  const { trade, type } = data;

  const [item, setItem] = useState<Item>(NullItem);
  const [itemAmt, setItemAmt] = useState<number>(1);
  const [currency, setCurrency] = useState<Item>(NullItem);
  const [currencyAmt, setCurrencyAmt] = useState<number>(1);

  // set either side of a standard order based on the type
  useEffect(() => {
    const buyOrder = trade.buyOrder;
    const sellOrder = trade.sellOrder;
    if (!buyOrder || !sellOrder) return;

    if (type === 'Buy') {
      setItem(buyOrder.items[0]);
      setItemAmt(buyOrder.amounts[0]);
      setCurrency(sellOrder.items[0]);
      setCurrencyAmt(sellOrder.amounts[0]);
    } else if (type === 'Sell') {
      setItem(sellOrder.items[0]);
      setItemAmt(sellOrder.amounts[0]);
      setCurrency(buyOrder.items[0]);
      setCurrencyAmt(buyOrder.amounts[0]);
    }
  }, [trade, type]);

  /////////////////
  // INTERPRETATION

  const getTypeColor = (): string => {
    if (type === 'Buy') return TypeColors.Buy;
    if (type === 'Sell') return TypeColors.Sell;
    if (type === 'Barter') return TypeColors.Barter;
    if (type === 'Forex') return TypeColors.Forex;
    return '';
  };

  const getStateColor = (): string => {
    if (trade.state === 'OPEN') return StateColors.OPEN;
    if (trade.state === 'EXECUTED') return StateColors.EXECUTED;
    return '';
  };

  const getActionText = (): string => {
    if (trade.state === 'OPEN') return 'Cancel';
    if (trade.state === 'EXECUTED') return 'Complete';
    return '';
  };

  const getAction = () => {
    if (trade.state === 'OPEN') return () => cancelTrade(trade);
    if (trade.state === 'EXECUTED') return () => completeTrade(trade);
    return () => null;
  };

  /////////////////
  // DISPLAY

  return (
    <Card
      image={{
        icon: item.image,
        scale: 7.5,
        padding: 1,
        overlay: `${itemAmt}`,
        tooltip: [item.description ?? ''],
      }}
      fullWidth
    >
      <TitleBar>
        <TitleText key='title'>{item.name}</TitleText>
      </TitleBar>
      <Content>
        <ColumnLeft>
          <TypeTag color={getTypeColor()}>{type}</TypeTag>
          <StateTag color={getStateColor()}>{trade.state}</StateTag>
        </ColumnLeft>
        <ColumnRight key='column-2'>
          <Pairing
            icon={currency.image}
            text={currencyAmt.toLocaleString()}
            tooltip={[currency.name]}
            scale={1}
          />
          <ContentActions>
            <IconButton text={getActionText()} onClick={getAction()} />
          </ContentActions>
        </ColumnRight>
      </Content>
    </Card>
  );
};

const TitleBar = styled.div`
  border-bottom: solid black 0.15vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  user-select: none;
`;

const TitleText = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 0.6vw;

  font-size: 0.9vw;
  text-align: left;
`;

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  align-items: stretch;

  padding: 0.2vw;
  user-select: none;
`;

const ColumnLeft = styled.div`
  position: relative;
  margin: 0.3vw;
  gap: 0.3vw;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: space-between;
`;

const TypeTag = styled.div<{ color: string }>`
  width: 5vw;
  padding: 0.2vw;

  color: rgb(25, 39, 2);
  background-color: ${({ color }) => color};
  clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%);

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 0.9vw;
`;

const StateTag = styled.div<{ color: string }>`
  width: 9vw;
  padding: 0.2vw;

  color: rgb(25, 39, 2);
  background-color: ${({ color }) => color};
  clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%);

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 0.9vw;
`;

const ColumnRight = styled.div`
  position: relative;
  margin: 0.3vw;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-end;
  justify-content: space-between;
`;

const ContentActions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  gap: 0.3vw;
`;
