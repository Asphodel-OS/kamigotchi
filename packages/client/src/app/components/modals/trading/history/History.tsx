import { EntityID } from '@mud-classic/recs';
import { useState } from 'react';
import styled from 'styled-components';

import { TradeType } from 'app/cache/trade';
import { Trade as TradeHistoryType } from 'clients/kamiden/proto';
import { Account, Item } from 'network/shapes';
import { Trade } from 'network/shapes/Trade/types';
import { Controls } from './Controls';
import { TradeHistory } from './TradeHistory';

export const History = ({
  isVisible,
  data,
  utils,
}: {
  isVisible: boolean;
  data: {
    account: Account;
    currencies: Item[];
    tradeHistory: TradeHistoryType[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
    getAccountByID: (id: EntityID) => Account;
    getTradeHistory: (tradeHistory: TradeHistoryType) => Trade;
  };
}) => {
  const [typeFilter, setTypeFilter] = useState<TradeType>('Buy');
  return (
    <Content isVisible={isVisible}>
      <Controls controls={{ typeFilter, setTypeFilter }} />
      <TradeHistory controls={{ typeFilter }} data={data} utils={utils} />
    </Content>
  );
};

const Content = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;

  user-select: none;
`;
