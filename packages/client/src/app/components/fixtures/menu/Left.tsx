import { useMemo } from 'react';
import styled from 'styled-components';

import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useSelected, useVisibility } from 'app/stores';
import { queryNodeByIndex } from 'network/shapes/Node';
import {
  AccountMenuButton,
  MapMenuButton,
  NodeMenuButton,
  OnyxMenuButton,
  PartyMenuButton,
  SudoMenuButton,
} from './buttons';

export const LeftMenuFixture: UIComponent = {
  id: 'LeftMenuFixture',
  Render: () => {
    const layers = useLayers();
  
    const { nodeEntity } = useMemo(() => {
      const { network } = layers;
      const { world } = network;
      const { roomIndex } = useSelected.getState();
      let nodeEntity = queryNodeByIndex(world, roomIndex);
      return { nodeEntity };
    }, [layers]);

    const { fixtures } = useVisibility();

    return (
      <Wrapper style={{ display: fixtures.menu ? 'flex' : 'none' }}>
        <AccountMenuButton />
        <PartyMenuButton />
        <MapMenuButton />
        <NodeMenuButton disabled={!nodeEntity} />
        <SudoMenuButton />
        <OnyxMenuButton />
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6vh;
`;
