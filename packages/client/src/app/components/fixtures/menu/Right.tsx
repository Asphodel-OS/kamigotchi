import { of } from 'rxjs';

import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import styled from 'styled-components';
import {
  ChatMenuButton,
  CraftMenuButton,
  InventoryMenuButton,
  MoreMenuButton,
  QuestMenuButton,
} from './buttons';

export function registerMenuRight() {
  registerUIComponent(
    'RightMenuFixture',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 3,
      rowEnd: 6,
    },
    (layers) => of(layers),
    () => {
      const { fixtures } = useVisibility();
      return (
        <>
          <Wrapper style={{ display: fixtures.menu ? 'flex' : 'none' }}>
            <InventoryMenuButton />
            <CraftMenuButton />
            <QuestMenuButton />
            <ChatMenuButton />
            <MoreMenuButton />
          </Wrapper>
          <Wrapper style={{ display: fixtures.menu ? 'none' : 'flex' }}>
            <MoreMenuButton />
          </Wrapper>
        </>
      );
    }
  );
}

const Wrapper = styled.div`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.32vw;
  gap: 0.6vh;
`;
