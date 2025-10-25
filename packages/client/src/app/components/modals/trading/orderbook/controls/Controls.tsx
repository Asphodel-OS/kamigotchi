import { Dispatch, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { Item, NullItem } from 'network/shapes';
import { Categories, CategoryKey } from './Categories';
import { ItemBrowser } from './ItemBrowser';
import { CONSUMABLE_TYPES } from './constants';

export const Controls = ({
  controls,
  data,
}: {
  controls: {
    typeFilter: TradeType;
    setTypeFilter: Dispatch<TradeType>;
    itemFilter: Item;
    setItemFilter: Dispatch<Item>;

    sort: string;
    setSort: Dispatch<string>;
    ascending: boolean;
    setAscending: Dispatch<boolean>;
    query: string;
    setQuery: Dispatch<string>;
    category: string;
    setCategory: Dispatch<string>;
  };
  data: {
    items: Item[];
    trades: Trade[];
  };
}) => {
  const { itemFilter, setItemFilter, typeFilter } = controls;
  const { setQuery, category, setCategory } = controls;
  const { items, trades } = data;
  // smart search across items and categories

  // respond to external category change events
  useEffect(() => {
    const handler = (e: any) => {
      const key = e.detail as any;
      setCategory(key);
    };
    const clearHandler = () => {
      setItemFilter(NullItem);
      setCategory('All' as any);
      setQuery('');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('trading:setCategory', handler as any);
      window.addEventListener('trading:clearFilters', clearHandler as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('trading:setCategory', handler as any);
        window.removeEventListener('trading:clearFilters', clearHandler as any);
      }
    };
  }, []);

  // categorize items by type and create lookup maps
  const categorizedItems = useMemo(() => {
    const byCat = new Map<CategoryKey, Item[]>();
    byCat.set('All', []);
    byCat.set('Consumables', []);
    byCat.set('Materials', []);
    byCat.set('Currencies', []);

    // sort all items into categories
    for (const item of items) {
      const type = (item.type || '').toUpperCase();
      if (!type) {
        byCat.get('All')!.push(item);
        continue;
      }
      let key: CategoryKey = type;
      if (CONSUMABLE_TYPES.has(type)) key = 'Consumables';
      else if (type === 'MATERIAL') key = 'Materials';
      else if (type === 'ERC20') key = 'Currencies';

      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(item);
      byCat.get('All')!.push(item);
    }

    // sort each category alphabetically
    for (const key of byCat.keys()) {
      const category = byCat.get(key)!;
      category.sort((a, b) => a.name.localeCompare(b.name));
    }

    return byCat;
  }, [items]);

  /////////////////
  // RENDER

  return (
    <Container>
      <Categories
        items={items}
        selected={itemFilter}
        setSelected={setItemFilter}
        category={category}
        onCategoryChange={setCategory}
      />
      <ItemBrowser
        controls={{ selected: itemFilter, setSelected: setItemFilter, typeFilter }}
        data={{
          items: categorizedItems.get(category) ?? [],
          trades,
        }}
      />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  width: 100%;
  min-height: 0;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  overflow-y: auto;
`;
