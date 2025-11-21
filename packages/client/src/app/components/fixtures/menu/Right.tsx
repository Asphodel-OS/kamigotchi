import { TextTooltip } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { SearchIcon } from 'assets/images/icons/actions';
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
      <>
        <Wrapper style={{ display: menuVisible ? 'flex' : 'none' }}>
          <TextTooltip text={['Hold shift for kamivision to highlight objects']}>
            <HiddenObjects
              src={SearchIcon}
              onMouseEnter={() => useSelected.setState({ showHidden: true })}
              onMouseLeave={() => useSelected.setState({ showHidden: false })}
            />
          </TextTooltip>

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
  pointer-events: none;
`;

const HiddenObjects = styled.img`
  width: 2vw;
  height: 2vw;

  pointer-events: auto;
  &:hover {
    cursor: pointer;
    opacity: 0.5;
  }
`;
