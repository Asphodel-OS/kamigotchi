import { Dispatch } from 'react';
import styled from 'styled-components';

import {
  IconButton,
  IconListButton,
  IconListButtonOption,
  Text,
  TextTooltip,
} from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import { KamiIcon } from 'assets/images/icons/menu';
import { Item } from 'network/shapes';
import { OrderType } from '../types';

interface Props {
  controls: {
    type: OrderType;
    setType: Dispatch<OrderType>;
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
  const { type, setType, sort, setSort, ascending, setAscending, itemFilter, setItemFilter } =
    controls;
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
      <Title>Controls</Title>
      <Body>
        <Row>
          <Text size={1.2}>Type:</Text>
          <IconListButton
            img={KamiIcon}
            text={type}
            options={[
              { text: 'Buy', onClick: () => setType('Buy') },
              { text: 'Sell', onClick: () => setType('Sell') },
            ]}
          />
        </Row>
        {/* <Row>
          <Text size={1.2}>Search:</Text>
          <Search onChange={(e) => setSearch(e.target.value)} placeholder='Search an item...' />
        </Row> */}
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

const Label = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1vw;
  position: relative;
  width: 49%;
`;

const Search = styled.input`
  border-radius: 0.6vw;
  border: 0.15vw solid black;
  height: 3vw;
  background: url(${ActionIcons.search}) no-repeat left center;
  background-origin: content-box;
  padding: 0.5vw 1vw;
  background-size: contain;
  text-align: center;
  font-size: 0.8vw;
  &::placeholder {
    position: absolute;
    left: 20%;
    background-color: white;
  }
`;

const Sort = styled.button`
  display: flex;
  border-radius: 0.6vw;
  border: 0.15vw solid black;

  margin: 4% 0 0 0;
  min-height: 3vw;
  width: 100%;
  font-size: 1vw;
  align-items: center;
  padding-left: 1vw;
  background-color: white;
`;

const PopOverButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.4vw;
  font-size: 1vw;
  width: 19vw;
  border-color: transparent;
  background-color: white;
  &:hover {
    sort: brightness(0.8);
    cursor: pointer;
  }
`;
