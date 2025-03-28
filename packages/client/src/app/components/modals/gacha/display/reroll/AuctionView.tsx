import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
import { ViewMode } from '../../types';
import { Chart } from '../auction/Chart';

export interface Props {
  auction: Auction;
  mode: ViewMode;
  isVisible: boolean;
}

export const AuctionView = (props: Props) => {
  const { auction, mode, isVisible } = props;

  return (
    <Container isVisible={isVisible}>
      <Chart name='Reroll Tickets' auction={auction} mode={mode} />
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
