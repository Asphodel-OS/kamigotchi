import styled from 'styled-components';
import { playClick } from 'utils/sounds';

import { ActionButton } from 'app/components/library';

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
      <ActionButton
        onClick={() => setTab('GOAL')}
        text='Goal'
        size='medium'
        disabled={tab === 'GOAL'}
      />
      <ActionButton
        onClick={() => setTab('LEADERBOARD')}
        text='Leaderboard'
        size='medium'
        disabled={tab === 'LEADERBOARD'}
      />
    </Container>
  );
};

const Container = styled.div`
  position: absolute;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;

  margin: 1em 1em 0em 1em;
  right: 0;
`;
