import { EntityID, EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Inventory } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActionComponent } from 'network/systems';
import { Create } from './Create';
import { Offers } from './Offers';

interface Props {
  actions: {
    cancelTrade: (trade: Trade) => void;
    createTrade: (
      buyItem: Item,
      buyAmt: number,
      sellItem: Item,
      sellAmt: number
    ) => EntityID | void;
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

  return (
    <Content isVisible={isVisible}>
      <Create actions={actions} data={data} types={types} utils={utils} />
      <Offers actions={actions} data={data} />
    </Content>
  );
};

const Content = styled.div<{ isVisible: boolean }>`
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;

  user-select: none;
`;
