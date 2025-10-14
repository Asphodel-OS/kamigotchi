import styled from 'styled-components';

import { EntityIndex } from 'engine/recs';
import { Account } from 'network/shapes/Account';
import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami/types';
import { Filter, Sort, TabType, ViewMode } from '../../types';
import { AuctionView } from '../auctions/AuctionView';
import { KamiView } from './KamiView';

export const Pool = ({
  controls,
  caches,
  data,
  state,
  utils,
  isVisible,
}: {
  controls: {
    tab: TabType;
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    filters: Filter[];
    sorts: Sort[];
  };
  caches: {
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  data: {
    account: Account;
    auction: Auction;
    entities: EntityIndex[];
  };
  state: {
    tick: number;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
  };
  isVisible: boolean;
}) => {
  const { mode } = controls;
  const { auction } = data;

  return (
    <Container isVisible={isVisible}>
      <KamiView
        controls={controls}
        caches={caches}
        data={data}
        state={state}
        utils={utils}
        isVisible={isVisible && mode === 'DEFAULT'}
      />
      <AuctionView auction={auction} isVisible={mode === 'ALT'} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
`;

const Text = styled.div<{ size: number }>`
  color: black;
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 1.5}vw;
`;
