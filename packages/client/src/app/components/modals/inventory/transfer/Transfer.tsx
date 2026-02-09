import { uuid } from '@mud-classic/utils';
import { EntityID, EntityIndex } from 'engine/recs';
import { ChangeEvent, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import { IconListButton, IconListButtonOption } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { MenuIcons } from 'assets/images/icons/menu';
import { getKamidenClient } from 'clients/kamiden';
import { KAMI_BASE_URI } from 'constants/media';
import { ItemTransfer, ItemTransferRequest } from 'clients/kamiden/proto';
import { MUSU_INDEX } from 'constants/items';
import { Account } from 'network/shapes/Account';
import { Item } from 'network/shapes/Item';
import { Mode } from '../types';
import { History } from './History';
import { TransferLineItem } from './TransferLineItem';

const KamidenClient = getKamidenClient();

// Maximum items allowed per batch transfer
const MAX_ITEMS = 8;
// MUSU reserve amount (leave this much when using Max)
const MUSU_RESERVE = 1000;

// Type for a transfer row
type TransferRow = {
  id: string;
  item: Item | null;
  amt: number;
};

const createInitialRows = (): TransferRow[] => {
  return [{ id: uuid(), item: null, amt: 1 }];
};

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

  const [rows, setRows] = useState<TransferRow[]>(createInitialRows);

  const [visible, setVisible] = useState(false);
  const [targetAcc, setTargetAcc] = useState<Account | null>(null);
  const [history, setHistory] = useState<ItemTransfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);

  /////////////////
  // ROW MANAGEMENT

  // Add a new row (appends to end) - max 8 items
  const addRow = () => {
    if (rows.length >= MAX_ITEMS) return;
    const newId = uuid();
    setRows((prev) => [...prev, { id: newId, item: null, amt: 1 }]);
  };

  // Remove a row by id
  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  // Update item for a row, auto-set max amount, and auto-grow if all rows filled
  const setRowItem = (id: string, item: Item) => {
    const balance = getBalance(inventories, item.index);
    // For MUSU, leave 1000 as reserve
    const maxAmt = item.index === MUSU_INDEX
      ? Math.max(0, balance - MUSU_RESERVE)
      : balance;
    setRows((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, item, amt: maxAmt } : row));
      const allFilled = updated.every((r) => r.item !== null);
      if (allFilled && updated.length < MAX_ITEMS) {
        return [...updated, { id: uuid(), item: null, amt: 1 }];
      }
      return updated;
    });
  };

  // Update amount for a row
  const setRowAmt = (id: string, amt: number) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, amt } : row)));
  };

  // Set max amount for a row (MUSU reserves 1000)
  const setRowMax = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row || !row.item) return;
    const balance = getBalance(inventories, row.item.index);
    // For MUSU, leave 1000 as reserve
    const max = row.item.index === MUSU_INDEX
      ? Math.max(0, balance - MUSU_RESERVE)
      : balance;
    setRowAmt(id, max);
  };

  // Get available items for a row (excludes items already selected in other rows)
  const getAvailableItems = (currentRowId: string): Inventory[] => {
    const selectedIndices = rows
      .filter((r) => r.id !== currentRowId && r.item)
      .map((r) => r.item!.index);
    return inventories
      .filter((inv) => inv.item.is.tradeable && !selectedIndices.includes(inv.item.index))
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  };

  // Validate all rows
  const isValid = (): boolean => {
    if (!targetAcc) return false;
    if (rows.length === 0) return false;
    const validRows = rows.filter((row) => row.item !== null);
    if (validRows.length === 0) return false;
    return validRows.every(
      (row) => row.amt > 0 && row.amt <= getBalance(inventories, row.item!.index)
    );
  };

  // Get count of valid items
  const getValidItemCount = (): number => {
    return rows.filter((row) => row.item !== null && row.amt > 0).length;
  };

  // Handle batch send
  const handleSendAll = () => {
    if (!isValid() || !targetAcc) return;
    const validRows = rows.filter((row) => row.item !== null && row.amt > 0);
    const items = validRows.map((r) => r.item!);
    const amts = validRows.map((r) => r.amt);
    sendItemsTx(items, amts, targetAcc);
  };

  /////////////////
  // SUBSCRIPTIONS

  // updates transfer history
  useEffect(() => {
    setTransferEvents(account.id);
  }, [accountEntity, resetSend, mode]);

  // reset form values when a reset update is triggered (keep recipient)
  useEffect(() => {
    if (resetSend) {
      setRows(createInitialRows());
      // Keep targetAcc as is - don't reset recipient
      setResetSend(false);
    }
  }, [resetSend]);

  // delays the visibility toggle of the send modal to account for animation time
  useEffect(() => {
    const id = setTimeout(() => setVisible(mode === 'TRANSFER'), 200);
    return () => clearTimeout(id);
  }, [mode]);

  // retrieve the list of Account options
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
      };
      const response = await KamidenClient?.getItemTransfers(request);
      setHistory((response?.Transfers ?? []).slice().reverse());
    } catch (error) {
      console.error('Error getting send history :', error);
    }
  }

  ///////////////////
  // HANDLERS

  // Handle amount change for a specific row
  const handleAmtChange = (rowId: string, event: ChangeEvent<HTMLInputElement>) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row || !row.item) return;

    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const max = getBalance(inventories, row.item.index);
    const amt = Math.max(0, Math.min(max, rawQuantity));
    setRowAmt(rowId, amt);
  };

  /////////////////
  // DISPLAY

  // Get item options for a specific row
  const getItemOptions = (rowId: string): IconListButtonOption[] => {
    const availableItems = getAvailableItems(rowId);
    return availableItems.map((inv: Inventory) => ({
      text: inv.item.name,
      image: inv.item.image,
      onClick: () => setRowItem(rowId, inv.item),
    }));
  };

  // Compute once per render
  const validItemCount = getValidItemCount();

  // Generate send button text
  const getSendButtonText = (): string => {
    if (!targetAcc) return 'Select a recipient';
    if (validItemCount === 0) return 'Add items to send';
    const itemWord = validItemCount === 1 ? 'item' : 'items';
    return `Send ${validItemCount} ${itemWord} to ${targetAcc.name}`;
  };

  /////////////////
  // RENDER

  return (
    <Container isVisible={visible} key='send'>
      {/* SECTION 1: Recipient Selection */}
      <RecipientSection>
        <RecipientLabel>Send to:</RecipientLabel>
        <IconListButton
          img={targetAcc ? `${KAMI_BASE_URI}${targetAcc.pfpURI}.gif` : MenuIcons.operator}
          options={accounts.map((acc) => ({
            text: `${acc.name} (#${acc.index})`,
            image: `${KAMI_BASE_URI}${acc.pfpURI}.gif`,
            onClick: () => setTargetAcc(acc),
          }))}
          searchable
          scale={2.4}
          tooltip={{ text: [targetAcc ? `Recipient: ${targetAcc.name}` : 'Select recipient'] }}
        />
        {targetAcc && (
          <RecipientDisplay>
            <RecipientPfp src={`${KAMI_BASE_URI}${targetAcc.pfpURI}.gif`} alt={targetAcc.name} />
            <RecipientName>{targetAcc.name}</RecipientName>
          </RecipientDisplay>
        )}
      </RecipientSection>

      {/* SECTION 2: Item Rows */}
      <RowsSection>
        {rows.length === 0 ? (
          <EmptyState>
            <AddItemButton onClick={addRow}>+ Add Item</AddItemButton>
          </EmptyState>
        ) : (
          rows.map((row) => (
            <TransferLineItem
              key={row.id}
              options={getItemOptions(row.id)}
              selected={row.item}
              amt={row.amt}
              balance={row.item ? getBalance(inventories, row.item.index) : 0}
              setAmt={(e) => handleAmtChange(row.id, e)}
              onRemove={() => removeRow(row.id)}
              onAdd={addRow}
              onMax={() => setRowMax(row.id)}
            />
          ))
        )}
      </RowsSection>

      {/* SECTION 3: Send Button + Fee */}
      <SendSection>
        <SendRow>
          <SendButton onClick={handleSendAll} disabled={!isValid()}>
            {getSendButtonText()}
          </SendButton>
          {validItemCount > 0 && (
            <FeeLabel>
              <MusuIcon src={ItemImages.musu} />
              {(15 * validItemCount).toLocaleString()}
            </FeeLabel>
          )}
        </SendRow>
      </SendSection>

      {/* SECTION 4: History (Collapsible) */}
      <History
        data={{ account, events: history }}
        state={{ mode, isCollapsed: historyCollapsed }}
        utils={{ getAccount, getEntityIndex, getItem }}
        onToggleCollapse={() => setHistoryCollapsed(!historyCollapsed)}
      />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  display: ${({ isVisible }) => (isVisible ? `flex` : `none`)};
  flex-direction: column;
  width: 100%;
  font-size: 0.75vw;
`;

const RecipientSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
  padding: 0.8vw 1vw;
  background: #f5f5f5;
  border-bottom: 0.1vw solid #ddd;
  flex-shrink: 0;
`;

const RecipientLabel = styled.span`
  font-size: 0.8vw;
  font-family: Pixel, sans-serif;
  color: #555;
`;

const RecipientDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  padding: 0.2vw 0.5vw;
  background: #e0e0e0;
  border-radius: 0.3vw;
`;

const RecipientPfp = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  border-radius: 50%;
  object-fit: cover;
  border: 0.1vw solid #999;
`;

const RecipientName = styled.span`
  font-size: 0.85vw;
  font-weight: bold;
  color: #333;
`;

const RowsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  padding: 0.8vw;
  min-height: 5vh;
  background: #fafafa;

  ::-webkit-scrollbar {
    background: transparent;
    width: 0.6vw;
  }

  ::-webkit-scrollbar-thumb {
    border: 0.15vw solid transparent;
    background-clip: padding-box;
    border-radius: 0.3vw;
    background-color: rgba(0, 0, 0, 0.15);
  }
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2vw;
  min-height: 5vh;
`;

const AddItemButton = styled.button`
  background: transparent;
  border: 0.12vw dashed #888;
  padding: 0.6vw 1.2vw;
  border-radius: 0.4vw;
  cursor: pointer;
  font-size: 0.85vw;
  font-family: Pixel, sans-serif;
  color: #666;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    border-color: #555;
    color: #333;
  }
`;

const SendSection = styled.div`
  padding: 0.8vw 1vw;
  border-bottom: 0.15vw solid black;
  flex-shrink: 0;
`;

const SendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8vw;
`;

const FeeLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 0.2vw;
  font-size: 0.65vw;
  font-family: Pixel, sans-serif;
  color: #888;
  white-space: nowrap;
`;

const MusuIcon = styled.img`
  width: 1vw;
  height: 1vw;
  object-fit: contain;
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 0.7vw 1vw;
  background: ${({ disabled }) => (disabled ? '#ccc' : '#4CAF50')};
  color: ${({ disabled }) => (disabled ? '#888' : 'white')};
  border: 0.12vw solid ${({ disabled }) => (disabled ? '#aaa' : '#3d8b40')};
  border-radius: 0.4vw;
  font-size: 0.9vw;
  font-family: Pixel, sans-serif;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #45a049;
  }

  &:active:not(:disabled) {
    background: #3d8b40;
  }
`;
