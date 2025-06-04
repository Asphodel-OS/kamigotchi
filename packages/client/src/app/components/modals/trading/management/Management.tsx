import { EntityID, EntityIndex } from '@mud-classic/recs';
import { BigNumberish } from 'ethers';
import { useState } from 'react';
import styled from 'styled-components';

import { Inventory } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActionComponent } from 'network/systems';
import { Create } from './Create';
import { Offers } from './Offers';

interface Props {
  actions: {
    cancelTrade: (tradeId: BigNumberish) => void;
    createTrade: (
      buyItem: Item,
      buyAmt: number,
      sellItem: Item,
      sellAmt: number
    ) => EntityID | void;
    executeTrade: (tradeId: BigNumberish) => void;
  };
  data: {
    currencies: Item[];
    inventories: Inventory[];
    items: Item[];
    musuBalance: number;
    trades: Trade[];
  };
  types: {
    ActionComp: ActionComponent;
  };
  utils: {
    entityToIndex: (id: EntityID) => EntityIndex;
    getInventories: () => {
      id: EntityID;
      entity: EntityIndex;
      balance: number;
      item: Item;
    }[];
    getAllItems: () => Item[];
  };
  isVisible: boolean;
}

export const Management = (props: Props) => {
  const { isVisible, actions, data, types, utils } = props;
  const { items, inventories, currencies } = data;
  const [ascending, setAscending] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('Price \u0245');
  const [search, setSearch] = useState<string>('');

  return (
    <Content isVisible={isVisible}>
      <Create actions={actions} data={data} types={types} utils={utils} />
      <Offers actions={actions} data={data} controls={{ ascending, search }} />
      {/* <Offers
        actions={actions}
        data={{ ...data, trades: sampleTrades }}
        controls={{ ascending, search }}
      /> */}
    </Content>
  );
};

const Content = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: row;
  align-items: flex-start;
  height: 100%;
  justify-content: space-between;
`;
