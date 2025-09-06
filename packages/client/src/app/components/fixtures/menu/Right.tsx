import { of } from 'rxjs';

import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import styled from 'styled-components';
import {
  ChatMenuButton,
  CraftMenuButton,
  InventoryMenuButton,
  MoreMenuButton,
  QuestMenuButton,
} from './buttons';

export const RightMenuFixture: UIComponent = {
  id: 'RightMenuFixture',
  requirement: (layers) => of(layers),
  Render: () => {
    const menuVisible = useVisibility((s) => s.fixtures.menu);
    return (
      <>
        <Wrapper style={{ display: menuVisible ? 'flex' : 'none' }}>
          <CraftMenuButton />
          <InventoryMenuButton />
          <QuestMenuButton />
          <ChatMenuButton />
          <MoreMenuButton />
        </Wrapper>
        <Wrapper style={{ display: menuVisible ? 'none' : 'flex' }}>
          <MoreMenuButton />
        </Wrapper>
      </>
    );
  },
};

const Wrapper = styled.div`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.32vw;
  gap: 0.6vh;
  position: relative;
  z-index: 3;
`;
