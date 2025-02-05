import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
import { AuctionMode, TabType } from '../../types';
import { Chart } from './Chart';

export interface Props {
  data: {
    auctions: {
      gacha: Auction;
      reroll: Auction;
    };
  };
  state: {
    mode: AuctionMode;
    setMode: (mode: AuctionMode) => void;
    tab: TabType;
  };
}

export const AuctionDisplay = (props: Props) => {
  const { data, state } = props;
  const { gacha, reroll } = data.auctions;
  const { setMode } = state;

  return (
    <Container>
      <Chart name='Gacha Tickets' auction={gacha} onClick={() => setMode('GACHA')} />
      <Chart name='Reroll Tickets' auction={reroll} onClick={() => setMode('REROLL')} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  padding: 0.6vw;
  width: 100%;

  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: center;
`;
