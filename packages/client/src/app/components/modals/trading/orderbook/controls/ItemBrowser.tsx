import { Dispatch } from 'react';
import styled from 'styled-components';

import { TradeType } from 'app/cache/trade';
import { Item, Trade } from 'network/shapes';

export type CategoryKey = string; // dynamic categories plus grouped: 'All' | 'Consumables' | 'Materials' | 'Currencies'

export const ItemBrowser = ({
  controls,
  data,
}: {
  controls: {
    selected: Item;
    setSelected: Dispatch<Item>;
    typeFilter: TradeType;
  };
  data: {
    items: Item[];
    trades: Trade[];
  };
}) => {
  const { selected, setSelected, typeFilter } = controls;
  const { items, trades } = data;

  // get the number of trades containing a particular item (filtered by type)
  // NOTE: perhaps do it by orderbook musu depth instead?
  const getNumTrades = (item: Item) => {
    let count = 0;
    trades.forEach((trade) => {
      let orderItems: Item[] = [];
      if (typeFilter === 'Buy') orderItems = trade.sellOrder?.items ?? [];
      else if (typeFilter === 'Sell') orderItems = trade.buyOrder?.items ?? [];
      if (orderItems.some((it) => it.index === item.index)) count++;
    });
    return count;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Table>
        <thead>
          <Header>
            <th>Item</th>
            <th>Type</th>
            <th>Count</th>
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
              <td>{getNumTrades(item)}</td>
            </DataRow>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

const Container = styled.div`
  width: 70%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
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
    font-size: 0.7vw;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  padding: 0.6vw;

  th:nth-child(1), td:nth-child(1) { width: 60%; }
  th:nth-child(2), td:nth-child(2) { width: 30%; }
  th:nth-child(3), td:nth-child(3) { width: 10%; }
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

const RowName = styled.div``;

const Thumb = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  image-rendering: pixelated;
`;
