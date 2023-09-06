import styled from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore } from 'layers/react/store/createStore';


interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

export const Tabs = (props: Props) => {
  const { sound: { volume } } = dataStore();

  // layer on a sound effect
  const setTab = async (tab: TabType) => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    await props.setTab(tab);
  }

  return (
    <Container>
      <Button
        onClick={() => setTab('AVAILABLE')}
        disabled={props.tab === 'AVAILABLE'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Available
      </Button>
      <Button
        onClick={() => setTab('ONGOING')}
        disabled={props.tab === 'ONGOING'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Ongoing
      </Button>
      <Button
        onClick={() => setTab('COMPLETED')}
        disabled={props.tab === 'COMPLETED'}
      >
        Completed
      </Button>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  border-top: solid black .15vw;
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