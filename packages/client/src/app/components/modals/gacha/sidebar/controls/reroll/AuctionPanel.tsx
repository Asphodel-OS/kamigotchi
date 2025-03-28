import { EmptyText } from 'app/components/library';
import styled from 'styled-components';

interface Props {
  state: {
    price: number;
    quantity: number;
  };
  isVisible: boolean;
}

export const AuctionPanel = (props: Props) => {
  const { state, isVisible } = props;
  const { price, quantity } = state;

  return (
    <Container isVisible={isVisible}>
      <EmptyText text={[`Total Price ${price} ONYX`, `for ${quantity} Reroll Tickets`]} />
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
