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
import { Offers as OffersTable } from '../orderbook/offers/Offers';

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
      <Top>
        <Create actions={actions} controls={controls} data={data} types={types} utils={utils} />
      </Top>
      <Bottom>
        <OffersTable
          actions={{ executeTrade: actions.executeTrade, cancelTrade: actions.cancelTrade as any }}
          controls={{ sort: 'Total', setSort: () => {}, ascending: true, setAscending: () => {}, itemFilter: { index: 0 } as any, typeFilter: 'All' as any, isConfirming: false, itemSearch: '', setIsConfirming: () => {}, setConfirmData: controls.setConfirmData }}
          data={{ account: data.account, trades: data.trades }}
          utils={{ getItemByIndex: utils.getItemByIndex }}
          extraFilter={(t) => t.maker?.entity === data.account.entity}
          filtersEnabled={false}
          showMakerOffer
          deleteEnabled
        />
      </Bottom>
    </Content>
  );
};

const Content = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  display: ${({ isVisible }) => (isVisible ? 'grid' : 'none')};
  grid-template-rows: min-content 1fr;
  grid-template-columns: 1fr;
  user-select: none;
`;

const Top = styled.div`
  grid-row: 1;
`;

const Bottom = styled.div`
  grid-row: 2;
  display: flex;
  height: 100%;
  & > div { /* OffersTable Container */
    width: 100% !important;
  }
  padding: 0; /* ensure table fits container without extra padding */
`;
