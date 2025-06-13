import { EntityID, EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Account } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActionComponent } from 'network/systems';
import { Dispatch } from 'react';
import { ConfirmationData } from '../Confirmation';
import { TabType } from '../types';
import { Create } from './Create';
import { Offers } from './offers/Offers';

interface Props {
  actions: {
    createTrade: (
      buyItem: Item,
      buyAmt: number,
      sellItem: Item,
      sellAmt: number
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
}

export const Management = (props: Props) => {
  const { isVisible, actions, controls, data, types, utils } = props;

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
