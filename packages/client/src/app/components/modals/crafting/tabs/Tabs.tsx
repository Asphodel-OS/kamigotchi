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
      <Button onClick={() => setTab('consumable')} disabled={tab === 'consumable'}>
        Consumables
      </Button>
      <Button onClick={() => setTab('material')} disabled={tab === 'material'}>
        Materials
      </Button>
      <Button onClick={() => setTab('reagent')} disabled={tab === 'reagent'}>
        Reagents
      </Button>
      <Button
        onClick={() => setTab('special')}
        disabled={tab === 'special'}
        style={{ borderRight: 'none' }}
      >
        Special
      </Button>
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw var(--border-primary, black);
  border-radius: 0.3vw 0.3vw 0 0;

  margin-bottom: 0.6vw;
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
  border-right: solid var(--border-primary, black) 0.15vw;

  font-size: 0.9vw;
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
