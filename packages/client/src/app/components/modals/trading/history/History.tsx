import { EntityID } from '@mud-classic/recs';
import { useState } from 'react';
import styled from 'styled-components';

import { TradeType } from 'app/cache/trade';
import { Trade as TradeHistoryType } from 'clients/kamiden/proto';
import { Account, Item } from 'network/shapes';
import { Trade } from 'network/shapes/Trade/types';
import { Offers as OffersTable } from '../orderbook/offers/Offers';

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
  const [typeFilter, setTypeFilter] = useState<TradeType>('All' as any);
  return (
    <Content isVisible={isVisible}>
      <OffersTable
        actions={{ executeTrade: (() => {}) as any }}
        controls={{
          sort: 'Total' as any,
          setSort: (() => {}) as any,
          ascending: true,
          setAscending: (() => {}) as any,
          itemFilter: ({ index: 0 } as unknown) as any,
          typeFilter: (typeFilter as unknown) as any,
          isConfirming: false,
          itemSearch: '',
          setIsConfirming: (() => {}) as any,
          setConfirmData: (() => {}) as any,
        }}
        data={{
          account: (data.account as unknown) as any,
          trades: data.tradeHistory.map((th) => utils.getTradeHistory(th)),
        }}
        utils={{ getItemByIndex: utils.getItemByIndex }}
        extraFilter={(t) => t.state !== 'PENDING' && (t.maker?.entity === data.account.entity || t.taker?.entity === data.account.entity)}
        filtersEnabled={false}
      />
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
