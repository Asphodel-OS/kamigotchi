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
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  border-bottom: 0.15vw solid black;
`;

const Button = styled.button`
  border: none;
  padding: 1.2vw;
  justify-content: center;
  background-color: white;

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
    background-color: #b2b2b2;
    cursor: default;
    pointer-events: none;
  }
`;
