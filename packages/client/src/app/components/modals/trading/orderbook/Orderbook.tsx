import { EntityIndex } from '@mud-classic/recs';
import { BigNumberish } from 'ethers';
import { useState } from 'react';
import styled from 'styled-components';

import { Item, NullItem } from 'network/shapes';
import { Trade } from 'network/shapes/Trade/types';
import { OrderType } from '../types';
import { ActiveOffers } from './ActiveOffers';
import { Controls } from './Controls';

interface Props {
  actions: {
    executeTrade: (tradeId: BigNumberish) => void;
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

  const [ascending, setAscending] = useState<boolean>(true);
  const [sort, setSort] = useState<string>('Price'); // None, Price, Owner
  const [search, setSearch] = useState<string>('');

  const [itemFilter, setItemFilter] = useState<Item>(NullItem); // item index
  const [type, setType] = useState<OrderType>('Buy');

  return (
    <Container isVisible={tab === `Orderbook`}>
      <Controls
        controls={{
          type,
          setType,
          sort,
          setSort,
          ascending,
          setAscending,
          itemFilter,
          setItemFilter,
        }}
        data={data}
      />
      <ActiveOffers
        actions={{
          executeTrade,
        }}
        data={data}
        controls={{ ascending, search }}
        managementTab={false}
      />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row nowrap;
`;
