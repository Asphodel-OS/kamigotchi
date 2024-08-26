import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Kami, KamiOptions } from 'network/shapes/Kami';
import { BaseKami } from 'network/shapes/Kami/types';
import { Filter, TabType } from '../types';
import { Pool } from './Pool';

interface Props {
  tab: TabType;
  limit: number;
  filters: Filter[];
  caches: {
    kamis: Map<EntityIndex, Kami>;
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  data: {
    poolEntities: EntityIndex[];
    partyEntities: EntityIndex[];
  };
  utils: {
    getBaseKami: (entity: EntityIndex) => BaseKami;
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
  };
}

export const MainDisplay = (props: Props) => {
  const { tab, limit, filters, data, caches, utils } = props;
  const { partyEntities, poolEntities } = data;
  const display = tab === 'MINT' ? 'flex' : 'none';

  return (
    <Container style={{ display }}>
      <Pool
        limit={limit}
        filters={filters}
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
