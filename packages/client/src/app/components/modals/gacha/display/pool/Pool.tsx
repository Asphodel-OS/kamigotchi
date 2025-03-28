import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami/types';
import { Filter, Sort, TabType, ViewMode } from '../../types';
import { AuctionView } from '../auctions/AuctionView';
import { PoolView } from './KamiView';

interface Props {
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
    auction: Auction;
    entities: EntityIndex[];
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
  };
  isVisible: boolean;
}

export const Pool = (props: Props) => {
  const { controls, caches, data, utils, isVisible } = props;
  const { mode } = controls;
  const { auction } = data;

  return (
    <Container isVisible={isVisible}>
      <PoolView
        controls={controls}
        caches={caches}
        data={data}
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
  overflow-y: auto;
`;
