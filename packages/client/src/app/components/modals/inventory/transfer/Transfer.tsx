import { EntityID, EntityIndex } from '@mud-classic/recs';
import { BigNumber } from 'ethers';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import {
  EmptyText,
  IconButton,
  IconListButton,
  IconListButtonOption,
} from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { MenuIcons } from 'assets/images/icons/menu';
import { getKamidenClient } from 'clients/kamiden';
import { ItemTransfer, ItemTransferRequest } from 'clients/kamiden/proto';
import { STONE_INDEX } from 'constants/items';
import { formatEntityID } from 'engine/utils';
import { Account } from 'network/shapes/Account';
import { Item, NullItem } from 'network/shapes/Item';
import { Mode } from '../types';
import { LineItem } from './LineItem';

const KamidenClient = getKamidenClient();

export const Transfer = ({
  actions,
  data,
  state,
  utils,
}: {
  actions: {
    sendItemsTx: (items: Item[], amts: number[], account: Account) => any;
  };
  data: {
    account: Account;
    accountEntity: EntityIndex;
    inventories: Inventory[];
  };
  state: {
    lastRefresh: number;
    mode: Mode;
    resetSend: boolean;
    setResetSend: (reset: boolean) => void;
  };
  utils: {
    getAccount: (index: EntityIndex, options?: any) => Account;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getInventoryBalance: (inventories: Inventory[], index: number) => number;
    getItem: (index: EntityIndex) => Item;
    queryAllAccounts: () => EntityIndex[];
    setSendView: (show: boolean) => void;
  };
}) => {
  const { sendItemsTx } = actions;
  const { inventories, account, accountEntity } = data;
  const { lastRefresh, mode, resetSend, setResetSend } = state;
  const { getInventoryBalance, getEntityIndex, getAccount, getItem, queryAllAccounts } = utils;
  const inventoryModalOpen = useVisibility((s) => s.modals.inventory);

  const [amt, setAmt] = useState<number>(1);
  const [item, setItem] = useState<Item>(NullItem);
  const [visible, setVisible] = useState(false);
  const [targetAcc, setTargetAcc] = useState<Account | null>(null);
  const [sendHistory, setSendHistory] = useState<ItemTransfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const stone = () => {
    const candidate = inventories.find((inv) => inv.item.index === STONE_INDEX);
    return candidate?.item ?? NullItem;
  };

  /////////////////
  // SUBSCRIPTIONS

  // set the item to stone if inventories or items update
  useEffect(() => {
    if (item === NullItem) setItem(stone());
  }, [inventories, item]);

  // Reset the values when the send view is closed
  useEffect(() => {
    if (resetSend) {
      resetSelections();
      setResetSend(false);
    }
  }, [resetSend]);

  // delays the visibility toggle of the send modal to account for animation time
  useEffect(() => {
    const id = setTimeout(() => setVisible(mode === 'TRANSFER'), 200);
    return () => clearTimeout(id);
  }, [mode]);

  // retrieve the list of Account options and get send history
  useEffect(() => {
    if (!inventoryModalOpen) return;
    const accountEntities = queryAllAccounts() as EntityIndex[];
    if (accountEntities.length > accounts.length) {
      const filtered = accountEntities.filter((entity) => entity != accountEntity);
      const newAccounts = filtered.map((entity) => getAccount(entity));
      const accountsSorted = newAccounts.sort((a, b) => a.name.localeCompare(b.name));
      setAccounts(accountsSorted);
    }
    setSendEvents(account.id);
  }, [inventoryModalOpen, lastRefresh, accountEntity]);

  /////////////////
  // GETTERS

  // get the send history from Kamiden
  async function setSendEvents(accountId: string) {
    const parsedAccountId = BigInt(accountId).toString();
    try {
      const request: ItemTransferRequest = {
        AccountID: parsedAccountId,
        //  Timestamp: '0',
      };
      const response = await KamidenClient?.getItemTransfers(request);
      setSendHistory(response?.Transfers || []);
    } catch (error) {
      console.error('Error getting send history :', error);
      throw error;
    }
  }

  // get the history of items sent
  const getSendHistory = useMemo(() => {
    const transfers: JSX.Element[] = [];
    sendHistory.forEach((send, index) => {
      const senderID = formatEntityID(BigNumber.from(send.SenderAccountID));
      const receiverID = formatEntityID(BigNumber.from(send.RecvAccountID));
      const sender = getAccount(getEntityIndex(senderID));
      const receiver = getAccount(getEntityIndex(receiverID));
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
  }, [sendHistory, account.id, getAccount, getEntityIndex, getItem]);

  // gets filtered item options
  const getItemOptions = useMemo(
    () => (): IconListButtonOption[] => {
      const sorted = [...inventories]
        .filter((inven) => inven.item.is.tradeable)
        .sort((a, b) => a.item.name.localeCompare(b.item.name));
      return sorted.map((inv: Inventory) => {
        return {
          text: inv.item.name,
          image: inv.item.image,
          onClick: () => setItem(inv.item),
        };
      });
    },
    [inventories, item]
  );

  const updateItemAmt = (event: ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const min = 0;
    const max = getInventoryBalance(inventories, item.index);
    const amt = Math.max(min, Math.min(max, rawQuantity));

    setAmt(amt);
  };

  ///////////////////
  // HANDLERS

  // reset the inputs
  const resetSelections = () => {
    setItem(stone());
    setAmt(1);
    setTargetAcc(null);
  };

  // send the selected item to the target account
  const handleSend = ([item]: Item[], [amt]: number[], targetAcc: Account | null) => {
    if (!targetAcc || !amt || !item) return;
    sendItemsTx([item], [amt], targetAcc);
  };

  /////////////////
  // DISPLAY

  const SendButton = (item: Item[]) => {
    const options = accounts.map((targetAcc) => ({
      text: `${targetAcc.name} (#${targetAcc.index})`,
      onClick: () => setTargetAcc(targetAcc),
    }));

    return (
      <IconListButton
        img={MenuIcons.operator}
        options={options}
        searchable
        scale={2.8}
        tooltipProps={{ text: [`Send ${item[0].name} to another account.`] }}
      />
    );
  };

  return (
    <Container isVisible={visible} key='send'>
      <Top>
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
        {SendButton([item])}
      </Top>
      <Bottom>
        <Title>Your Transfer History</Title>
        {getSendHistory}
      </Bottom>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? `flex` : `none`)};
  flex-direction: column;
  width: 100%;
  min-height: 30vh;
  max-height: 40vh;
  font-size: 0.75vw;
`;

const Top = styled.div`
  width: 100%;
  padding: 0.6vw;
  gap: 2vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
`;

const Bottom = styled.div`
  border-top: 0.15vw solid black;
  width: 100%;
  gap: 0.3vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;

  overflow-y: auto;
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
