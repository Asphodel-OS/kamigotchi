import { Dispatch, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { IconButton, IconListButton, IconListButtonOption, Text, TextTooltip } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { MUSU_INDEX } from 'constants/items';
import { Item, NullItem } from 'network/shapes';
import { ItemBrowser } from './browse/ItemBrowser';
import { animate } from 'animejs';

export const Controls = ({
  controls,
  data,
  utils,
}: {
  controls: {
    typeFilter: TradeType;
    setTypeFilter: Dispatch<TradeType>;
    sort: string;
    setSort: Dispatch<string>;
    ascending: boolean;
    setAscending: Dispatch<boolean>;
    itemFilter: Item;
    setItemFilter: Dispatch<Item>;
    itemSearch: string;
    setItemSearch: Dispatch<string>;
  };
  data: {
    items: Item[];
    trades: Trade[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}) => {
  const {
    typeFilter,
    setTypeFilter,
    sort,
    setSort,
    ascending,
    setAscending,
    itemFilter,
    setItemFilter,
    itemSearch,
    setItemSearch,
  } = controls;
  const { items } = data;
  const { getItemByIndex } = utils;

  /////////////////
  // INTERPRETATION

  const getItemOptions = (): IconListButtonOption[] => {
    // if buying  show all tradable items
    const itemOptions = items.map(
      (item): IconListButtonOption => ({
        text: item.name,
        image: item.image,
        onClick: () => {
          setItemSearch('');
          setItemFilter(item);
        },
      })
    );
    itemOptions.unshift({
      text: 'Any',
      onClick: () => {
        setItemFilter(NullItem);
        setItemSearch('');
      },
    });
    return itemOptions;
  };

  const getSortIcon = (sort: string) => {
    if (sort === 'Price') return getItemByIndex(MUSU_INDEX).image;
    return MenuIcons.operator;
  };

  /////////////////
  // INTERACTION

  const toggleTypeFilter = () => {
    if (typeFilter === 'Buy') setTypeFilter('Sell');
    if (typeFilter === 'Sell') setTypeFilter('Barter');
    if (typeFilter === 'Barter') setTypeFilter('Buy');
  };

  // smart search across items and categories
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<'All' | 'Consumables' | 'Materials' | 'Currencies' | 'Other'>('All');
  const [searchOpen, setSearchOpen] = useState<boolean>(true);
  const [browseOpen, setBrowseOpen] = useState<boolean>(true);

  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const searchInnerRef = useRef<HTMLDivElement | null>(null);
  const browseWrapRef = useRef<HTMLDivElement | null>(null);
  const browseInnerRef = useRef<HTMLDivElement | null>(null);

  const animateSection = (wrap: HTMLDivElement | null, inner: HTMLDivElement | null, open: boolean) => {
    if (!wrap || !inner) return;
    if (open) {
      const target = inner.scrollHeight;
      wrap.style.maxHeight = `${Math.max(target, 1)}px`;
      animate(wrap, {
        maxHeight: target,
        duration: 220,
        easing: 'easeOutSine',
        complete: () => (wrap.style.maxHeight = 'none'),
      });
    } else {
      const current = wrap.scrollHeight;
      wrap.style.maxHeight = `${current}px`;
      animate(wrap, { maxHeight: 0, duration: 220, easing: 'easeOutSine' });
    }
  };

  // respond to external category change events
  useEffect(() => {
    const handler = (e: any) => {
      const key = e.detail as any;
      setCategory(key);
    };
    window.addEventListener('trading:setCategory', handler as any);
    return () => window.removeEventListener('trading:setCategory', handler as any);
  }, []);

  // run animations on state change
  useEffect(() => animateSection(searchWrapRef.current, searchInnerRef.current, searchOpen), [searchOpen]);
  useEffect(() => animateSection(browseWrapRef.current, browseInnerRef.current, browseOpen), [browseOpen]);

  // initialize measured heights so sections don't overlap
  useEffect(() => {
    const initHeights = () => {
      if (searchWrapRef.current && searchInnerRef.current) {
        searchWrapRef.current.style.maxHeight = 'none';
      }
      if (browseWrapRef.current && browseInnerRef.current) {
        browseWrapRef.current.style.maxHeight = 'none';
      }
    };
    initHeights();
    // Recalculate after layout in case modal opens from hidden state
    setTimeout(initHeights, 0);
    setTimeout(initHeights, 120);
  }, []);
  const suggestions = useMemo(() => {
    const lower = query.toLowerCase();
    if (!lower) return [] as { label: string; onPick: () => void }[];
    const catMatches = ['All', 'Consumables', 'Materials', 'Currencies', 'Other']
      .filter((c) => c.toLowerCase().includes(lower))
      .map((c) => ({ label: `Category: ${c}`, onPick: () => setCategory(c as any) }));
    const itemMatches = items
      .filter((it) => it.name.toLowerCase().includes(lower))
      .slice(0, 6)
      .map((it) => ({ label: it.name, onPick: () => setItemFilter(it) }));
    return [...catMatches, ...itemMatches];
  }, [query, items]);

  return (
    <Container>
      <TitleRow>
        <Title>Search</Title>
        <Toggle onClick={() => setSearchOpen((v) => !v)}>{searchOpen ? '-' : 'v'}</Toggle>
      </TitleRow>
      <CollapsibleWrap ref={searchWrapRef} style={{ minHeight: '9%' }}>
        <div ref={searchInnerRef}>
        <SearchRow>
          <IconButton text={`< ${typeFilter} >`} onClick={toggleTypeFilter} />
          <IconListButton
            img={getSortIcon(sort)}
            text={sort}
            options={[
              { text: 'Price', image: getSortIcon('Price'), onClick: () => setSort('Price') },
              { text: 'Owner', image: getSortIcon('Owner'), onClick: () => setSort('Owner') },
            ]}
          />
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
        </SearchRow>
        </div>
      </CollapsibleWrap>
      <TitleRow>
        <SectionTitle>Browse</SectionTitle>
        <Toggle onClick={() => setBrowseOpen((v) => !v)}>{browseOpen ? '-' : 'v'}</Toggle>
      </TitleRow>
      <CollapsibleWrap ref={browseWrapRef} style={{ flex: '1 1 auto', minHeight: '7%' }}>
        <div ref={browseInnerRef}>
          <BrowserSection>
            <ItemBrowser items={items} selected={itemFilter} setSelected={setItemFilter} category={category as any} onCategoryChange={setCategory as any} />
          </BrowserSection>
        </div>
      </CollapsibleWrap>
    </Container>
  );
};

const Container = styled.div`
  border-right: 0.15vw solid black;
  height: 100%;
  width: 100%;
  min-height: 0;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow: hidden;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  height: 2.4vw;
  line-height: 2.4vw;
  padding: 0 1.2vw;
  opacity: 0.9;
  color: black;
  font-size: 1vw;
  text-align: left;
  z-index: 1;
`;

const TitleRow = styled.div`
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
  font-size: 0.8vw;
  background: rgb(221, 221, 221);
  cursor: pointer;
`;

const Body = styled.div`
  position: relative;
  margin: 1.1vw 0.6vw;
  gap: 0.6vw;

  display: flex;
  flex-direction: column;
  align-items: center;
  /* allow visible scrollbars in nested content */
  scrollbar-color: auto;
`;

const Row = styled.div<{ compact?: boolean }>`
  width: 100%;
  gap: ${({ compact }) => (compact ? 0.3 : 0.6)}vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const SectionTitle = styled.div`
  background-color: rgb(221, 221, 221);
  width: 100%;
  height: 2.4vw;
  line-height: 2.4vw;
  padding: 0 1.2vw;
  opacity: 0.9;
  color: black;
  font-size: 1vw;
  text-align: left;
`;

const BrowserSection = styled.div`
  position: relative;
  width: 100%;
  padding: 0.6vw 0.6vw 1.2vw 0.6vw;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
`;

const CollapsibleWrap = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  transition: max-height 0.2s ease-out;
  max-height: none;
  min-height: 7%;
`;

// Listen for external category changes (from Offer table TypeLink)
if (typeof window !== 'undefined') {
  window.addEventListener('trading:setCategory', (e: any) => {
    const key = e.detail as any;
    try {
      // best-effort: update the control store if mounted
      // no-op here; state handled in component via onCategoryChange
    } catch {}
  });
}

const SearchRow = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.6vw;
`;

const SearchInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.45vw 0.6vw;
  font-size: 0.9vw;
  border: 0.12vw solid black;
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
  z-index: 2;
`;

const Suggest = styled.div`
  padding: 0.45vw 0.6vw;
  font-size: 0.9vw;
  cursor: pointer;
  &:hover {
    background: #eee;
  }
`;
