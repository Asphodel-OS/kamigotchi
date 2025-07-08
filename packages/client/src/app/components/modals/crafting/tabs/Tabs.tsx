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
      {' '}
      <Button onClick={() => setTab('consumables')} disabled={props.tab === 'consumables'}>
        Consumables
      </Button>{' '}
      <Button onClick={() => setTab('materials')} disabled={props.tab === 'materials'}>
        Materials
      </Button>
      <Button onClick={() => setTab('reagents')} disabled={props.tab === 'reagents'}>
        Reagents
      </Button>
      <Button
        onClick={() => setTab('special')}
        disabled={props.tab === 'special'}
        style={{ borderRight: 'none' }}
      >
        Special
      </Button>
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.3vw 0.3vw 0 0;

  margin-bottom: 0.6vw;
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
  border-right: solid black 0.15vw;

  font-size: 0.9vw;
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
