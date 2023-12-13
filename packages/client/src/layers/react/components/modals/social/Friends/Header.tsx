import styled from 'styled-components';
import { playClick } from 'utils/sounds';

import { TabType } from './Friends';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

export const Header = (props: Props) => {

  // layer on a sound effect
  const setTab = async (tab: TabType) => {
    playClick();
    props.setTab(tab);
  }

  return (
    <Container>
      <Button
        onClick={() => setTab('FRIENDS')}
        disabled={props.tab === 'FRIENDS'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Friends
      </Button>
      <Button
        onClick={() => setTab('INCOMING')}
        disabled={props.tab === 'INCOMING'}
      >
        Friend Requests
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