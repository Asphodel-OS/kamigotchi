import { Dispatch, useState } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { Account, Item, NullItem } from 'network/shapes';
import { ConfirmationData } from '../Confirmation';
import { TabType } from '../types';
import { Controls } from './Controls';
import { Offers } from './offers/Offers';

interface Props {
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
}

export const Orderbook = (props: Props) => {
  const { actions, controls, data, utils, isVisible } = props;
  const { tab } = controls;

  const [sort, setSort] = useState<string>('Price'); // Price, Owner
  const [ascending, setAscending] = useState<boolean>(true);
  const [itemFilter, setItemFilter] = useState<Item>(NullItem); // item index
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
        }}
        data={data}
        utils={utils}
      />
      <Offers
        actions={actions}
        controls={{ typeFilter, sort, ascending, itemFilter }}
        data={data}
      />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row nowrap;
`;
