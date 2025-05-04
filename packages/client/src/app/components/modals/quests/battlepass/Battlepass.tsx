import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ProgressBar } from 'app/components/library/measures/ProgressBar';
import { useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { parseConditionalUnits } from 'network/shapes/Conditional/interpretation';
import { meetsRequirements, Quest } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { calcPercentCompletion } from 'utils/numbers';
import { Milestone } from './Milestone';

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
  actions: QuestModalActions;
  utils: {
    describeEntity: (type: string, index: number) => DetailedEntity;
    filterForBattlePass: (quests: Quest[]) => Quest[];
    populate: (base: BaseQuest) => Quest;
    parseObjectives: (quest: Quest) => Quest;
    parseRequirements: (quest: Quest) => Quest;
  };
}

// TODO: organize list of quests
// QUEST STATES: Unaccepted, Ongoing, Completed (explicitly detected)
// TRANSITION STATES: available, completable (implicitly detected)
export const Battlepass = (props: Props) => {
  const { account, quests, actions, utils } = props;
  const { describeEntity, populate, filterForBattlePass, parseRequirements } = utils;
  const { modals } = useVisibility();
  // const [maxRep, setMaxRep] = useState(1);
  const maxRep = 300; // temp: hardcoded max rep
  const [currRep, setCurrRep] = useState(0);
  const [agency, setAgency] = useState<Quest[]>([]); // aggregate list of quests from the agency

  // update the list of agency quests when the number of registry quests changes
  useEffect(() => {
    const registry = quests.registry.map((q) => parseRequirements(populate(q)));
    const newAgency = filterForBattlePass(registry);
    if (newAgency.length !== agency.length) setAgency(newAgency);
  }, [quests.registry.length]);

  // update the max reputation when the number of agency quests changes
  // useEffect(() => {
  //   const newMaxRep = Math.max(...agency.map((q) => getRepObjective(q)));
  //   if (newMaxRep !== maxRep) setMaxRep(newMaxRep);
  // }, [agency.length]);

  // update the current reputation when that changes
  useEffect(() => {
    setCurrRep(account.reputation.agency);
  }, [account.reputation.agency]);

  //////////////////
  // CHECKS

  const isOngoing = (quest: Quest) => {
    return quests.ongoing.some((q) => q.index === quest.index);
  };

  const isComplete = (quest: Quest) => {
    return quests.completed.some((q) => q.index === quest.index);
  };

  const isAvailable = (quest: Quest) => {
    if (isComplete(quest) || isOngoing(quest)) return false;
    const need = getRepRequirement(quest);
    return currRep >= need && meetsRequirements(quest);
  };

  const isCompletable = (quest: Quest) => {
    if (!isOngoing(quest)) return false;
    const need = getRepObjective(quest);
    return currRep >= need;
  };

  const meetsReputation = (quest: Quest) => {
    const need = getRepObjective(quest);
    return currRep >= need;
  };

  //////////////////
  // INTERPRETATION

  // get the available action on a Milestone Quest
  const getAction = (quest: Quest) => {
    if (isAvailable(quest)) return () => actions.accept(quest);
    if (isCompletable(quest)) {
      const playerQuest = quests.ongoing.find((q) => q.index === quest.index);
      return () => actions.complete(playerQuest!);
    }
  };

  const getMilestonePosition = (quest: Quest) => {
    const needed = getRepObjective(quest);
    return calcPercentCompletion(needed, maxRep);
  };

  // get a registry Quest and check its completion status against the
  const getStatus = (quest: Quest) => {
    if (isComplete(quest)) return 'Completed';
    else if (isOngoing(quest)) {
      const need = getRepObjective(quest);
      return isCompletable(quest) ? 'Completable!' : `${currRep}/${need}`;
    } else {
      return isAvailable(quest) ? 'Acceptable!' : `Not Yet Available`;
    }
  };

  const getTooltip = (quest: Quest) => {
    const tooltip = [`${quest.name} [${getStatus(quest)}]`, ''];
    let hasDetails = false;
    if (isComplete(quest) || isOngoing(quest) || isAvailable(quest)) hasDetails = true;

    if (hasDetails) {
      tooltip.push(quest.description, '', 'Rewards:');
      quest.rewards.forEach((r) => {
        const entity = describeEntity(r.type, r.index || 0);
        const value = (r.value ?? 0) * 1;
        tooltip.push(`• ${entity.name} x${value}`);
      });

      // hardcode for passport limit
      if (quest.index === 20) {
        const processed = utils.parseObjectives(quest);
        tooltip.push('', 'Additional conditions:');
        processed.objectives.forEach((o) => {
          if (o.target.type !== 'REPUTATION') {
            const [tar, curr] = parseConditionalUnits(o);
            tooltip.push(`• [${curr}/${tar}] ${o.name} `);
          }
        });
      }
    }

    return tooltip;
  };

  // scan a Quest's Objectives to get the REPUTATION needed to complete it
  const getRepObjective = (quest: Quest) => {
    const objective = quest.objectives.find((o) => o.target.type === 'REPUTATION');
    return (objective?.target.value ?? 0) * 1;
  };

  const getRepRequirement = (quest: Quest) => {
    const requirements = quest.requirements.find((o) => o.target.type === 'REPUTATION');
    return (requirements?.target.value ?? 0) * 1;
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
      {agency.map((q) => (
        <Milestone
          key={q.index}
          onClick={getAction(q)}
          position={getMilestonePosition(q)}
          tooltip={getTooltip(q)}
          colors={{
            bg: meetsReputation(q) ? Colors.fg : Colors.bg,
            ring: meetsReputation(q) ? Colors.accent : 'black',
          }}
          is={{
            accepted: isOngoing(q) || isComplete(q),
            complete: isComplete(q),
            disabled: !getAction(q),
          }}
        />
      ))}
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
