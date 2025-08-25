import { EntityID } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getTradeType, Trade, TradeType } from 'app/cache/trade';
import { EmptyText } from 'app/components/library';
import { Trade as TradeHistoryType } from 'clients/kamiden/proto';
import { Account, Item } from 'network/shapes';
import { ExecutedOffer } from '../management/offers/ExecutedOffer';

export const TradeHistory = ({
  controls: {
    typeFilter,
  },
  data: {
    account,
    tradeHistory,
  },
  utils: {
    getTradeHistory,
    getItemByIndex,
  },
}: {
  controls: {
    typeFilter: TradeType;
  };
  data: {
    account: Account;
    tradeHistory: TradeHistoryType[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
    getAccountByID: (id: EntityID) => Account;
    getTradeHistory: (tradeHistory: TradeHistoryType) => Trade;
  };
}) => {
  const [displayed, setDisplayed] = useState<Trade[]>([]);

  useEffect(() => {
    const history = tradeHistory.map((tradeHistory) => {
      return getTradeHistory(tradeHistory);
    });
    const cleaned = history.filter((trade) => {
      const type = getTradeType(trade);
      return type === typeFilter;
    });
    setDisplayed(cleaned);
  }, [account.id, typeFilter, tradeHistory]);

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Title>Your Trade History</Title>
      <Body>
        {displayed.map((trade, i) => {
          const type = getTradeType(trade);

          return (
            <ExecutedOffer key={i} data={{ account, trade, type }} utils={{ getItemByIndex }} />
          );
        })}
      </Body>
      {displayed.length === 0 && <EmptyText text={['No trades to show']} />}
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
