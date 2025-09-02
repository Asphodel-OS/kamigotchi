import { Dispatch } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import {
  IconButton,
  IconListButton,
  IconListButtonOption,
  Text,
  TextTooltip,
} from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { MUSU_INDEX } from 'constants/items';
import { Item, NullItem } from 'network/shapes';

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

  return (
    <Container>
      <Title>Search Offers</Title>
      <Body>
        <Row>
          <Text size={1.2}>Type:</Text>
          <IconButton text={`< ${typeFilter} >`} onClick={toggleTypeFilter} />
        </Row>
        <Row>
          <Text size={1.2}>Sort:</Text>
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
        <Row>
          <Text size={1.2}>Item:</Text>
          <IconListButton
            img={itemFilter.image}
            text={itemFilter.name}
            options={getItemOptions()}
            searchable
          />
        </Row>
      </Body>
    </Container>
  );
};

const Container = styled.div`
  border-right: 0.15em solid black;
  height: 100%;
  width: 40%;
  gap: 0.6em;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  padding: 1.8em;
  opacity: 0.9;
  color: black;
  font-size: 1.2em;
  text-align: left;
  z-index: 1;
`;

const Body = styled.div`
  position: relative;
  height: 50%;
  margin: 1.8em 0.6em;
  gap: 1.2em;

  display: flex;
  flex-direction: column;
  align-items: center;

  scrollbar-color: transparent transparent;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6em;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;
