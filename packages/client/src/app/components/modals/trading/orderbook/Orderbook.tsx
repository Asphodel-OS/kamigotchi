import { EntityIndex } from '@mud-classic/recs';
import { useState } from 'react';
import styled from 'styled-components';

import { Item, NullItem } from 'network/shapes';
import { Trade } from 'network/shapes/Trade/types';
import { OrderType } from '../types';
import { Controls } from './Controls';
import { Offers } from './Offers';

interface Props {
  actions: {
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    tab: string;
  };
  data: {
    accountEntity: EntityIndex;
    items: Item[];
    trades: Trade[];
  };
  isVisible: boolean;
}

export const Orderbook = (props: Props) => {
  const { actions, controls, data } = props;
  const { executeTrade } = actions;
  const { tab } = controls;

  const [sort, setSort] = useState<string>('Price'); // Price, Owner
  const [ascending, setAscending] = useState<boolean>(true);
  const [itemFilter, setItemFilter] = useState<Item>(NullItem); // item index
  const [typeFilter, setTypeFilter] = useState<OrderType>('Buy');

  return (
    <Container isVisible={tab === `Orderbook`}>
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
      />
      <Offers
        actions={{ executeTrade }}
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
