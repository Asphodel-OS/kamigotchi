import { Dispatch, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { getTradeType, Trade } from 'app/cache/trade';
import { getInventoryBalance } from 'app/cache/inventory';
import { getPerUnitPrice } from 'app/cache/trade/functions';
import { EmptyText, TextTooltip } from 'app/components/library';
import { ItemGridTooltip } from 'app/components/modals/inventory/ItemGridTooltip';
import { Account, Item } from 'network/shapes';
import { MUSU_INDEX } from 'constants/items';
import { ConfirmationData } from '../../library/Confirmation';
import { animate } from 'animejs';

export const Offers = ({
  actions,
  controls,
  data,
  utils,
  extraFilter,
  filtersEnabled = true,
  showMakerOffer = false,
  deleteEnabled = false,
  onDelete,
}: {
  actions: {
    executeTrade: (trade: Trade) => void;
    cancelTrade?: (trade: Trade) => void;
  };
  controls: {
    sort: string;
    setSort: Dispatch<string>;
    ascending: boolean;
    setAscending: Dispatch<boolean>;
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
  extraFilter?: (t: Trade) => boolean;
  filtersEnabled?: boolean;
  showMakerOffer?: boolean;
  deleteEnabled?: boolean;
  onDelete?: (trade: Trade) => void;
}) => {
  const { typeFilter, sort, setSort, ascending, setAscending, itemFilter, itemSearch } = controls;
  const { account, trades } = data;

  const [displayed, setDisplayed] = useState<Trade[]>([]);
  const [offersOpen, setOffersOpen] = useState<boolean>(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // filter by type (if provided and not 'All')
    let cleaned = trades.filter((trade) => {
      const type = getTradeType(trade, false);
      if (!typeFilter || (typeFilter as any) === 'All') return true;
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

    // apply category filter if any
    const matchesCategory = (trade: Trade): boolean => {
      const key = (categoryFilter || 'All').toUpperCase();
      if (key === 'ALL') return true;
      const consumableTypes = new Set(['FOOD', 'REVIVE', 'CONSUMABLE', 'LOOTBOX']);
      const sellItems = trade.sellOrder?.items ?? [];
      const buyItems = trade.buyOrder?.items ?? [];
      const combined = [...sellItems, ...buyItems];
      for (const it of combined) {
        const idx = (it as any)?.index ?? 0;
        const full = utils.getItemByIndex(idx);
        const t = (full?.type || '').toUpperCase();
        if (key === 'CONSUMABLES' && consumableTypes.has(t)) return true;
        if (key === 'MATERIALS' && t === 'MATERIAL') return true;
        if (key === 'CURRENCIES' && t === 'ERC20') return true;
        if (t === key) return true;
      }
      return false;
    };
    cleaned = cleaned.filter(matchesCategory);

    // apply item filter if any (from this panel's clicks)
    if (itemFilterIndexLocal && itemFilterIndexLocal !== 0) {
      cleaned = cleaned.filter((trade) => {
        const sellItems = trade.sellOrder?.items ?? [];
        const buyItems = trade.buyOrder?.items ?? [];
        return [...sellItems, ...buyItems].some((it) => (it as any)?.index === itemFilterIndexLocal);
      });
    }

    // apply owner filter if any
    if (ownerFilter) {
      cleaned = cleaned.filter((t) => (t.maker?.name || '') === ownerFilter);
    }

    if (extraFilter) {
      cleaned = cleaned.filter(extraFilter);
    }

    // apply item filter if any (from this panel's clicks)
    if (itemFilterIndexLocal && itemFilterIndexLocal !== 0) {
      cleaned = cleaned.filter((trade) => {
        const sellItems = trade.sellOrder?.items ?? [];
        const buyItems = trade.buyOrder?.items ?? [];
        return [...sellItems, ...buyItems].some((it) => (it as any)?.index === itemFilterIndexLocal);
      });
    }

    const getNumeric = (v: any): number => (typeof v === 'number' ? v : Number.NaN);
    const sortValue = (t: Trade): string | number => {
      const tType = getTradeType(t, false);
      const price = getPerUnitPrice(t, tType);
      const qty = (t?.sellOrder?.amounts?.[0] || 1) as number;
      const total = price * qty;
      const item = pickDisplayItem(t, utils);
      const owner = (t.maker?.name || '').toLowerCase();
      switch (sort) {
        case 'Owner':
          return owner;
        case 'Price':
        case 'Total':
          return total;
        case 'Qty':
          return qty;
        case 'Item':
          return (item?.name || '').toLowerCase();
        case 'Type':
          return (item?.type || '').toLowerCase();
        default:
          return total;
      }
    };

    const sorted = cleaned.toSorted((a: Trade, b: Trade) => {
      const av = sortValue(a);
      const bv = sortValue(b);
      if (typeof av === 'string' && typeof bv === 'string') {
        return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = getNumeric(av);
      const bn = getNumeric(bv);
      if (Number.isNaN(an) || Number.isNaN(bn)) return 0;
      return ascending ? an - bn : bn - an;
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

  // Listen to category filters from the browser and filter rows accordingly
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  useEffect(() => {
    if (!filtersEnabled) return;
    const handler = (e: any) => {
      setCategoryFilter((e?.detail || 'All') as string);
      setOffersOpen(true);
    };
    window.addEventListener('trading:filterOffersByCategory', handler as any);
    window.addEventListener('trading:setCategory', handler as any);
    return () => {
      window.removeEventListener('trading:filterOffersByCategory', handler as any);
      window.removeEventListener('trading:setCategory', handler as any);
    };
  }, [filtersEnabled]);

  // Listen for explicit item filter requests (from clicking item in offers)
  const [itemFilterIndexLocal, setItemFilterIndexLocal] = useState<number | null>(null);
  useEffect(() => {
    if (!filtersEnabled) return;
    const handler = (e: any) => {
      const idx = Number(e?.detail);
      setItemFilterIndexLocal(Number.isFinite(idx) ? idx : null);
      setOffersOpen(true);
    };
    window.addEventListener('trading:filterOffersByItem', handler as any);
    return () => window.removeEventListener('trading:filterOffersByItem', handler as any);
  }, [filtersEnabled]);

  // Listen for owner filter requests
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  useEffect(() => {
    if (!filtersEnabled) return;
    const handler = (e: any) => {
      const name = (e?.detail || '').toString();
      setOwnerFilter(name);
      setOffersOpen(true);
    };
    window.addEventListener('trading:filterOffersByOwner', handler as any);
    return () => window.removeEventListener('trading:filterOffersByOwner', handler as any);
  }, [filtersEnabled]);


  useEffect(() => {
    if (!wrapRef.current) return;
    const to = offersOpen ? wrapRef.current.scrollHeight : 0;
    animate(wrapRef.current, { maxHeight: to, duration: 220, easing: 'easeOutSine' });
  }, [offersOpen]);

  /////////////////
  // DISPLAY

  const handleExecute = (trade: Trade) => {
    const { setConfirmData, setIsConfirming } = controls;
    const t = getTradeType(trade, false) as string;
    const item = pickDisplayItem(trade, utils);
    let qty = 1;
    if (t === 'Buy') qty = (trade?.sellOrder?.amounts?.[0] || 1) as number;
    else if (t === 'Sell') qty = (trade?.buyOrder?.amounts?.[0] || 1) as number;
    else qty = (trade?.sellOrder?.amounts?.[0] || trade?.buyOrder?.amounts?.[0] || 1) as number;
    const per = getPerUnitPrice(trade, t as any);
    const total = per * qty;
    const verb = t === 'Buy' ? 'Buy' : t === 'Sell' ? 'Sell' : 'Trade';
    setConfirmData({
      title: 'Confirm Order',
      subTitle: undefined,
      content: (
        <div style={{ padding: '0.6vw', fontSize: '0.9vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6vw' }}>
          <TextTooltip text={[<ItemGridTooltip key={item?.index || 0} item={item as any} utils={{ displayRequirements: () => '', parseAllos: () => [] }} />]} maxWidth={26}>
            <img src={item?.image} style={{ width: '3vw', height: '3vw', imageRendering: 'pixelated' }} />
          </TextTooltip>
          <span>
            {verb} {qty.toLocaleString()} {item?.name ?? 'Item'} for {total.toLocaleString()} MUSU?
          </span>
        </div>
      ),
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

  const getActionLabel = (trade: Trade): string => {
    const t = getTradeType(trade, false) as string;
    if (t === 'Buy') return 'Buy';
    if (t === 'Sell') return 'Sell';
    if (t === 'Barter') return 'Barter';
    return 'Execute';
  };

  const pickDisplayItem = (trade: Trade, utils: { getItemByIndex: (index: number) => Item }): Item => {
    const mapItems = (arr: any[] | undefined): Item[] =>
      (arr ?? [])
        .map((it: any) => {
          const idx = (it?.index ?? it?.item?.index ?? 0) as number;
          return (it as Item)?.name ? (it as Item) : utils.getItemByIndex(idx);
        })
        .filter(Boolean) as Item[];

    const fromBuy = mapItems(trade.buyOrder?.items);
    const fromSell = mapItems(trade.sellOrder?.items);

    const preferNonCurrency = (list: Item[]) => list.find((i) => (i && i.index !== MUSU_INDEX && (i?.type || '').toUpperCase() !== 'ERC20')) ?? list[0];

    // For management, optionally force show maker's offered side (sellOrder)
    if (showMakerOffer) {
      // In our data model, the maker's intended item often lives in buyOrder for Sell listings
      return (
        preferNonCurrency(fromBuy) ?? preferNonCurrency(fromSell) ?? utils.getItemByIndex(0)
      );
    }

    // When viewing Buy offers, show what sellers are offering (sellOrder)
    if ((typeFilter as any) === 'Buy') {
      return (
        preferNonCurrency(fromSell) ?? preferNonCurrency(fromBuy) ?? utils.getItemByIndex(0)
      );
    }
    // When viewing Sell offers, show what buyers are seeking (buyOrder)
    if ((typeFilter as any) === 'Sell') {
      return (
        preferNonCurrency(fromBuy) ?? preferNonCurrency(fromSell) ?? utils.getItemByIndex(0)
      );
    }
    // Barter/All: prefer non-currency from any side
    const combined = [...fromSell, ...fromBuy];
    return preferNonCurrency(combined) ?? utils.getItemByIndex(0);
  };

  const clearFilters = () => {
    setItemFilterIndexLocal(null);
    setOwnerFilter('');
    try {
      window.dispatchEvent(new CustomEvent('trading:filterOffersByCategory', { detail: 'All' }));
      window.dispatchEvent(new CustomEvent('trading:clearFilters'));
    } catch {}
  };

  const hasAnyFilter = (categoryFilter && categoryFilter !== 'All') || (itemFilterIndexLocal && itemFilterIndexLocal !== 0) || !!ownerFilter;

  return (
    <Container>
      {hasAnyFilter && (
        <FilterBar>
          <span>Filtered {itemFilterIndexLocal ? '(Item)' : ''} {categoryFilter && categoryFilter !== 'All' ? `(Category: ${categoryFilter})` : ''}</span>
          <ClearButton onClick={clearFilters}>Clear</ClearButton>
        </FilterBar>
      )}
      <TableWrap ref={wrapRef} style={{ maxHeight: offersOpen ? 'none' : 0 }}>
      <Table>
        <colgroup>
          <col className='item' />
          <col className='type' />
          <col className='qty' />
          <col className='total' />
          <col className='maker' />
          <col />
        </colgroup>
        <thead>
          <HeaderRow>
            <SortableTh onClick={() => { setAscending(sort === 'Item' ? !ascending : true); setSort('Item'); }}>
              Item {sort === 'Item' ? (ascending ? '↑' : '↓') : ''}
            </SortableTh>
            <SortableTh onClick={() => { setAscending(sort === 'Type' ? !ascending : true); setSort('Type'); }}>
              Type {sort === 'Type' ? (ascending ? '↑' : '↓') : ''}
            </SortableTh>
            <SortableTh onClick={() => { setAscending(sort === 'Qty' ? !ascending : true); setSort('Qty'); }}>
              Qty {sort === 'Qty' ? (ascending ? '↑' : '↓') : ''}
            </SortableTh>
            <SortableTh onClick={() => { setAscending(sort === 'Total' ? !ascending : true); setSort('Total'); }}>
              Total {sort === 'Total' ? (ascending ? '↑' : '↓') : ''}
            </SortableTh>
            <SortableTh onClick={() => { setAscending(sort === 'Owner' ? !ascending : true); setSort('Owner'); }}>
              Maker {sort === 'Owner' ? (ascending ? '↑' : '↓') : ''}
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
                    <TextTooltip
                      text={[<ItemGridTooltip key={`img-${item.index}`} item={item as any} utils={{ displayRequirements: () => '', parseAllos: () => [] }} />]}
                      maxWidth={25}
                    >
                      <Icon
                        src={item.image}
                        onClick={() =>
                          window.dispatchEvent(new CustomEvent('trading:filterOffersByItem', { detail: item.index }))
                        }
                      />
                    </TextTooltip>
                    <TextTooltip
                      text={[<ItemGridTooltip key={`name-${item.index}`} item={item as any} utils={{ displayRequirements: () => '', parseAllos: () => [] }} />]}
                      maxWidth={25}
                    >
                      <Name
                        onClick={() =>
                          window.dispatchEvent(new CustomEvent('trading:filterOffersByItem', { detail: item.index }))
                        }
                      >
                        {item.name}
                      </Name>
                    </TextTooltip>
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
                <TotalCell>{total.toLocaleString()}</TotalCell>
                <td>
                  <OwnerLink
                    onClick={() => {
                      const name = trade.maker?.name ?? '';
                      window.dispatchEvent(new CustomEvent('trading:filterOffersByOwner', { detail: name }));
                    }}
                    title='View items by owner'
                  >
                    {trade.maker?.name ?? '???'}
                  </OwnerLink>
                </td>
                <td>
                  <ActionCell>
                  <ActionButton disabled={disabled} onClick={() => handleExecute(trade)}>
                      {getActionLabel(trade)}
                    </ActionButton>
                    {deleteEnabled ? (
                      <TextTooltip text={['delete order']}>
                        <ActionButton onClick={() => (onDelete ? onDelete(trade) : actions.cancelTrade?.(trade))}>
                          x
                  </ActionButton>
                      </TextTooltip>
                    ) : null}
                  </ActionCell>
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

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6vw;
  padding: 0.3vw 0.6vw;
  background: #f0f0f0;
  border-bottom: 0.12vw solid black;
`;

const ClearButton = styled.button`
  border: 0.12vw solid black;
  padding: 0.15vw 0.6vw;
  font-size: 0.85vw;
  cursor: pointer;
  background: #eee;
`;

/* corner minimize toggle removed */

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
  colgroup col.item { width: 34%; }
  colgroup col.type { width: 14%; }
  colgroup col.qty { width: 10%; }
  colgroup col.total { width: 12%; }
  colgroup col.maker { width: 20%; }
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

const TooltipWrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  image-rendering: pixelated;
`;

const Name = styled.div`
  max-width: 20vw;
  overflow: hidden;
  white-space: normal;
  word-break: break-word;
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

const ActionCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3vw;
  align-items: flex-start;
`;

const OwnerLink = styled.span`
  display: inline-block;
  max-width: 16ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
  color: #336;
  text-decoration: underline;
  cursor: pointer;
`;

const TotalCell = styled.td`
  word-break: break-word;
`;
