import { EntityID, EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Overlay } from 'app/components/library';
import { Account } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { Trade } from 'network/shapes/Trade/types';
import { ActionComponent } from 'network/systems';
import { useState } from 'react';
import { Confirmation, ConfirmationData } from '../Confirmation';
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
  const { isVisible, actions, data, types, utils } = props;
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmData, setConfirmData] = useState<ConfirmationData>({
    content: <></>,
    onConfirm: () => null,
  });

  return (
    <Content isVisible={isVisible}>
      <Overlay fullHeight fullWidth>
        <Confirmation
          title={confirmData.title}
          subTitle={confirmData.subTitle}
          controls={{ isOpen: isConfirming, close: () => setIsConfirming(false) }}
          onConfirm={confirmData.onConfirm}
        >
          {confirmData.content}
        </Confirmation>
      </Overlay>
      <Create
        actions={actions}
        controls={{
          isConfirming,
          setIsConfirming,
          setConfirmData,
        }}
        data={data}
        types={types}
        utils={utils}
      />
      <Offers
        actions={actions}
        controls={{
          isConfirming,
          setIsConfirming,
          setConfirmData,
        }}
        data={data}
        utils={utils}
      />
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
