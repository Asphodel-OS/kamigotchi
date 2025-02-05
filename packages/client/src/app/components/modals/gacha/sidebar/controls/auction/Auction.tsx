import styled from 'styled-components';

import { AuctionMode, TabType } from '../../../types';

interface Props {
  controls: {
    quantity: number;
    setQuantity: (quantity: number) => void;
    price: number;
    setPrice: (price: number) => void;
  };
  state: {
    mode: AuctionMode;
    setMode: (mode: AuctionMode) => void;
    tab: TabType;
    tick: number;
  };
}

export const Auction = (props: Props) => {
  const { controls, state } = props;
  const { quantity, setQuantity, price, setPrice } = controls;
  const { mode, setMode, tab, tick } = state;

  return (
    <Container>
      <Row>
        <Text>Auction Mode: {mode}</Text>
        <Text>Estimated Price: {price}</Text>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;

  overflow-y: scroll;
`;

const Row = styled.div`
  padding: 0 0.3vw;
  gap: 0.3vw;

  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
`;

const Text = styled.div`
  height: 1.2vw;
  margin-top: 0.6vw;
  font-size: 1vw;
  color: #333;
`;
