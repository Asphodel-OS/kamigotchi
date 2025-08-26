import styled from 'styled-components';

import { playClick } from 'utils/sounds';

export const Tabs = ({
  tab,
  setTab: _setTab,
}: {
  tab: string;
  setTab: (tab: string) => void;
}) => {
  // layer on a sound effect
  const setTab = async (tab: string) => {
    playClick();
    _setTab(tab);
  };

  return (
    <Container>
      <Button
        onClick={() => setTab('allies')}
        disabled={tab === 'allies'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Allies
      </Button>
      <Button onClick={() => setTab('enemies')} disabled={tab === 'enemies'}>
        Enemies
      </Button>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
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
