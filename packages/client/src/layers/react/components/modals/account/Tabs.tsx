import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  tab: string;
  setTab: (tab: string) => void;
}

export const Tabs = (props: Props) => {

  // layer on a sound effect
  const setTab = async (tab: string) => {
    playClick();
    props.setTab(tab);
  }

  return (
    <Container>
      <Button
        onClick={() => setTab('party')}
        disabled={props.tab === 'party'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Party
      </Button>
      <Button
        onClick={() => setTab('frens')}
        disabled={props.tab === 'frens'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Friends
      </Button>
      <Button
        onClick={() => setTab('activity')}
        disabled={props.tab === 'activity'}
      >
        Activity
      </Button>
    </Container>
  );
}

const Container = styled.div`
  border: solid .15vw black;
  border-radius: .3vw .3vw 0 0;
  border-bottom: none;

  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const Button = styled.button`
  border: none;
  padding: .5vw;
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