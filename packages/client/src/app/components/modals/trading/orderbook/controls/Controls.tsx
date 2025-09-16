import { Dispatch, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { Item, NullItem } from 'network/shapes';
import { ItemBrowser } from '../browse/ItemBrowser';
import { SearchBar } from './SearchBar';

const SORTS = ['Item', 'Type', 'Qty', 'Total', 'Owner', 'Price'];

export const Controls = ({
  controls,
  data,
  utils,
}: {
  controls: {
    typeFilter: TradeType;
    setTypeFilter: Dispatch<TradeType>;
    itemFilter: Item;
    setItemFilter: Dispatch<Item>;

    itemSearch: string;
    setItemSearch: Dispatch<string>;

    sort: string;
    setSort: Dispatch<string>;
    ascending: boolean;
    setAscending: Dispatch<boolean>;
  };
  data: {
    items: Item[];
    trades: Trade[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}) => {
  const { itemFilter, setItemFilter } = controls;
  const { items } = data;
  // smart search across items and categories
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<string>('All');

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

  /////////////////
  // RENDER

  return (
    <Container>
      <SearchBar
        controls={{ ...controls, query, setQuery, setCategory }}
        data={{ items }}
        utils={utils}
      />
      <BrowserSection>
        <ItemBrowser
          items={items}
          selected={itemFilter}
          setSelected={setItemFilter}
          category={category as any}
          onCategoryChange={setCategory as any}
        />
      </BrowserSection>
    </Container>
  );
};

const Container = styled.div`
  border-right: 0.15vw solid black;
  height: 100%;
  width: 100%;
  min-height: 0;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow: hidden;
`;

const BrowserSection = styled.div`
  position: relative;
  width: 100%;
  padding: 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
`;
