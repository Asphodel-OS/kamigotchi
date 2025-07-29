import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Dispatch } from 'react';
import styled from 'styled-components';

import { Account, Inventory } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActionComponent } from 'network/systems';
import { ConfirmationData } from '../library/Confirmation';
import { TabType } from '../types';
import { Create } from './create/Create';
import { Offers } from './offers/Offers';

export const Management = ({
  actions,
  controls,
  data,
  types,
  utils,
  isVisible,
}: {
  actions: {
    createTrade: (
      wantItems: Item[],
      wantAmts: number[],
      haveItems: Item[],
      haveAmts: number[]
    ) => EntityID | void;
    executeTrade: (trade: Trade) => void;
    completeTrade: (trade: Trade) => void;
    cancelTrade: (trade: Trade) => void;
  };
  controls: {
    tab: TabType;
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
  };
  data: {
    account: Account;
    currencies: Item[];
    inventory: Inventory[];
    items: Item[]; // all tradable items
    trades: Trade[];
  };
  types: {
    ActionComp: ActionComponent;
  };
  utils: {
    entityToIndex: (id: EntityID) => EntityIndex;
    getAllItems: () => Item[];
    getItemByIndex: (index: number) => Item;
  };
  isVisible: boolean;
}) => {

  return (
    <Content isVisible={isVisible}>
      <Create actions={actions} controls={controls} data={data} types={types} utils={utils} />
      <Offers actions={actions} controls={controls} data={data} utils={utils} />
    </Content>
  );
};

const Content = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;

  user-select: none;
`;
