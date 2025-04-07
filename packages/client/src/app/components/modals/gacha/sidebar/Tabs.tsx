import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { TABS, TabType } from '../types';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

export const Tabs = (props: Props) => {
  const { tab, setTab } = props;

  // layer on a sound effect
  const handleTab = async (tab: TabType) => {
    playClick();
    setTab(tab);
  };

  return (
    <Container>
      {TABS.map((t, i) => (
        <Button
          key={t}
          onClick={() => handleTab(t)}
          disabled={tab === t}
          style={{ borderLeft: i == 0 ? '' : 'solid black .15vw' }}
        >
          {t.toLowerCase()}
        </Button>
      ))}
    </Container>
  );
};

const Container = styled.div`
  border-bottom: 0.15vw solid black;

  display: flex;
  width: 100%;

  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-around;
`;

const Button = styled.button`
  border: none;
  padding: 1.2vw;
  justify-content: center;
  align-items: center;
  width: 100%;

  font-size: 1.2vw;
  text-align: center;

  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  &:active {
    background-color: #111;
  }
  &:hover {
    background-color: #ddd;
  }
  &:disabled {
    background-color: #bbb;
    cursor: default;
    pointer-events: none;
  }
`;
