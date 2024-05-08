import { of } from 'rxjs';

import { registerUIComponent } from 'layers/react/engine/store';
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
      return (
        <Wrapper>
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
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 0.9vh;
`;
