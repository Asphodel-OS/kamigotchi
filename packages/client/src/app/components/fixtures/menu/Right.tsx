import { of } from 'rxjs';

import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/store';
import styled from 'styled-components';
import {
  ChatMenuButton,
  HelpMenuButton,
  InventoryMenuButton,
  LoginMenuButton,
  QuestMenuButton,
  SettingsMenuButton,
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
        <Wrapper style={{ display: fixtures.menu ? 'flex' : 'none' }}>
          <ChatMenuButton />
          <QuestMenuButton />
          <InventoryMenuButton />
          <SettingsMenuButton />
          <HelpMenuButton />
          <LoginMenuButton />
        </Wrapper>
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
