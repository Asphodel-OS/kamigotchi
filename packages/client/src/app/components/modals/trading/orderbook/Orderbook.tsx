import { Dispatch, useState } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { Account, Item, NullItem } from 'network/shapes';
import { ConfirmationData } from '../library/Confirmation';
import { TabType } from '../types';
import { Controls } from './Controls';
import { Offers } from './offers/Offers';

export const Orderbook = ({
  actions,
  controls,
  data,
  utils,
  isVisible,
}: {
  actions: {
    cancelTrade: (trade: Trade) => void;
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    tab: TabType;
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
  };
  data: {
    account: Account;
    items: Item[];
    trades: Trade[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
  isVisible: boolean;
}) => {
  const { tab } = controls;

  const [sort, setSort] = useState<string>('Price'); // Price, Owner
  const [ascending, setAscending] = useState<boolean>(true);
  const [itemFilter, setItemFilter] = useState<Item>(NullItem); // item index
  const [itemSearch, setItemSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TradeType>('Buy');

  return (
    <Container isVisible={isVisible}>
      <Controls
        controls={{
          typeFilter,
          setTypeFilter,
          sort,
          setSort,
          ascending,
          setAscending,
          itemFilter,
          setItemFilter,
          itemSearch,
          setItemSearch,
        }}
        data={data}
        utils={utils}
      />
      <Offers
        actions={actions}
        controls={{
          ...controls,
          typeFilter,
          sort,
          setSort,
          ascending,
          setAscending,
          itemFilter,
          itemSearch,
        }}
        data={data}
        utils={utils}
      />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row nowrap;

  user-select: none;
`;
