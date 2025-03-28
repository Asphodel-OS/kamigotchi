import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { ActionButton, Overlay } from 'app/components/library';
import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami/types';
import { Filter, Sort, TabType, ViewMode } from '../../types';
import { AuctionView } from '../auction/AuctionView';
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
  const { mode, setMode } = controls;
  const { auction } = data;

  /////////////////
  // INTERACTION

  const toggleMode = () => {
    if (mode === 'DEFAULT') setMode('ALT');
    else setMode('DEFAULT');
  };

  const getButtonText = () => {
    if (mode === 'DEFAULT') return 'Get More Gacha Tickets';
    else return 'Back to Gacha';
  };

  /////////////////
  // DISPLAY

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
      <Overlay bottom={0.9} right={0.6}>
        <ActionButton text={getButtonText()} onClick={toggleMode} />
      </Overlay>
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
