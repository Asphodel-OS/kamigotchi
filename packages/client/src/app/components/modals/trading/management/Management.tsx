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
    createTrade: (buyItem: Item, buyAmt: number, sellItem: Item, sellAmt: number) => EntityID;
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

  const [ascending, setAscending] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('Price \u0245');
  const [search, setSearch] = useState<string>('');

  return (
    <Content isVisible={isVisible}>
      <Create actions={actions} data={data} types={types} utils={utils} />
      <Divider />
      <Offers actions={actions} data={data} controls={{ ascending, search }} />
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

const Divider = styled.div`
  border: 0.1vw solid black;
  height: 100%;
  margin: 0 0.8vw 0 0;
`;
