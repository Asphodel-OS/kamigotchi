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
    const { fixtures } = useVisibility();

    return (
      <Wrapper>
        {fixtures.menu ? <>
          <CraftMenuButton />
          <InventoryMenuButton />
          <QuestMenuButton />
          <ChatMenuButton />
        </> : <>
          <MoreMenuButton />
        </>}
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  justify-self: end;

  font-size: clamp(0.5rem, 1vmax, 0.66rem);

  display: flex;
  gap: 0.6em;
`;
