import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Trade } from 'network/shapes/Trade/types';
import { Offer } from './Offer';

interface Props {
  actions: {
    cancelTrade: (trade: Trade) => void;
  };
  data: { trades: Trade[] };
}

export const Offers = (props: Props) => {
  const { actions, data } = props;
  const { trades } = data;

  return (
    <Container>
      <Title>Your Active Offers </Title>
      <Body>
        {trades.map((trade, i) => (
          <Offer key={i} actions={actions} data={{ trade }} />
        ))}
      </Body>
      {trades.length === 0 && <EmptyText text={['You have no active trades']} />}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 60%;

  display: flex;
  flex-direction: column;
  align-items: center;

  overflow: hidden scroll;
  scrollbar-color: transparent transparent;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  padding: 1.8vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 2;
`;

const Body = styled.div`
  position: relative;
  height: max-content;
  width: 100%;

  padding: 0.9vw;
  gap: 0.9vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`;
