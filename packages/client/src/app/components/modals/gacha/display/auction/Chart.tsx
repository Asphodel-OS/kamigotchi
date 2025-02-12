import styled from 'styled-components';

import { calcAuctionPrice } from 'app/cache/auction';
import { Auction } from 'network/shapes/Auction';

interface Props {
  name: string;
  auction: Auction;
  // history: number[];
  onClick?: () => void;
}

export const Chart = (props: Props) => {
  const { name, auction, onClick } = props;
  return (
    <Container onClick={onClick}>
      <Title>{name}</Title>
      <Text>
        current price: {calcAuctionPrice(auction, 1)} {auction.paymentItem?.name}
      </Text>
      <Text>
        sold: {auction.supply.sold} / {auction.supply.total}
      </Text>
    </Container>
  );
};

const Container = styled.div`
  background-color: white;
  position: relative;
  width: 100%;

  padding: 0.6vw;
  margin: 0.6vw;
  gap: 0.6vw;

  flex-grow: 1;
  display: flex;
  flex-flow: column wrap;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.8;
    cursor: pointer;
    text-decoration: underline;
  }
`;

const Title = styled.div`
  color: black;
  font-size: 1.8vw;
`;

const Text = styled.div`
  color: black;
  font-size: 1.2vw;
`;
