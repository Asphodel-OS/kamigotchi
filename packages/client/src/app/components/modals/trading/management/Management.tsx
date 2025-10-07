import { EntityID, EntityIndex } from 'engine/recs';
import { Dispatch, useCallback, useState } from 'react';
import styled from 'styled-components';

import { Account, Inventory } from 'network/shapes';
import { Item, NullItem } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActionComponent } from 'network/systems';
import { ConfirmationData } from '../library/Confirmation';
import { Offers as OffersTable } from '../orderbook/offers/Offers';
import { TabType } from '../types';
import { Create } from './create/Create';

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
    items: Item[];
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
  const [sort, setSort] = useState<string>('Total');
  const [ascending, setAscending] = useState<boolean>(true);
  const [itemFilter] = useState<Item>(NullItem);
  const [typeFilter] = useState<string>('All');
  const [itemSearch] = useState<string>('');

  const setSortCb = useCallback((value: string) => setSort(value), []);
  const setAscendingCb = useCallback((value: boolean) => setAscending(value), []);
  const makerFilter = useCallback(
    (t: Trade) => t.maker?.entity === data.account.entity,
    [data.account.entity]
  );

  return (
    <Container isVisible={isVisible}>
      <Top>
        <Create actions={actions} controls={controls} data={data} types={types} utils={utils} />
      </Top>
      <Bottom>
        <OffersTable
          actions={{
            executeTrade: actions.executeTrade,
            cancelTrade: actions.cancelTrade,
            completeTrade: actions.completeTrade,
          }}
          controls={{
            sort,
            setSort: setSortCb,
            ascending,
            setAscending: setAscendingCb,
            itemFilter,
            typeFilter,
            isConfirming: controls.isConfirming,
            itemSearch,
            setIsConfirming: controls.setIsConfirming,
            setConfirmData: controls.setConfirmData,
          }}
          data={{ account: data.account, trades: data.trades }}
          utils={{ getItemByIndex: utils.getItemByIndex }}
          extraFilter={makerFilter}
          filtersEnabled={false}
          showMakerOffer
          deleteEnabled
        />
      </Bottom>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: column;
  user-select: none;
`;

const Top = styled.div`
  flex: 0 0 auto;
`;

const Bottom = styled.div`
  flex: 1 1 auto;
  display: flex;
  height: 100%;
  & > div {
    width: 100% !important;
  }
  padding: 0;
`;
