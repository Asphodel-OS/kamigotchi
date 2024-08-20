import { interval, map } from 'rxjs';

import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { getNodeByIndex } from 'network/shapes/Node';
import styled from 'styled-components';
import { AccountMenuButton, MapMenuButton, NodeMenuButton, PartyMenuButton } from './buttons';

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
          const { world, components } = network;
          const { roomIndex } = useSelected.getState();
          let node = getNodeByIndex(world, components, roomIndex);
          return { data: { node } };
        })
      ),
    ({ data }) => {
      const { node } = data;
      const { fixtures } = useVisibility();

      return (
        <Wrapper style={{ display: fixtures.menu ? 'flex' : 'none' }}>
          <AccountMenuButton />
          <PartyMenuButton />
          <MapMenuButton />
          <NodeMenuButton disabled={!node || node.index == 0} />
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
