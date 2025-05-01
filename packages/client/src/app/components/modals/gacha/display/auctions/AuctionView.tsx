import styled from 'styled-components';

import { Overlay } from 'app/components/library';
import { Auction } from 'network/shapes/Auction';
import { formatCountdown } from 'utils/time';
import { Chart } from './Chart';

export interface Props {
  auction: Auction;
  isVisible: boolean;
}

export const AuctionView = (props: Props) => {
  const { auction, isVisible } = props;

  const getAuctionTitle = () => {
    if (!auction.auctionItem) return '??? Auction';
    const itemName = auction.auctionItem.name;
    return `${itemName} Auction`;
  };

  const getTimeLeft = () => {
    const now = Date.now() / 1000;
    const start = auction.time.start;
    return Math.max(start - now, 0);
  };

  return (
    <Container isVisible={isVisible}>
      {auction.time.start > Date.now() / 1000 && (
        <Overlay orientation='column' opacity={0.5} fullWidth>
          <Text size={3}>Auction Start</Text>
          <Text size={3}>{formatCountdown(getTimeLeft())}</Text>
        </Overlay>
      )}
      <Chart name={getAuctionTitle()} auction={auction} />
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

const Text = styled.div<{ size: number }>`
  color: black;
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
