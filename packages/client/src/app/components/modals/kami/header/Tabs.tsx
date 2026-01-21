import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { TabType } from '../Kami';

export const Tabs = ({
  tab,
  setTab: setTabProp,
}: {
  tab: TabType;
  setTab: (tab: TabType) => void;
}) => {
  // layer on a sound effect
  const setTab = async (tab: TabType) => {
    playClick();
    setTabProp(tab);
  };

  return (
    <Container>
      <Button
        onClick={() => setTab('TRAITS')}
        disabled={tab === 'TRAITS'}
        $hasBorder
      >
        Traits
      </Button>
      <Button
        onClick={() => setTab('SKILLS')}
        disabled={tab === 'SKILLS'}
        $hasBorder
      >
        Skills
      </Button>
      <Button onClick={() => setTab('BATTLES')} disabled={tab === 'BATTLES'}>
        Battles
      </Button>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  background-color: var(--bg-primary, white);
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  user-select: none;
`;

const Button = styled.button<{ $hasBorder?: boolean }>`
  border: none;
  ${({ $hasBorder }) => $hasBorder && 'border-right: solid var(--border-primary, black) 0.15vw;'}
  padding: 0.5vw;
  flex-grow: 1;
  color: var(--text-primary, black);
  background-color: var(--bg-primary, white);
  justify-content: center;

  font-size: 1vw;
  text-align: center;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: var(--hover-bg, #ddd);
  }
  &:active {
    background-color: var(--active-bg, #bbb);
  }
  &:disabled {
    background-color: var(--disabled-bg, #bbb);
    cursor: default;
    pointer-events: none;
  }
`;
