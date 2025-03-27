import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
import { Chart } from '../auction/Chart';

export interface Props {
  data: {
    auction: Auction;
  };
  isVisible: boolean;
}

export const AuctionView = (props: Props) => {
  const { data, isVisible } = props;
  const { auction } = data;

  return (
    <Container isVisible={isVisible}>
      <Chart name='Reroll Tickets' auction={auction} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  width: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column wrap;
  align-items: flex-start;
  justify-content: space-around;
`;
