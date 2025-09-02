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
  StudioMenuButton,
  PartyMenuButton,
  SudoMenuButton,
} from './buttons';

export const LeftMenuFixture: UIComponent = {
  id: 'LeftMenuFixture',
  Render: () => {
    const layers = useLayers();

    const { nodeEntity } = (() => {
      const { network } = layers;
      const { world } = network;
      const { roomIndex } = useSelected.getState();
      let nodeEntity = queryNodeByIndex(world, roomIndex);
      return { nodeEntity };
    })();

    const { fixtures } = useVisibility();

    if (!fixtures.menu) return null;

    return (
      <Wrapper>
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
  justify-self: start;

  @media (max-aspect-ratio: 11/16) {
    justify-self: stretch;

    > * {
      flex: 1;

      button {
        width: 100%;
      }
    }

    > :nth-child(5),
    > :nth-child(6) {
      display: none;
    }
  }

  font-size: clamp(0.5rem, 1vmax, 0.66rem);

  display: flex;
  gap: 0.6em;
`;
