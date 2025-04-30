import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  tab: string;
  isSelf: boolean;
  setTab: (tab: string) => void;
}

export const Tabs = (props: Props) => {
  // layer on a sound effect
  const setTab = async (tab: string) => {
    playClick();
    props.setTab(tab);
  };

  const Tabs = () => {
    return (
      <>
        {' '}
        <Button onClick={() => setTab('stats')} disabled={props.tab === 'stats'}>
          Stats
        </Button>
        <Button
          onClick={() => setTab('social')}
          disabled={props.tab === 'social'}
          style={{ borderLeft: 'solid black 0.15vw', borderRight: 'solid black 0.15vw' }}
        >
          Social
        </Button>
        <Button onClick={() => setTab('party')} disabled={props.tab === 'party'}>
          Party
        </Button>
      </>
    );
  };

  return <Container>{Tabs()}</Container>;
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.3vw 0.3vw 0 0;
  border-bottom: none;

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
