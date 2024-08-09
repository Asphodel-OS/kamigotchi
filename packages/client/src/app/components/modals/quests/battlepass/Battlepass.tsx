import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { Quest } from 'network/shapes/Quest';
import { Milestone } from './Milestone';
import { ProgressBar } from './ProgressBar';

const DefaultColors = {
  background: '#bbb',
  foreground: '#1ae',
};

interface Props {
  account: Account;
  quests: {
    agency: Quest[];
    ongoing: Quest[];
    completed: Quest[];
  };
}

export const Battlepass = (props: Props) => {
  const { account, quests } = props;

  // scan a Quest's Objectives to get the REPUTATION needed to complete it
  const getReputationNeeded = (quest: Quest) => {
    const objective = quest.objectives.find((o) => o.target.type === 'REPUTATION');
    return objective?.target.value ?? 0;
  };

  const getMaxReputation = (quests: Quest[]) => {
    return Math.max(...quests.map((q) => getReputationNeeded(q)));
  };

  const getMilestonePosition = (quests: Quest[]) => {
    return Math.min(getMaxReputation(quests), account.reputation.agency);
  };

  return (
    <Container>
      <ProgressBar
        total={getMaxReputation(quests.agency)}
        current={account.reputation.agency}
        height={0.9}
        colors={{
          progress: DefaultColors.foreground,
          background: DefaultColors.background,
        }}
      />
      <Milestone
        onClick={getMaxReputation}
        size={1.5}
        position={0}
        color={DefaultColors.foreground}
      />
      <Milestone
        onClick={getMaxReputation}
        size={1.5}
        position={50}
        color={DefaultColors.background}
      />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  margin: 0.9vw;

  flex-grow: 1;
  display: flex;
  flex-flow: row no-wrap;
  justify-content: center;
  align-items: center;
`;

const Milestones = styled.div`
  position: absolute;
  pointer-events: none;

  display: flex;
  width: 100%;
`;
