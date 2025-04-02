import { EntityID, EntityIndex } from '@mud-classic/recs';

import { BigNumberish } from 'ethers';
import { NetworkLayer } from 'network/create';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import styled from 'styled-components';
import { ActiveOffers } from './ActiveOffers';
import { CreateOffer } from './CreateOffer';

interface Props {
  network: NetworkLayer;
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
  search: string;
  ascending: boolean;
  data: { accountEntity: EntityIndex };
  trades: Trade[];
  executeTrade: (tradeId: BigNumberish) => void;
  cancelTrade: (tradeId: BigNumberish) => void;
  createTrade: (
    buyIndices: Number,
    buyAmts: BigNumberish,
    sellIndices: Number,
    sellAmts: BigNumberish
  ) => EntityID;
}
export const ManagementTab = (props: Props) => {
  const {
    network,
    utils,
    search,
    ascending,
    data,
    trades,
    executeTrade,
    cancelTrade,
    createTrade,
  } = props;

  return (
    <Content>
      <CreateOffer network={network} utils={utils} createTrade={createTrade} />
      <Divider />
      <ActiveOffers
        data={data}
        trades={trades}
        ascending={ascending}
        search={search}
        executeTrade={executeTrade}
        cancelTrade={cancelTrade}
        managementTab={true}
      />
    </Content>
  );
};

const Content = styled.div`
  display: flex;
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
