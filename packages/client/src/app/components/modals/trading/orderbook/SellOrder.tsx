import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Card, IconButton, Pairing } from 'app/components/library';
import { Item, NullItem } from 'network/shapes';
import { Trade } from 'network/shapes/Trade';
import { OrderType } from '../types';

interface Props {
  actions: {
    executeTrade: (trade: Trade) => void;
  };
  data: {
    trade: Trade;
  };
}

// represents Sell Offers (from the Taker's perspective)
// NOTE: only supports simple (single item) trades against musu atm
export const SellOrder = (props: Props) => {
  const { actions, data } = props;
  const { executeTrade } = actions;
  const { trade } = data;

  const [item, setItem] = useState<Item>(NullItem);
  const [itemAmt, setItemAmt] = useState<number>(1);
  const [currency, setCurrency] = useState<Item>(NullItem);
  const [currencyAmt, setCurrencyAmt] = useState<number>(1);

  // set the item and currency based assuming this is Sell Order from the Taker's side
  useEffect(() => {
    const buyOrder = trade.buyOrder;
    const sellOrder = trade.sellOrder;
    if (!buyOrder || !sellOrder) return;

    setItem(buyOrder.items[0]);
    setItemAmt(buyOrder.amounts[0]);
    setCurrency(sellOrder.items[0]);
    setCurrencyAmt(sellOrder.amounts[0]);
  }, [trade]);

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
          <TypeTag type='Sell'>Sell</TypeTag>
        </ColumnLeft>
        <ColumnRight key='column-2'>
          <Pairing
            icon={currency.image}
            text={currencyAmt.toLocaleString()}
            tooltip={[currency.name]}
            scale={1}
          />
          <ContentActions>
            <IconButton text='Sell' onClick={() => executeTrade(trade)} />
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
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: flex-start;
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

const TypeTag = styled.div<{ type: OrderType }>`
  position: absolute;
  width: 5vw;
  padding: 0.2vw;

  color: rgb(25, 39, 2);
  background-color: ${({ type }) => (type === 'Buy' ? 'rgb(192, 224, 139)' : 'rgb(222, 90, 120)')};
  clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%);

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 0.9vw;
`;
