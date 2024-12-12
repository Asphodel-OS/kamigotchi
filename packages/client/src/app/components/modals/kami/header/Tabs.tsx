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
  };

  return (
    <Container>
      <Button
        onClick={() => setTab('traits')}
        disabled={props.tab === 'traits'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Traits
      </Button>
      <Button
        onClick={() => setTab('skills')}
        disabled={props.tab === 'skills'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Skills
      </Button>
      <Button onClick={() => setTab('battles')} disabled={props.tab === 'battles'}>
        Battles
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
