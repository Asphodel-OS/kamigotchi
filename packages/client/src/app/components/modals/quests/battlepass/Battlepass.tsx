import { ProgressBar } from './ProgressBar';

import { Account } from 'network/shapes/Account';
import { Quest } from 'network/shapes/Quest';
import styled from 'styled-components';

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
  const getObjectiveReputation = (quest: Quest) => {
    const objective = quest.objectives.find((o) => o.target.type === 'REPUTATION');
    return objective?.target.value ?? 0;
  };

  const getMaxReputation = (quests: Quest[]) => {
    return Math.max(...quests.map((q) => getObjectiveReputation(q)));
  };

  return (
    <Container>
      <ProgressBar
        total={getMaxReputation(quests.agency)}
        current={account.reputation.agency}
        height={0.9}
      />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: flex;
  flex-flow: row no-wrap;
  justify-content: center;
  align-items: center;
  width: 100%;
`;
