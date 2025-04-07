import { EntityID, EntityIndex } from '@mud-classic/recs';
import { BigNumberish } from 'ethers';
import { useState } from 'react';
import styled from 'styled-components';

import { NetworkLayer } from 'network/create';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActiveOffers } from '../ActiveOffers';
import { CreateOffer } from './CreateOffer';

interface Props {
  actions: {
    executeTrade: (tradeId: BigNumberish) => void;
    cancelTrade: (tradeId: BigNumberish) => void;
    createTrade: (
      buyIndices: Number,
      buyAmts: BigNumberish,
      sellIndices: Number,
      sellAmts: BigNumberish
    ) => EntityID;
  };
  data: { accountEntity: EntityIndex; trades: Trade[] };
  utils: {
    getInventories: () => {
      id: EntityID;
      entity: EntityIndex;
      balance: number;
      item: Item;
    }[];
    getAllItems: () => Item[];
    getMusuBalance: () => number;
  };
  network: NetworkLayer;
  isVisible: boolean;
}

export const ManagementTab = (props: Props) => {
  const { isVisible, actions, data, network, utils } = props;
  const { createTrade } = actions;

  const [ascending, setAscending] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('Price \u0245');
  const [search, setSearch] = useState<string>('');

  return (
    <Content isVisible={isVisible}>
      <CreateOffer network={network} utils={utils} createTrade={createTrade} />
      <Divider />
      <ActiveOffers
        actions={actions}
        data={data}
        controls={{ ascending, search }}
        managementTab={true}
      />
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
