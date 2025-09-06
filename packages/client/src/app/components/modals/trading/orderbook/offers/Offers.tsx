import { Dispatch, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { getTradeType, Trade } from 'app/cache/trade';
import { getInventoryBalance } from 'app/cache/inventory';
import { getPerUnitPrice } from 'app/cache/trade/functions';
import { EmptyText } from 'app/components/library';
import { Account, Item } from 'network/shapes';
import { ConfirmationData } from '../../library/Confirmation';
// removed bulky PendingOffer card; render compact table rows instead
import { animate } from 'animejs';

export const Offers = ({
  actions,
  controls,
  data,
  utils,
}: {
  actions: {
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    sort: string;
    ascending: boolean;
    itemFilter: Item;
    typeFilter: string;
    isConfirming: boolean;
    itemSearch: string;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
  };
  data: { account: Account; trades: Trade[] };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}) => {
  const { typeFilter, sort, setSort, ascending, setAscending, itemFilter, itemSearch } = controls;
  const { account, trades } = data;

  const [displayed, setDisplayed] = useState<Trade[]>([]);
  const [offersOpen, setOffersOpen] = useState<boolean>(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // filter by type
    let cleaned = trades.filter((trade) => {
      const type = getTradeType(trade, false);
      return type === typeFilter;
    });

    // filter by item
    if (itemFilter.index !== 0) {
      cleaned = cleaned.filter((trade) => {
        const buyHas = trade.buyOrder?.items.some((item) => item.index === itemFilter.index);
        const sellHas = trade.sellOrder?.items.some((item) => item.index === itemFilter.index);
        return buyHas || sellHas;
      });
    }

    // sorting
    const sorted = cleaned.toSorted((a: Trade, b: Trade) => {
      if (sort === 'Owner') {
        const aName = a.maker?.name.toLowerCase() || '';
        const bName = b.maker?.name.toLowerCase() || '';

        if (ascending) return aName.localeCompare(bName);
        return bName.localeCompare(aName);
      }

      if (sort === 'Price') {
        const aType = getTradeType(a, false);
        const bType = getTradeType(b, false);
        const aPrice = getPerUnitPrice(a, aType);
        const bPrice = getPerUnitPrice(b, bType);
        if (ascending) return aPrice - bPrice;
        return bPrice - aPrice;
      }

      return 0;
    });
    // only update state if something actually changed to avoid flicker
    const changed =
      sorted.length !== displayed.length ||
      sorted.some((t, i) => t.id !== displayed[i]?.id || t.state !== displayed[i]?.state);
    if (changed) {
      setDisplayed(sorted);
      // animate only when data changes
      requestAnimationFrame(() => {
        animate('tbody tr', {
          translateY: [6, 0],
          opacity: [0, 1],
          delay: (_el, i) => 20 * i,
          duration: 140,
          easing: 'easeOutSine',
        });
      });
    }
  }, [trades, typeFilter, sort, ascending, itemFilter, itemSearch]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const to = offersOpen ? wrapRef.current.scrollHeight : 0;
    animate(wrapRef.current, { maxHeight: to, duration: 220, easing: 'easeOutSine' });
  }, [offersOpen]);

  /////////////////
  // DISPLAY

  const handleExecute = (trade: Trade) => {
    const { setConfirmData, setIsConfirming } = controls;
    setConfirmData({
      title: 'Execute Trade',
      subTitle: undefined,
      content: <div style={{ padding: '0.6vw', fontSize: '0.9vw' }}>Confirm execution?</div>,
      onConfirm: () => actions.executeTrade(trade),
    });
    controls.setIsConfirming(true);
  };

  const canFillOrder = (account: Account, trade: Trade): boolean => {
    const order = trade.buyOrder;
    if (!order) return false;
    const inv = account.inventories ?? [];
    for (let i = 0; i < (order.items?.length || 0); i++) {
      const item = order.items[i];
      const amt = order.amounts[i];
      const bal = getInventoryBalance(inv, item.index);
      if (bal < amt) return false;
    }
    return true;
  };

  const pickDisplayItem = (trade: Trade, utils: { getItemByIndex: (index: number) => Item }): Item => {
    // Prefer the non-currency item if present; otherwise first item in sell or buy
    const sellItems = trade.sellOrder?.items ?? [];
    const buyItems = trade.buyOrder?.items ?? [];
    const pool = [...sellItems, ...buyItems];
    return (pool[0] as Item) ?? utils.getItemByIndex(0);
  };

  return (
    <Container>
      <TitleBar>
        <Title>Open Offers</Title>
        <Toggle onClick={() => setOffersOpen((v) => !v)}>{offersOpen ? '-' : 'v'}</Toggle>
      </TitleBar>
      <TableWrap ref={wrapRef} style={{ maxHeight: offersOpen ? 'none' : 0 }}>
      <Table>
        <thead>
          <HeaderRow>
            <th>Item</th>
            <th>Type</th>
            <th>Qty</th>
            <SortableTh onClick={() => {
              if (sort === 'Price') setAscending(!ascending);
              setSort('Price');
            }}>
              Total {sort === 'Price' ? (ascending ? '↑' : '↓') : ''}
            </SortableTh>
            <SortableTh onClick={() => setSort('Owner')}>
              Owner {sort === 'Owner' ? (ascending ? '↑' : '↓') : ''}
            </SortableTh>
            <th>Action</th>
          </HeaderRow>
        </thead>
        <tbody>
          {displayed.map((trade, i) => {
            const type = getTradeType(trade, false);
            const perUnit = getPerUnitPrice(trade, type);
            const qty = (trade?.sellOrder?.amounts?.[0] || 1);
            const total = perUnit * qty;
            const item = pickDisplayItem(trade, utils);
            const disabled = !canFillOrder(account, trade);
            const typeName = item.type;
            return (
              <Row key={i}>
                <td>
                  <ItemCell>
                    <Icon src={item.image} />
                    <Name title={item.name}>{item.name}</Name>
                  </ItemCell>
                </td>
                <td>
                  <TypeLink
                    onClick={() => {
                      const t = (typeName || '').toUpperCase();
                      let key = 'Other';
                      if (['FOOD', 'REVIVE', 'CONSUMABLE', 'LOOTBOX'].includes(t)) key = 'Consumables';
                      else if (['MATERIAL'].includes(t)) key = 'Materials';
                      else if (['ERC20'].includes(t)) key = 'Currencies';
                      window.dispatchEvent(new CustomEvent('trading:setCategory', { detail: key }));
                    }}
                    title={`View ${typeName} items`}
                  >
                    {typeName}
                  </TypeLink>
                </td>
                <td>{qty.toLocaleString()}</td>
                <td>{total.toLocaleString()}</td>
                <td>
                  <OwnerLink
                    onClick={() => {
                      const name = trade.maker?.name ?? '';
                      window.dispatchEvent(new CustomEvent('trading:viewProfile', { detail: name }));
                    }}
                    title='View profile'
                  >
                    {trade.maker?.name ?? '???'}
                  </OwnerLink>
                </td>
                <td>
                  <ActionButton disabled={disabled} onClick={() => handleExecute(trade)}>
                    Execute
                  </ActionButton>
                </td>
              </Row>
            );
          })}
        </tbody>
      </Table>
      </TableWrap>
      {displayed.length === 0 && <EmptyText text={['No active trades to show']} />}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: stretch;

  overflow: hidden;
  scrollbar-color: transparent transparent;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  height: 2.4vw;
  line-height: 2.0vw; /* move text down a bit while preserving container height */
  padding: 0.4vw 1.2vw 0 1.2vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 1;
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgb(221, 221, 221);
`;

const Toggle = styled.button`
  border: 0.12vw solid black;
  height: 2.4vw;
  line-height: 2.4vw;
  padding: 0 0.45vw;
  font-size: 0.9vw;
  background: rgb(221, 221, 221);
  cursor: pointer;
`;

const TableWrap = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  z-index: 0;
  scrollbar-color: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  display: table;
`;

const HeaderRow = styled.tr`
  position: sticky;
  top: 0;
  background: #e6e6e6;
  z-index: 1;
  & > th {
    text-align: left;
    padding: 0.6vw 0.9vw;
    border-bottom: 0.12vw solid black;
  }
`;

const SortableTh = styled.th`
  cursor: pointer;
  user-select: none;
`;

const Row = styled.tr`
  & > td {
    padding: 0.45vw 0.6vw;
    border-bottom: 0.06vw solid #ccc;
    font-size: 0.9vw;
    vertical-align: middle;
    white-space: nowrap;
  }
`;

const ItemCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  image-rendering: pixelated;
`;

const Name = styled.div`
  max-width: 14vw;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const TypeLink = styled.span`
  color: #336;
  text-decoration: underline;
  cursor: pointer;
  &:hover { opacity: 0.85; }
`;

const ActionButton = styled.button`
  border: 0.12vw solid black;
  background: #e6ffd6;
  padding: 0.3vw 0.6vw;
  font-size: 0.85vw;
  cursor: pointer;
  &:disabled {
    background: #eee;
    cursor: default;
    opacity: 0.7;
  }
`;

const OwnerLink = styled.span`
  display: inline-block;
  max-width: 12vw;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #336;
  text-decoration: underline;
  cursor: pointer;
`;
