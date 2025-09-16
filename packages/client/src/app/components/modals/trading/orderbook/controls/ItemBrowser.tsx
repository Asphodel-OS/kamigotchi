import { Dispatch } from 'react';
import styled from 'styled-components';

import { TradeType } from 'app/cache/trade';
import { Item } from 'network/shapes';

export type CategoryKey = string; // dynamic categories plus grouped: 'All' | 'Consumables' | 'Materials' | 'Currencies'

export const ItemBrowser = ({
  items,
  selected,
  setSelected,
  typeFilter,
}: {
  items: Item[];
  selected: Item;
  setSelected: Dispatch<Item>;
  typeFilter: TradeType;
}) => {
  return (
    <Container>
      <Table>
        <thead>
          <Header>
            <th>Item</th>
            <th>Type</th>
          </Header>
        </thead>
        <tbody>
          {items.map((item) => (
            <DataRow
              key={item.index}
              color={typeFilter === 'Buy' ? '#e9ffe9' : '#ffe9e9'}
              selected={item.index === selected.index}
              onClick={() => setSelected(item)}
            >
              <td>
                <RowItem>
                  <Thumb src={item.image} alt={item.name} />
                  <RowName title={item.name}>{item.name}</RowName>
                </RowItem>
              </td>
              <td>{item.type}</td>
            </DataRow>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

const Container = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  overflow: auto;
  scrollbar-color: auto;
`;

const Header = styled.tr`
  border-bottom: 0.12vw solid black;
  background: #e6e6e6;
  position: sticky;
  top: 0;
  opacity: 0.9;
  z-index: 1;

  & > th {
    padding: 0.45vw 0.6vw;
    text-align: left;
    font-size: 0.9vw;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  padding: 0.6vw;
`;

const DataRow = styled.tr<{ selected: boolean; color: string }>`
  cursor: pointer;
  background: ${({ selected, color }) => (selected ? color : 'transparent')};
  & > td {
    padding: 0.45vw 0.6vw;
    border-bottom: 0.06vw solid #ccc;
    font-size: 0.9vw;
  }
`;

const RowItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
`;

const RowName = styled.div`
  max-width: 18vw;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Thumb = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  image-rendering: pixelated;
`;
