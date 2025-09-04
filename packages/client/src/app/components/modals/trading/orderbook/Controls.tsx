import { Dispatch, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { IconButton, IconListButton, IconListButtonOption, Text, TextTooltip } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { MUSU_INDEX } from 'constants/items';
import { Item, NullItem } from 'network/shapes';
import { ItemBrowser } from './browse/ItemBrowser';

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
      <Title>Search</Title>
      <Body>
        <Row compact>
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
        </Row>
        <SearchRow>
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
      </Body>
      <SectionTitle>Browse</SectionTitle>
      <BrowserSection>
        <ItemBrowser items={items} selected={itemFilter} setSelected={setItemFilter} category={category as any} onCategoryChange={setCategory as any} />
      </BrowserSection>
    </Container>
  );
};

const Container = styled.div`
  border-right: 0.15vw solid black;
  height: 100%;
  width: 40%;
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

  padding: 0.9vw 1.2vw;
  opacity: 0.9;
  color: black;
  font-size: 1vw;
  text-align: left;
  z-index: 1;
`;

const Body = styled.div`
  position: relative;
  margin: 0.9vw 0.6vw;
  gap: 0.6vw;

  display: flex;
  flex-direction: column;
  align-items: center;

  scrollbar-color: transparent transparent;
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
  padding: 0.6vw 1.2vw;
  opacity: 0.9;
  color: black;
  font-size: 0.95vw;
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

const SearchRow = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.45vw 0.6vw;
  font-size: 0.9vw;
  border: 0.12vw solid black;
`;

const SuggestBox = styled.div`
  position: absolute;
  top: 2.1vw;
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
