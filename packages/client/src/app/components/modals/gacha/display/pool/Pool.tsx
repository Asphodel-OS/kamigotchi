import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { Overlay } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami/types';
import { formatCountdown } from 'utils/time';
import { Filter, Sort, TabType, ViewMode } from '../../types';
import { AuctionView } from '../auctions/AuctionView';
import { KamiView } from './KamiView';

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
    account: Account;
    auction: Auction;
    entities: EntityIndex[];
    mintConfig: GachaMintConfig;
  };
  state: {
    tick: number;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
  };
  isVisible: boolean;
}

export const Pool = (props: Props) => {
  const { controls, caches, data, state, utils, isVisible } = props;
  const { mode } = controls;
  const { auction, mintConfig } = data;
  const { tick } = state;

  const getTimeLeft = () => {
    const now = tick / 1000;
    const start = mintConfig.public.startTs + 3600;
    return Math.max(start - now, 0);
  };

  return (
    <Container isVisible={isVisible}>
      {mode === 'DEFAULT' && getTimeLeft() > 0 && (
        <Overlay orientation='column' opacity={0.6} zIndex={1} fullWidth fullHeight passthrough>
          <Text size={3}>No Running</Text>
          <Text size={3}>Around the Pool</Text>
          <Text size={3}>{formatCountdown(getTimeLeft())}</Text>
        </Overlay>
      )}
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
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
