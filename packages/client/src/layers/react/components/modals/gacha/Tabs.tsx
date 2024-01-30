import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';

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
      <ActionButton
        id={"tab-mint"}
        onClick={() => setTab('MINT')}
        text='Mint'
        disabled={props.tab === 'MINT'}
        size="vending"
      />
      <ActionButton
        id={"tab-reroll"}
        onClick={() => setTab('REROLL')}
        text='Re-roll'
        disabled={props.tab === 'REROLL'}
        size="vending"
      />
    </Container>
  );
}

const Container = styled.div`
  background-color: white;
  display: flex;
`;
