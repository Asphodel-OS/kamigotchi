import { Dispatch, useMemo } from 'react';
import styled from 'styled-components';

import { TradeType } from 'app/cache/trade';
import {
  IconButton,
  IconListButton,
  IconListButtonOption,
  TextTooltip,
} from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { MUSU_INDEX } from 'constants/items';
import { Item } from 'network/shapes';
import { playClick } from 'utils/sounds';

const SORTS = ['Item', 'Type', 'Qty', 'Total', 'Owner', 'Price'];
const CATEGORIES = ['All', 'Consumables', 'Materials', 'Currencies'];

export const SearchBar = ({
  controls,
  data,
  utils,
}: {
  controls: {
    // TODO: consolidate these filters into a single object
    typeFilter: TradeType;
    setTypeFilter: Dispatch<TradeType>;
    setItemFilter: Dispatch<Item>;
    setCategory: Dispatch<string>;

    sort: string;
    setSort: Dispatch<string>;
    ascending: boolean;
    setAscending: Dispatch<boolean>;

    query: string;
    setQuery: Dispatch<string>;
  };
  data: {
    items: Item[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}) => {
  const { typeFilter, setTypeFilter, setItemFilter } = controls;
  const { sort, setSort, ascending, setAscending } = controls;
  const { query, setQuery, setCategory } = controls;
  const { items } = data;
  const { getItemByIndex } = utils;

  /////////////////
  // INTERACTION

  // toggle the type filter
  const toggleTypeFilter = () => {
    setTypeFilter(typeFilter === 'Buy' ? 'Sell' : 'Buy');
  };

  /////////////////
  // INTERPRETATION

  // get the interactive list of available sorts
  const getSortOptions = (): IconListButtonOption[] => {
    return SORTS.map((sort) => ({
      text: sort,
      image: getSortIcon(sort),
      onClick: () => {
        playClick();
        setSort(sort);
      },
    }));
  };

  // get the Icon for a given Sort option
  const getSortIcon = (sort: string) => {
    if (sort === 'Price' || sort === 'Total') return getItemByIndex(MUSU_INDEX).image;
    if (sort === 'Owner') return MenuIcons.social;
    if (sort === 'Item') return MenuIcons.inventory;
    if (sort === 'Type') return MenuIcons.more; // generic categories icon
    if (sort === 'Qty') return MenuIcons.inventory; // stack-like inventory icon for quantity
    return MenuIcons.operator;
  };

  // always open by default; no per-section collapse state
  const suggestions = useMemo(() => {
    const lower = query.toLowerCase();
    if (!lower) return [] as { label: string; onPick: () => void }[];

    const categoryMatches = CATEGORIES.filter((c) => c.toLowerCase().includes(lower));
    const categoryOptions = categoryMatches.map((c) => ({
      label: `Category: ${c}`,
      onPick: () => setCategory(c as any),
    }));

    const itemMatches = items.filter((item) => item.name.toLowerCase().includes(lower));
    const itemOptions = itemMatches.slice(0, 6).map((item) => ({
      label: item.name,
      onPick: () => {
        setItemFilter(item);
        try {
          const event = new CustomEvent('trading:filterOffersByItem', { detail: item.index });
          window.dispatchEvent(event);
        } catch {}
      },
    }));

    return [...categoryOptions, ...itemOptions];
  }, [query, items]);

  /////////////////
  // RENDER

  return (
    <Container>
      <IconButton
        text={`< ${typeFilter} >`}
        onClick={toggleTypeFilter}
        color={typeFilter === 'Buy' ? '#e9ffe9' : '#ffe9e9'}
      />
      <IconListButton img={getSortIcon(sort)} text={sort} options={getSortOptions()} />
      <TextTooltip text={[ascending ? 'sorting by ascending' : 'sorting by descending']}>
        <IconButton text={ascending ? '↑' : '↓'} onClick={() => setAscending(!ascending)} />
      </TextTooltip>
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search items or categories...'
      />
      {query && (
        <SuggestBox>
          {suggestions.map((s, i) => (
            <Suggest key={i} onClick={() => (s.onPick(), setQuery(''))}>
              {s.label}
            </Suggest>
          ))}
        </SuggestBox>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  gap: 0.6vw;
  padding: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  /* Keep search controls comfortably smaller than their container */
  & button {
    height: 1.8vw;
    line-height: 1.8vw;
    padding: 0 0.6vw;
    font-size: 0.9vw;
    max-height: 100%;
  }
  @media (min-width: 1400px) {
    & button {
      height: 1.6vw;
      line-height: 1.6vw;
    }
  }
  @media (min-width: 1800px) {
    & button {
      height: 1.5vw;
      line-height: 1.5vw;
    }
  }
`;

const SearchInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  height: 1.8vw;
  padding: 0 0.6vw;

  font-size: 0.9vw;
  line-height: 1.8vw;
`;

const SuggestBox = styled.div`
  position: absolute;
  top: calc(100% + 0.3vw);
  left: 0;
  right: 0;
  background: #fff;
  border: 0.12vw solid black;
  max-height: 12vw;
  overflow: auto;
  z-index: 1;
`;

const Suggest = styled.div`
  padding: 0.45vw 0.6vw;
  font-size: 0.9vw;
  cursor: pointer;
  &:hover {
    background: #eee;
  }
`;
