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
  Render: () => {
    const menuVisible = useVisibility((s) => s.fixtures.menu);

    return (
      <Wrapper>
        {menuVisible && (
          <>
            <CraftMenuButton />
            <InventoryMenuButton />
            <QuestMenuButton />
            <ChatMenuButton />
          </>
        )}
        <MoreMenuButton />
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  justify-self: end;

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
