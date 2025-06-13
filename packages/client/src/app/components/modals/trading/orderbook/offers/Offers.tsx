import styled from 'styled-components';

import { isItemCurrency } from 'app/cache/item';
import { EmptyText } from 'app/components/library';
import { Item } from 'network/shapes';
import { Trade } from 'network/shapes/Trade/types';
import { useEffect, useState } from 'react';
import { OrderType } from '../../types';
import { BuyOrder } from './BuyOrder';
import { SellOrder } from './SellOrder';

interface Props {
  actions: {
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    sort: string;
    ascending: boolean;
    itemFilter: Item;
    typeFilter: string;
  };
  data: { trades: Trade[] };
}

export const Offers = (props: Props) => {
  const { actions, controls, data } = props;
  const { typeFilter, sort, ascending, itemFilter } = controls;
  const { trades } = data;

  const [displayed, setDisplayed] = useState<Trade[]>([]);

  useEffect(() => {
    // filter by type
    let cleaned = trades.filter((trade) => {
      const type = getTradeType(trade);
      return type === typeFilter;
    });

    // filter by item
    if (itemFilter.index !== 0) {
      cleaned = cleaned.filter((trade) => {
        const buyHas = trade.buyOrder?.items.some((item) => item.index === itemFilter.index);
        const sellHas = trade.sellOrder?.items.some((item) => item.index === itemFilter.index);
        return buyHas || sellHas;
      });
    }

    // sorting
    const sorted = cleaned.toSorted((a: Trade, b: Trade) => {
      if (sort === 'Owner') {
        const aName = a.maker?.name.toLowerCase() || '';
        const bName = b.maker?.name.toLowerCase() || '';

        if (ascending) return aName.localeCompare(bName);
        return bName.localeCompare(aName);
      }

      if (sort === 'Price') {
        const aPrice = getTradePrice(a);
        const bPrice = getTradePrice(b);
        if (ascending) return aPrice - bPrice;
        return bPrice - aPrice;
      }

      return 0;
    });
    setDisplayed(sorted);
  }, [trades, typeFilter, sort, ascending, itemFilter]);

  // determine what kind of trade this is to the Taker
  // TODO: check is simple atm. refine it over time
  const getTradeType = (trade: Trade): OrderType => {
    const buyOrder = trade.buyOrder;
    const sellOrder = trade.sellOrder;
    if (!buyOrder || !sellOrder) return '???';

    const buyHasMusu = buyOrder.items.some((item) => isItemCurrency(item));
    const sellHasMusu = sellOrder.items.some((item) => isItemCurrency(item));

    if (buyHasMusu && !sellHasMusu) return 'Buy';
    if (!buyHasMusu && sellHasMusu) return 'Sell';
    if (buyHasMusu && sellHasMusu) return 'Forex';
    if (!buyHasMusu && !sellHasMusu) return 'Barter';
    return '???';
  };

  // determine the per unit item price of a trade
  const getTradePrice = (trade: Trade) => {
    const type = getTradeType(trade);
    const buyAmt = trade.buyOrder?.amounts[0] ?? 1;
    const sellAmt = trade.sellOrder?.amounts[0] ?? 1;
    if (type === 'Buy') return buyAmt / sellAmt;
    else if (type === 'Sell') return sellAmt / buyAmt;
    return 0;
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Title>Open Offers</Title>
      <Body>
        {displayed.map((trade, i) => {
          const type = getTradeType(trade);
          if (type === 'Sell') return <SellOrder key={i} actions={actions} data={{ trade }} />;
          return <BuyOrder key={i} actions={actions} data={{ trade }} />;
        })}
      </Body>
      {displayed.length === 0 && <EmptyText text={['No active trades to show']} />}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 60%;

  display: flex;
  flex-direction: column;
  align-items: center;

  overflow: hidden scroll;
  scrollbar-color: transparent transparent;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  padding: 1.8vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 2;
`;

const Body = styled.div`
  position: relative;
  height: max-content;
  width: 100%;

  padding: 0.9vw;
  gap: 0.9vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`;
