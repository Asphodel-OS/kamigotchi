import { EntityID, EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Overlay } from 'app/components/library';
import { Inventory } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActionComponent } from 'network/systems';
import { useState } from 'react';
import { Confirmation } from './Confirmation';
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
    items: Item[]; // all tradable items
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmContent, setConfirmContent] = useState<React.ReactNode>(<></>);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => null);
  const [confirmTitle, setConfirmTitle] = useState<string>('');

  return (
    <Content isVisible={isVisible}>
      <Overlay fullHeight fullWidth>
        <Confirmation
          title={confirmTitle}
          controls={{ isOpen: isConfirming, close: () => setIsConfirming(false) }}
          onConfirm={confirmAction}
        >
          {confirmContent}
        </Confirmation>
      </Overlay>
      <Create
        actions={actions}
        controls={{
          isConfirming,
          setIsConfirming,
          setConfirmTitle,
          setConfirmContent,
          setConfirmAction,
        }}
        data={data}
        types={types}
        utils={utils}
      />
      <Offers actions={actions} data={data} />
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
