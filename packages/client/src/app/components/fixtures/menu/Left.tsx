import styled from 'styled-components';

import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { queryNodeByIndex } from 'network/shapes/Node';
import {
  AccountMenuButton,
  MapMenuButton,
  NodeMenuButton,
  OnyxMenuButton,
  PartyMenuButton,
  StudioMenuButton,
  SudoMenuButton,
} from './buttons';

export const LeftMenuFixture: UIComponent = {
  id: 'LeftMenuFixture',
  Render: () => {
    const layers = useLayers();
    const menuVisible = useVisibility((s) => s.fixtures.menu);

    /////////////////
    // PREPARATION

    const { nodeEntity } = (() => {
      const { network } = layers;
      const { world } = network;
      const roomIndex = useSelected((s) => s.roomIndex);
      return { nodeEntity: queryNodeByIndex(world, roomIndex) };
    })();

    /////////////////
    // RENDER

    return (
      <Wrapper style={{ display: menuVisible ? 'flex' : 'none' }}>
        <AccountMenuButton />
        <PartyMenuButton />
        <MapMenuButton />
        <NodeMenuButton disabled={!nodeEntity} />
        <SudoMenuButton />
        <OnyxMenuButton />
        <StudioMenuButton />
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
