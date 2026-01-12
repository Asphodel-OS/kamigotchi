import styled from 'styled-components';

import { playClick } from 'utils/sounds';

export const Tabs = ({
  tab,
  setTab: _setTab,
}: {
  tab: TabType;
  setTab: (tab: TabType) => void;
}) => {
  // layer on a sound effect
  const setTab = async (tab: TabType) => {
    playClick();
    _setTab(tab);
  };

  return (
    <Container>
      <Button
        onClick={() => setTab('AVAILABLE')}
        disabled={tab === 'AVAILABLE'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Available
      </Button>
      <Button onClick={() => setTab('ONGOING')} disabled={tab === 'ONGOING'}>
        Accepted
      </Button>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  border-top: solid black 0.15vw;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const Button = styled.button`
  border: none;
  padding: 0.5vw;
  flex-grow: 1;
  color: black;
  justify-content: center;

  font-family: Pixel;
  font-size: 1vw;
  text-align: center;

  cursor: pointer;
  pointer-events: auto;
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
