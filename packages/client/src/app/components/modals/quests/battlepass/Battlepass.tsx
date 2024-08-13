import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { Quest } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { ProgressBar } from './ProgressBar';
import { getPercentCompletion } from './utils';

const Colors = {
  bg: '#bbb',
  fg: '#1581ec',
  accent: '#dc241a',
};

interface Props {
  account: Account;
  quests: {
    registry: BaseQuest[];
    ongoing: BaseQuest[];
    completed: BaseQuest[];
  };
  actions: {
    acceptQuest: (quest: BaseQuest) => void;
    completeQuest: (quest: BaseQuest) => void;
  };
  utils: {
    filterByObjective: (quests: Quest[]) => Quest[];
    populate: (base: BaseQuest) => Quest;
    parseObjectives: (quest: Quest) => Quest;
    parseRequirements: (quest: Quest) => Quest;
  };
}

// TODO: organize list of quests
// QUEST STATES: unaccepted, Ongoing, completed (actively triggered)
// TRANSITION STATES: available, completable (passively detected)
export const Battlepass = (props: Props) => {
  const { account, quests, actions, utils } = props;
  const [maxRep, setMaxRep] = useState(1);
  const [currRep, setCurrRep] = useState(0);
  const [agency, setAgency] = useState<Quest[]>([]); // aggregate list of quests from the agency

  // update the list of agency quests when the number of registry quests changes
  useEffect(() => {
    const registry = quests.registry.map((q) => utils.populate(q));
    const newAgency = utils.filterByObjective(registry);
    if (newAgency.length !== agency.length) {
      setAgency(newAgency.map((q) => utils.populate(q)));
      console.log('newAgency', newAgency);
    }
  }, [quests.registry.length]);

  // update the max reputation when the number of agency quests changes
  useEffect(() => {
    const newMaxRep = Math.max(...agency.map((q) => getReputationNeeded(q)));
    if (newMaxRep !== maxRep) setMaxRep(newMaxRep);
  }, [agency.length]);

  // update the current reputation when that changes
  useEffect(() => {
    setCurrRep(account.reputation.agency);
  }, [account.reputation.agency]);

  //////////////////
  // CHECKS

  const hasAction = (quest: Quest) => {
    return getAction(quest) !== undefined;
  };

  const isAvailable = (quest: Quest) => {
    return !isComplete(quest) && !isOngoing(quest);
  };

  const isComplete = (quest: Quest) => {
    return quests.completed.some((q) => q.index === quest.index);
  };

  const isOngoing = (quest: Quest) => {
    return quests.ongoing.some((q) => q.index === quest.index);
  };

  const isCompletable = (quest: Quest) => {
    if (!isOngoing(quest)) return false;
    const need = getReputationNeeded(quest);
    return currRep >= need;
  };

  const meetsReputation = (quest: Quest) => {
    const need = getReputationNeeded(quest);
    return currRep >= need;
  };

  //////////////////
  // INTERPRETATION

  // get the available action on a Milestone Quest
  const getAction = (quest: Quest) => {
    if (isAvailable(quest)) return () => actions.acceptQuest(quest);
    if (isCompletable(quest)) {
      const playerQuest = quests.ongoing.find((q) => q.index === quest.index);
      return () => actions.completeQuest(playerQuest!);
    }
  };

  // scan a Quest's Objectives to get the REPUTATION needed to complete it
  const getReputationNeeded = (quest: Quest) => {
    const objective = quest.objectives.find((o) => o.target.type === 'REPUTATION');
    return (objective?.target.value ?? 0) * 1;
  };

  const getMilestonePosition = (quest: Quest) => {
    const needed = getReputationNeeded(quest);
    return getPercentCompletion(needed, maxRep);
  };

  // get a registry Quest and check its completion status against the
  const getStatus = (quest: Quest) => {
    if (isComplete(quest)) return 'Completed';
    else if (isOngoing(quest)) return `${currRep}/${maxRep}`;
    else return 'Not Started';
  };

  //////////////////
  // RENDER

  return (
    <Container>
      <ProgressBar
        total={maxRep}
        current={account.reputation.agency}
        height={0.9}
        colors={{
          progress: Colors.fg,
          background: Colors.bg,
        }}
      />
      {/* {quests.agency.map((q) => (
        <Milestone
          key={q.index}
          onClick={() => getAction(q)}
          position={getMilestonePosition(q)}
          colors={{
            bg: meetsReputation(q) ? Colors.fg : Colors.bg,
            ring: meetsReputation(q) ? Colors.accent : 'black',
          }}
          tooltip={[`${q.name} [${getStatus(q)}]`, '', q.description]}
          is={{
            accepted: isOngoing(q) || isComplete(q),
            complete: isComplete(q),
            disabled: !hasAction(q),
          }}
        />
      ))} */}
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
