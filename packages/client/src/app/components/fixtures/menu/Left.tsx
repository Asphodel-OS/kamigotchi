import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { registerUIComponent } from 'app/root';
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

export function registerMenuLeft() {
  registerUIComponent(
    'LeftMenuFixture',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 3,
      rowEnd: 6,
    },
    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world } = network;
          const { roomIndex } = useSelected.getState();
          let nodeEntity = queryNodeByIndex(world, roomIndex);
          return { nodeEntity };
        })
      ),
    ({ nodeEntity }) => {
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
    }
  );
}

const Wrapper = styled.div`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6vh;
`;
