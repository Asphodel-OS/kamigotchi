import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Kami } from 'network/shapes/Kami';
import { TabType } from '../types';
import { Pool } from './Pool';

interface Props {
  tab: TabType;
  lazyKamis: Array<() => Kami>;
  actions: {
    handleMint: (amount: number) => Promise<void>;
  };
  data: {
    kamiEntities: EntityIndex[];
  };
}

export const MainDisplay = (props: Props) => {
  const { tab, actions, data } = props;
  const { kamiEntities } = data;
  const display = tab === 'MINT' ? 'flex' : 'none';

  return (
    <Container style={{ display }}>
      <Pool lazyKamis={props.lazyKamis} isVisible={tab === 'MINT'} />
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
