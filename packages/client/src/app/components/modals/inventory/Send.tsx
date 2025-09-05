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
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { MenuIcons } from 'assets/images/icons/menu';
import { getKamidenClient } from 'clients/kamiden';
import { ItemTransfer, ItemTransferRequest } from 'clients/kamiden/proto';
import { STONE_INDEX } from 'constants/items';
import { formatEntityID } from 'engine/utils';
import { Account } from 'network/shapes/Account';
import { Item, NullItem } from 'network/shapes/Item';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { LineItem } from '../trading/management/create/LineItem';

const KamidenClient = getKamidenClient();

export const Send = ({
  actions,
  data,
  utils,
}: {
  actions: {
    sendItemsTx: (items: Item[], amts: number[], account: Account) => any;
  };
  data: {
    account: Account;
    accountEntity: EntityIndex;
    inventories: Inventory[];
    sendView: boolean;
    lastRefresh: number;
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
  const { sendView, inventories, account, accountEntity, lastRefresh, resetSend, setResetSend } =
    data;
  const { getInventoryBalance, getEntityIndex, getAccount, getItem, queryAllAccounts } = utils;

  const [amt, setAmt] = useState<number>(1);
  const [item, setItem] = useState<Item>(NullItem);
  const [visible, setVisible] = useState(false);
  const [targetAcc, setTargetAcc] = useState<Account | null>(null);
  const [sendHistory, setSendHistory] = useState<ItemTransfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const { modals } = useVisibility();

  const stone = () =>
    inventories.find((inventory) => inventory.item.index === STONE_INDEX)?.item ?? NullItem;

  /////////////////
  // SUBSCRIPTIONS
  useEffect(() => {
    if (item === NullItem) {
      setItem(stone());
    }
  }, [inventories, item]);

  useEffect(() => {
    if (!sendView) {
      // Reset the values when the send view is closed
      resetSelections();
    }
  }, [sendView]);

  useEffect(() => {
    const id = setTimeout(() => setVisible(sendView), 300);
    return () => clearTimeout(id);
  }, [sendView]);

  useEffect(() => {
    if (resetSend) {
      resetSelections();
      setResetSend(false);
    }
  }, [resetSend]);

  // show list of account to send items
  // and get send history
  useEffect(() => {
    if (!modals.inventory) return;
    // check if we need to update the list of accounts
    const accountEntities = queryAllAccounts() as EntityIndex[];
    if (accountEntities.length > accounts.length) {
      const filtered = accountEntities.filter((entity) => entity != accountEntity);
      const newAccounts = filtered.map((entity) => getAccount(entity));
      const accountsSorted = newAccounts.sort((a, b) => a.name.localeCompare(b.name));
      setAccounts(accountsSorted);
    }
    getSendHistoryKamiden(account.id);
  }, [modals.inventory, lastRefresh, accountEntity]);

  /////////////////
  // GETTERS

  // get the send history from Kamiden
  async function getSendHistoryKamiden(accountId: string) {
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
  }, [sendHistory, account.id, getAccount, getEntityIndex, getItem]);

  // gets filtered item options
  const getItemOptions = useMemo(
    () => (): IconListButtonOption[] => {
      const sorted = [...inventories].sort((a, b) => a.item.name.localeCompare(b.item.name));
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
  const resetSelections = () => {
    setItem(stone());
    setAmt(1);
    setTargetAcc(null);
  };

  const handleSend = ([item]: Item[], [amt]: number[], targetAcc: Account | null) => {
    if (!targetAcc || !amt || !item) return;
    const sendAction = sendItemsTx([item], [amt], targetAcc);
  };

  /////////////////
  // DISPLAY
  const SendButton = (item: Item[]) => {
    const options = accounts.map((targetAcc) => ({
      text: `${targetAcc.name} (#${targetAcc.index})`,
      onClick: () => setTargetAcc(targetAcc),
    }));

    return (
      <TextTooltip key='send-tooltip' text={[`Send ${item[0].name} to another account.`]}>
        <IconListButton img={MenuIcons.operator} options={options} searchable scale={2.8} />
      </TextTooltip>
    );
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
          {SendButton([item])}
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
