import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Item } from 'network/shapes/Item';

interface Props {
  isVisible: boolean;
  data: {
    balance: number;
    payItem: Item;
    saleItem: Item;
  };
  state: {
    price: number;
    quantity: number;
  };
}

export const PricePanel = (props: Props) => {
  const { data, state, isVisible } = props;
  const { payItem, saleItem } = data;
  const { price, quantity } = state;

  return (
    <Container isVisible={isVisible}>
      <EmptyText
        text={[`Total Price ${price} ${payItem.name}`, `for ${quantity} ${saleItem.name}(s)`]}
      />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: flex-start;
`;
