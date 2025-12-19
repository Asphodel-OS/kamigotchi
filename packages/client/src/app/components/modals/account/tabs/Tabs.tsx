import styled from 'styled-components';

import { playClick } from 'utils/sounds';

export const Tabs = ({
  tab,
  isSelf,
  setTab: _setTab,
}: {
  tab: string;
  isSelf: boolean;
  setTab: (tab: string) => void;
}) => {
  // layer on a sound effect
  const setTab = async (tab: string) => {
    playClick();
    _setTab(tab);
  };

  const Tabs = () => {
    return (
      <>
        <Button onClick={() => setTab('stats')} disabled={tab === 'stats'}>
          Stats
        </Button>
        <Button
          onClick={() => setTab('social')}
          disabled={tab === 'social'}
          style={{ borderLeft: 'solid black 0.15em', borderRight: 'solid black 0.15em' }}
        >
          Social
        </Button>
        <Button onClick={() => setTab('party')} disabled={tab === 'party'}>
          Party
        </Button>
      </>
    );
  };

  return <Container>{Tabs()}</Container>;
};

const Container = styled.div`
  border: solid 0.15em black;
  border-radius: 0.3em 0.3em 0 0;
  border-bottom: none;

  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const Button = styled.button`
  border: none;
  padding: 0.5em;
  flex-grow: 1;
  color: black;
  justify-content: center;

  font-family: Pixel;
  font-size: 1em;
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
