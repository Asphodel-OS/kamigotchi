import { EntityID, EntityIndex } from '@mud-classic/recs';
import { BigNumber } from 'ethers';
import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import {
  EmptyText,
  IconButton,
  IconListButton,
  IconListButtonOption,
  TextTooltip,
} from 'app/components/library';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { MenuIcons } from 'assets/images/icons/menu';
import { ItemTransfer } from 'clients/kamiden/proto';
import { MUSU_INDEX, STONE_INDEX } from 'constants/items';
import { formatEntityID } from 'engine/utils';
import { items } from 'network/explorer/items';
import { Account } from 'network/shapes/Account';
import { Item, NullItem } from 'network/shapes/Item';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { mode } from 'viem/chains';
import { LineItem } from '../trading/management/create/LineItem';

interface Props {
  actions: { sendItemsTx: (items: Item[], amts: number[], account: Account) => void };
  data: {
    account: Account;
    sendView: boolean;
    accounts: Account[];
    inventory: Inventory[];
    sendHistory: ItemTransfer[];
  };
  utils: {
    setSendView: (show: boolean) => void;
    getInventoryBalance: (inventories: Inventory[], index: number) => number;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getAccount: (index: EntityIndex) => Account;
    getItem: (index: EntityIndex) => Item;
  };
}

export const Send = (props: Props) => {
  const { actions, data, utils } = props;
  const { sendView, accounts, inventory, sendHistory, account } = data;
  const { getInventoryBalance, getEntityIndex, getAccount, getItem } = utils;
  const { sendItemsTx } = actions;

  const [amt, setAmt] = useState<number>(1);
  const [item, setItem] = useState<Item>(NullItem);
  const [visible, setVisible] = useState(false);
  const [targetAcc, setTargetAcc] = useState<Account | null>(null);

  const stone = () =>
    inventory.find((inventory) => inventory.item.index === STONE_INDEX)?.item ?? NullItem;

  useEffect(() => {
    setItem(stone());
  }, [inventory.length]);

  const getSendTooltip = (item: Item) => {
    const tooltip = [`Send ${item.name} to another account.`];
    return tooltip;
  };

  useEffect(() => {
    if (!sendView) {
      // Reset the values when the send view is closed
      setItem(stone());
      setAmt(1);
      setTargetAcc(null);
    }
  }, [sendView]);

  useEffect(() => {
    setTimeout(() => {
      setVisible(sendView);
    }, 300);
  }, [sendView]);

  const getSendHistory = useMemo(() => {
    const transfers: JSX.Element[] = [];
    sendHistory.forEach((send, index) => {
      const sender = getAccount(
        getEntityIndex(formatEntityID(BigNumber.from(send.SenderAccountID)))
      );
      const receiver = getAccount(
        getEntityIndex(formatEntityID(BigNumber.from(send.RecvAccountID)))
      );
      const item = getItem(send.ItemIndex as EntityIndex);
      if (receiver.id === account.id) {
        transfers.push(
          <div key={`receiver-${index}`}>
            * You <span style={{ color: 'green' }}>received</span> {send?.Amount} {item?.name} from{' '}
            {sender?.name}
          </div>
        );
      } else if (sender.id === account.id) {
        transfers.push(
          <div key={`sender-${index}`}>
            * You <span style={{ color: 'red' }}>sent</span> {send?.Amount} {item?.name} to{' '}
            {receiver?.name}
          </div>
        );
      }
    });
    if (transfers.length === 0) {
      return <EmptyText text={['No transfers to show.']} />;
    } else {
      return transfers.reverse();
    }
  }, [sendHistory, account, inventory]);

  // adjust and clean the Want amounts in the trade offer in respoonse to a form change
  const updateItemAmt = (event: ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const min = 0;
    const max = getInventoryBalance(inventory, item.index);
    const amt = Math.max(min, Math.min(max, rawQuantity));

    setAmt(amt);
  };

  const getItemOptions = useMemo(
    () => (): IconListButtonOption[] => {
      /// for sells we have to check the inventory
      const filtered = inventory.filter((inv: Inventory) => {
        if (!inv || !inv.item) return false;
        const isTradeable = inv.item.is.tradeable;
        const hasBalance = inv.balance > 0;
        const unused = item !== inv.item;
        const notCurrency = inv.item.index !== MUSU_INDEX;
        return isTradeable && hasBalance && unused && notCurrency;
      });

      const sorted = filtered.sort((a, b) => a.item.name.localeCompare(b.item.name));

      return sorted.map((inv: Inventory) => {
        return {
          text: inv.item.name,
          image: inv.item.image,
          onClick: () => setItem(inv.item),
        };
      });
    },
    [mode, items.length, inventory.length]
  );

  const SendButton = (item: Item[], amts: number[]) => {
    const options = accounts.map((targetAcc) => ({
      text: `${targetAcc.name} (#${targetAcc.index})`,
      onClick: () => setTargetAcc(targetAcc),
    }));

    return (
      <TextTooltip key='send-tooltip' text={getSendTooltip(item[0])}>
        <IconListButton img={MenuIcons.operator} options={options} searchable scale={2.8} />
      </TextTooltip>
    );
  };

  const handleSend = ([item]: Item[], [amt]: number[], targetAcc: Account | null) => {
    if (!targetAcc || !amt || !item) return;
    sendItemsTx([item], [amt], targetAcc);
    setAmt(1);
    setItem(stone());
    setTargetAcc(null);
  };

  return (
    <Container isVisible={visible} key='send'>
      <Column side={`top`}>
        <Row>
          <LineItem
            options={getItemOptions()}
            selected={item}
            amt={amt}
            setAmt={(e) => updateItemAmt(e)}
            reverse
          />
          <IconButton
            img={ArrowIcons.right}
            scale={2}
            onClick={() => targetAcc && handleSend([item], [amt], targetAcc)}
            disabled={!targetAcc || !amt || !item}
          />
          {SendButton([item], [amt])}
        </Row>
      </Column>
      <Column side={`bottom`}>
        <Title>Your Transfer History</Title>
        {getSendHistory}
      </Column>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex; ` : `display: none;`)}
  flex-direction: column;
  width: 100%;
  min-height: 30vh;
  max-height: 40vh;
  font-size: 0.75vw;
`;

const Row = styled.div`
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  gap: 2vw;
`;

const Column = styled.div<{ side: 'top' | 'bottom' }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.3vw;

  ${({ side }) =>
    side === 'bottom' &&
    `    border-top: 0.15vw solid black;    
        overflow-y: auto; 
        align-items: flex-start;
        justify-content: flex-start;
      `}
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;
  margin-bottom: 0.2vw;
  padding: 1vw;
  opacity: 0.9;
  color: black;
  font-size: 0.8vw;
  text-align: left;
  z-index: 2;
  height: 3vw;
`;
