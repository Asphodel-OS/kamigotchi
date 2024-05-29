import styled from 'styled-components';
import { playClick } from 'utils/sounds';

import { ActionButton } from 'layers/react/components/library';

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
      <ActionButton
        onClick={() => setTab('GOAL')}
        text='Goal'
        size='medium'
        disabled={props.tab === 'GOAL'}
      />
      <ActionButton
        onClick={() => setTab('LEADERBOARD')}
        text='Leaderboard'
        size='medium'
        disabled={props.tab === 'LEADERBOARD'}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;

  margin: 1vh 1vw 0vh 1vw;
`;
