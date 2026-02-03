import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { TABS, TabType } from '../types';

export const Tabs = ({
  tab,
  setTab,
}: {
  tab: TabType;
  setTab: (tab: TabType) => void;
}) => {
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
          style={{ borderLeft: i == 0 ? '' : 'solid black .15em' }}
        >
          {t.toLowerCase()}
        </Button>
      ))}
    </Container>
  );
};

const Container = styled.div`
  border-bottom: 0.15em solid black;

  display: flex;
  width: 100%;

  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-around;
`;

const Button = styled.button`
  border: none;
  padding: 1.2em;
  justify-content: center;
  align-items: center;
  width: 100%;

  font-size: 1.2em;
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
