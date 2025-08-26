import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami';
import { TabType, ViewMode } from '../../types';
import { AuctionView } from '../auctions/AuctionView';
import { KamiView } from './KamiView';

export const Reroll = ({
  controls,
  data,
  isVisible,
  state,
  utils,
}: {
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    tab: TabType;
  };
  data: {
    account: Account;
    auction: Auction;
  };
  state: {
    setQuantity: (balance: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (selectedKamis: Kami[]) => void;
    tick: number;
  };
  utils: {
    getAccountKamis: () => Kami[];
  };
  isVisible: boolean;
}) => {
  const { mode } = controls;
  const { auction } = data;

  return (
    <Container isVisible={isVisible}>
      <KamiView data={data} state={state} utils={utils} isVisible={mode === 'DEFAULT'} />
      <AuctionView auction={auction} isVisible={mode === 'ALT'} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  overflow-y: scroll;
`;
