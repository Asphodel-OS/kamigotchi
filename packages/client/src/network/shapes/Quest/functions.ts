import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import {
  Status,
  checkBoolean,
  checkCurrent,
  checkLogicOperator,
  checkerSwitch,
} from '../Conditional';
import { getData } from '../utils';
import { Objective, querySnapshotObjective } from './objective';
import { Quest, queryQuestsX } from './quest';
import { checkRequirement } from './requirement';

/////////////////
// CHECKERS

export const hasCompletedQuest = (
  world: World,
  components: Components,
  questIndex: number,
  account: Account
): boolean => {
  const quests = queryQuestsX(world, components, {
    account: account.id,
    index: questIndex,
    completed: true,
  });

  return quests.length > 0;
};

export const checkObjective = (
  world: World,
  components: Components,
  objective: Objective,
  quest: Quest,
  account: Account
): Status => {
  if (quest.complete) {
    return { completable: true };
  }

  return checkerSwitch(
    objective.logic,
    checkCurrent(world, components, objective.target, account),
    checkIncrease(world, components, objective, quest, account),
    checkDecrease(world, components, objective, quest, account),
    checkBoolean(world, components, objective.target, account),
    { completable: false }
  );
};

const checkIncrease = (
  world: World,
  components: Components,
  objective: Objective,
  quest: Quest,
  account: Account
): ((opt: any) => Status) => {
  const prevVal = querySnapshotObjective(world, components, quest.id).target.value as number;
  const currVal = getData(
    world,
    components,
    account.id,
    objective.target.type,
    objective.target.index
  );

  return (opt: any) => {
    return {
      target: objective.target.value,
      current: currVal - prevVal,
      completable: checkLogicOperator(
        currVal - prevVal,
        objective.target.value ? objective.target.value : 0,
        opt
      ),
    };
  };
};

const checkDecrease = (
  world: World,
  components: Components,
  objective: Objective,
  quest: Quest,
  account: Account
): ((opt: any) => Status) => {
  const prevVal = querySnapshotObjective(world, components, quest.id).target.value as number;
  const currVal = getData(
    world,
    components,
    account.id,
    objective.target.type,
    objective.target.index
  );

  return (opt: any) => {
    return {
      target: objective.target.value,
      current: prevVal - currVal,
      completable: checkLogicOperator(
        prevVal - currVal,
        objective.target.value ? objective.target.value : 0,
        opt
      ),
    };
  };
};

/////////////////
// GETTERS

export const parseQuestStatus = (
  world: World,
  components: Components,
  account: Account,
  quest: Quest
): Quest => {
  for (let i = 0; i < quest.requirements.length; i++) {
    quest.requirements[i].status = checkRequirement(
      world,
      components,
      quest.requirements[i],
      account
    );
  }

  for (let i = 0; i < quest.objectives.length; i++) {
    quest.objectives[i].status = checkObjective(
      world,
      components,
      quest.objectives[i],
      quest,
      account
    );
  }

  return quest;
};

// parse detailed quest status
export const parseQuestsStatus = (
  world: World,
  components: Components,
  account: Account,
  quests: Quest[]
): Quest[] => {
  return quests.map((quest: Quest) => {
    return parseQuestStatus(world, components, account, quest);
  });
};
