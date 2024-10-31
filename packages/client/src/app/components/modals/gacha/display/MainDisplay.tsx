import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Kami, KamiOptions } from 'network/shapes/Kami';
import { GachaKami } from 'network/shapes/Kami/types';
import { Filter, Sort, TabType } from '../types';
import { Pool } from './Pool';

interface Props {
  tab: TabType;
  controls: {
    limit: number;
    filters: Filter[];
    sorts: Sort[];
  };
  caches: {
    kamis: Map<EntityIndex, GachaKami>;
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  data: {
    poolEntities: EntityIndex[];
    partyEntities: EntityIndex[];
  };
  utils: {
    getGachaKami: (entity: EntityIndex) => GachaKami;
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
  };
}

export const MainDisplay = (props: Props) => {
  const { tab, controls, data, caches, utils } = props;
  const { partyEntities, poolEntities } = data;
  const display = tab === 'MINT' ? 'flex' : 'none';

  return (
    <Container style={{ display }}>
      <Pool
        controls={controls}
        caches={caches}
        data={{ entities: poolEntities }}
        utils={utils}
        isVisible={tab === 'MINT'}
      />
    </Container>
  );
};

const Container = styled.div`
  background-color: #beb;
  max-height: 100%;
  width: 100%;
  border-radius: 0 0 0 1.2vw;

  display: flex;
  flex-direction: row;

  overflow-y: scroll;
`;
