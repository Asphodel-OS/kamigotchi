import { Dispatch, useEffect, useState } from 'react';
import styled from 'styled-components';

import { getTradeType, Trade } from 'app/cache/trade';
import { getPerUnitPrice } from 'app/cache/trade/functions';
import { EmptyText } from 'app/components/library';
import { Account, Item } from 'network/shapes';
import { ConfirmationData } from '../../Confirmation';
import { PendingOffer } from './PendingOffer';

interface Props {
  actions: {
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    sort: string;
    ascending: boolean;
    itemFilter: Item;
    typeFilter: string;
    isConfirming: boolean;
    itemSearch: string;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
  };
  data: { account: Account; trades: Trade[] };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}

export const Offers = (props: Props) => {
  const { actions, controls, data, utils } = props;
  const { typeFilter, sort, ascending, itemFilter, itemSearch } = controls;
  const { account, trades } = data;

  const [displayed, setDisplayed] = useState<Trade[]>([]);

  useEffect(() => {
    // filter by type
    let cleaned = trades.filter((trade) => {
      const type = getTradeType(trade, false);
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
        const aType = getTradeType(a, false);
        const bType = getTradeType(b, false);
        const aPrice = getPerUnitPrice(a, aType);
        const bPrice = getPerUnitPrice(b, bType);
        if (ascending) return aPrice - bPrice;
        return bPrice - aPrice;
      }

      return 0;
    });
    setDisplayed(sorted);
  }, [trades, typeFilter, sort, ascending, itemFilter, itemSearch]);

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Title>Open Offers</Title>
      <Body>
        {displayed.map((trade, i) => {
          const type = getTradeType(trade, false);
          return (
            <PendingOffer
              key={i}
              actions={actions}
              controls={controls}
              data={{ account, trade, type }}
              utils={utils}
            />
          );
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
  z-index: 1;
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
