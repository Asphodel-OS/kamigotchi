import { Dispatch } from 'react';
import styled from 'styled-components';

import {
  IconButton,
  IconListButton,
  IconListButtonOption,
  Text,
  TextTooltip,
} from 'app/components/library';
import { KamiIcon } from 'assets/images/icons/menu';
import { Item } from 'network/shapes';
import { OrderType } from '../types';

interface Props {
  controls: {
    typeFilter: OrderType;
    setTypeFilter: Dispatch<OrderType>;
    sort: string;
    setSort: Dispatch<string>;
    ascending: boolean;
    setAscending: Dispatch<boolean>;
    itemFilter: Item;
    setItemFilter: Dispatch<Item>;
  };
  data: {
    items: Item[];
  };
}

export const Controls = (props: Props) => {
  const { controls, data } = props;
  const {
    typeFilter,
    setTypeFilter,
    sort,
    setSort,
    ascending,
    setAscending,
    itemFilter,
    setItemFilter,
  } = controls;
  const { items } = data;

  const getItemOptions = (): IconListButtonOption[] => {
    // if buying, show all tradable items
    return items.map((item: Item) => {
      return {
        text: item.name,
        image: item.image,
        onClick: () => setItemFilter(item),
      };
    });
  };

  return (
    <Container>
      <Title>Search</Title>
      <Body>
        <Row>
          <Text size={1.2}>Type:</Text>
          <IconListButton
            img={KamiIcon}
            text={typeFilter}
            options={[
              { text: 'Buy', onClick: () => setTypeFilter('Buy') },
              { text: 'Sell', onClick: () => setTypeFilter('Sell') },
            ]}
          />
        </Row>
        <Row>
          <Text size={1.2}>Sort:</Text>
          <IconListButton
            img={KamiIcon}
            text={sort}
            options={[
              { text: 'Price', onClick: () => setSort('Price') },
              { text: 'Owner', onClick: () => setSort('Owner') },
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
          />
        </Row>
      </Body>
    </Container>
  );
};

const Container = styled.div`
  border-right: 0.15vw solid black;
  height: 100%;
  width: 40%;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  padding: 1.8vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 1;
`;

const Body = styled.div`
  position: relative;
  height: 50%;
  margin: 1.8vw 0.6vw;
  gap: 1.2vw;

  display: flex;
  flex-direction: column;
  align-items: center;

  scrollbar-color: transparent transparent;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;
