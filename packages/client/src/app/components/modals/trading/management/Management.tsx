import { EntityID, EntityIndex } from '@mud-classic/recs';
import { BigNumberish } from 'ethers';
import { useState } from 'react';
import styled from 'styled-components';

import { NetworkLayer } from 'network/create';
import { Inventory } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActionComponent } from 'network/systems';
import { CreateOffer } from './CreateOffer';
import { Offers } from './Offers';

interface Props {
  actions: {
    cancelTrade: (tradeId: BigNumberish) => void;
    createTrade: (
      buyIndices: Number,
      buyAmts: BigNumberish,
      sellIndices: Number,
      sellAmts: BigNumberish
    ) => EntityID;
    executeTrade: (tradeId: BigNumberish) => void;
  };
  data: {
    accountEntity: EntityIndex;
    musuBalance: number;
    inventories: Inventory[];
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
  network: NetworkLayer;
  isVisible: boolean;
}

export const Management = (props: Props) => {
  const { isVisible, actions, data, types, utils } = props;

  const [ascending, setAscending] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('Price \u0245');
  const [search, setSearch] = useState<string>('');

  return (
    <Content isVisible={isVisible}>
      <CreateOffer actions={actions} data={data} types={types} utils={utils} />
      <Divider />
      <Offers actions={actions} data={data} controls={{ ascending, search }} managementTab={true} />
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
