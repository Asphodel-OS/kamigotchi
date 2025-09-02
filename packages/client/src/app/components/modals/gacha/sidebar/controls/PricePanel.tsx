import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Item } from 'network/shapes/Item';

export const PricePanel = ({
  data,
  state,
  isVisible,
}: {
  isVisible: boolean;
  data: {
    balance: number;
    payItem: Item;
    saleItem: Item;
  };
  state: {
    price: number;
    quantity: number;
    tick: number;
  };
}) => {
  const { payItem, saleItem } = data;
  const { price, quantity, tick } = state;

  const getText = () => {
    if (saleItem.index === 10 && tick / 1000 < 1747400400) {
      return [`Target 32000 ${payItem.name}`, `for 1 ${saleItem.name}`];
    }

    return [
      `Total ${price.toLocaleString()} ${payItem.name}`,
      `for ${quantity} ${saleItem.name}${quantity == 1 ? '' : 's'}`,
    ];
  };

  return (
    <Container isVisible={isVisible}>
      <EmptyText text={getText()} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6em;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: flex-start;
`;
