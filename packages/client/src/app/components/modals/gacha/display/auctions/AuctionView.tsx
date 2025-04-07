import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
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

  return (
    <Container isVisible={isVisible}>
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
