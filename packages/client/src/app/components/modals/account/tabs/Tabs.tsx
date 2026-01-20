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
          style={{ borderLeft: 'solid var(--border-primary, black) 0.15vw', borderRight: 'solid var(--border-primary, black) 0.15vw' }}
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
  border: solid 0.15vw var(--border-primary, black);
  border-radius: 0.3vw 0.3vw 0 0;
  border-bottom: none;

  width: 100%;
  background-color: var(--bg-primary, white);
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;;

const Button = styled.button`
  border: none;
  padding: 0.5vw;
  flex-grow: 1;
  color: var(--text-primary, black);
  background-color: var(--bg-primary, transparent);
  justify-content: center;

  font-family: Pixel;
  font-size: 1vw;
  text-align: center;

  cursor: pointer;
  pointer-events: auto;
  &:active {
    background-color: var(--active-bg, #111);
  }
  &:hover {
    background-color: var(--hover-bg, #ddd);
  }
  &:disabled {
    background-color: var(--disabled-bg, #b2b2b2);
    cursor: default;
    pointer-events: none;
  }
`;;
