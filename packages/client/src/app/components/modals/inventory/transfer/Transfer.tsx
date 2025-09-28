import { EntityID, EntityIndex } from '@mud-classic/recs';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import { IconButton, IconListButton, IconListButtonOption } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { MenuIcons } from 'assets/images/icons/menu';
import { getKamidenClient } from 'clients/kamiden';
import { ItemTransfer, ItemTransferRequest } from 'clients/kamiden/proto';
import { STONE_INDEX } from 'constants/items';
import { Account } from 'network/shapes/Account';
import { Item, NullItem } from 'network/shapes/Item';
import { Mode } from '../types';
import { History } from './History';
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
    tick: number;
    mode: Mode;
    resetSend: boolean;
    setResetSend: (reset: boolean) => void;
  };
  utils: {
    getAccount: (index: EntityIndex, options?: any) => Account;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getBalance: (inventories: Inventory[], index: number) => number;
    getItem: (index: EntityIndex) => Item;
    queryAllAccounts: () => EntityIndex[];
  };
}) => {
  const { sendItemsTx } = actions;
  const { inventories, account, accountEntity } = data;
  const { tick, mode, resetSend, setResetSend } = state;
  const { getBalance, getEntityIndex, getAccount, getItem, queryAllAccounts } = utils;
  const inventoryModalOpen = useVisibility((s) => s.modals.inventory);

  const [amt, setAmt] = useState<number>(1);
  const [item, setItem] = useState<Item>(NullItem);
  const [visible, setVisible] = useState(false);
  const [targetAcc, setTargetAcc] = useState<Account | null>(null);
  const [history, setHistory] = useState<ItemTransfer[]>([]);
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

  // updates transfer history
  useEffect(() => {
    setTransferEvents(account.id);
  }, [accountEntity, resetSend, mode]);

  // reset form values when a reset update is triggered
  useEffect(() => {
    if (resetSend) {
      setItem(stone());
      setAmt(1);
      setTargetAcc(null);
      setResetSend(false);
    }
  }, [resetSend]);

  // delays the visibility toggle of the send modal to account for animation time
  useEffect(() => {
    const id = setTimeout(() => setVisible(mode === 'TRANSFER'), 200);
    return () => clearTimeout(id);
  }, [mode]);

  // retrieve the list of Account options and set the send history
  useEffect(() => {
    if (!inventoryModalOpen) return;
    const accountEntities = queryAllAccounts() as EntityIndex[];
    if (accountEntities.length > accounts.length) {
      const filtered = accountEntities.filter((entity) => entity != accountEntity);
      const newAccounts = filtered.map((entity) => getAccount(entity));
      const accountsSorted = newAccounts.sort((a, b) => a.name.localeCompare(b.name));
      setAccounts(accountsSorted);
    }
  }, [inventoryModalOpen, tick, accountEntity]);

  /////////////////
  // GETTERS

  // get the send history from Kamiden
  async function setTransferEvents(accID: string) {
    const parsedAccountId = BigInt(accID).toString();
    try {
      const request: ItemTransferRequest = {
        AccountID: parsedAccountId,
        //  Timestamp: '0',
      };
      const response = await KamidenClient?.getItemTransfers(request);
      setHistory((response?.Transfers ?? []).slice().reverse());
    } catch (error) {
      console.error('Error getting send history :', error);
      throw error;
    }
  }

  ///////////////////
  // HANDLERS

  // validate and clean the amount of items to send
  const handleAmtChange = (event: ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const max = getBalance(inventories, item.index);
    const amt = Math.max(0, Math.min(max, rawQuantity));
    setAmt(amt);
  };

  // send the selected item to the target account
  const handleSend = (item: Item, amt: number, targetAcc: Account) => {
    if (!targetAcc || !amt || !item) return;
    sendItemsTx([item], [amt], targetAcc);
  };

  /////////////////
  // DISPLAY

  // gets filtered item options
  const ItemOptions = useMemo(() => {
    const sorted = [...inventories]
      .filter((inven) => inven.item.is.tradeable)
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
    return sorted.map((inv: Inventory) => {
      return {
        text: inv.item.name,
        image: inv.item.image,
        onClick: () => setItem(inv.item),
      } as IconListButtonOption;
    });
  }, [inventories, item]);

  /////////////////
  // RENDER

  return (
    <Container isVisible={visible} key='send'>
      <Top>
        <LineItem
          options={ItemOptions}
          selected={item}
          amt={amt}
          setAmt={(e) => handleAmtChange(e)}
          reverse
        />
        <IconButton
          img={ArrowIcons.right}
          scale={2}
          onClick={() => targetAcc && handleSend(item, amt, targetAcc)}
          disabled={!targetAcc || !amt || !item}
        />
        <IconListButton
          img={MenuIcons.operator}
          options={accounts.map((targetAcc) => ({
            text: `${targetAcc.name} (#${targetAcc.index})`,
            onClick: () => setTargetAcc(targetAcc),
          }))}
          searchable
          scale={2.8}
          tooltip={{ text: [`Send ${item.name} to another account.`] }}
        />
      </Top>
      <History
        data={{ account, events: history }}
        state={{ mode }}
        utils={{ getAccount, getEntityIndex, getItem }}
      />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  display: ${({ isVisible }) => (isVisible ? `flex` : `none`)};
  flex-direction: column;
  width: 100%;
  height: 30vh;
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
