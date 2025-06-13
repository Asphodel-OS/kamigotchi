import { useState } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { Account, Item, NullItem } from 'network/shapes';
import { ConfirmationData } from '../Confirmation';
import { Controls } from './Controls';
import { Offers } from './offers/Offers';

interface Props {
  actions: {
    cancelTrade: (trade: Trade) => void;
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    tab: string;
  };
  data: {
    account: Account;
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
  const [typeFilter, setTypeFilter] = useState<TradeType>('Buy');
  const [confirmData, setConfirmData] = useState<ConfirmationData>({
    content: <></>,
    onConfirm: () => null,
  });

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
