import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
import { TabType, ViewMode } from '../../types';
import { Chart } from './Chart';

export interface Props {
  data: {
    auctions: {
      gacha: Auction;
      reroll: Auction;
    };
  };
  state: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    tab: TabType;
  };
}

export const AuctionDisplay = (props: Props) => {
  const { data, state } = props;
  const { gacha } = data.auctions;
  const { setMode } = state;

  return (
    <Container>
      <Chart name='Gacha Tickets' auction={gacha} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;

  display: flex;
  flex-flow: column wrap;
  align-items: flex-start;
  justify-content: space-around;
`;
