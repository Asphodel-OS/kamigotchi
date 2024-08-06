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
import { Quest, query } from './quest';
import { checkRequirement } from './requirement';

/////////////////
// CHECKERS

export const canAccept = (quest: Quest, account: Account, now: number): boolean => {
  if (!meetsRequirements(quest)) return false;
  if (quest.repeatable && !meetsRepeat(quest, account, now)) return false;
  return meetsMax(account, quest);
};

export const hasCompleted = (
  world: World,
  components: Components,
  questIndex: number,
  account: Account
): boolean => {
  const quests = query(world, components, {
    account: account.id,
    index: questIndex,
    completed: true,
  });

  return quests.length > 0;
};

export const isOngoing = (account: Account, questIndex: number): boolean => {
  return account.quests?.ongoing.some((q: Quest) => q.index === questIndex) ?? false;
};

export const meetsMax = (account: Account, quest: Quest): boolean => {
  let totCompletes = getNumCompleted(account, quest.index);
  totCompletes += isOngoing(account, quest.index) ? 1 : 0;
  return (isOngoing(account, quest.index) ? 1 : 0) + getNumCompleted(account, quest.index) < 1;
};

export const meetsRepeat = (quest: Quest, account: Account, now: number): boolean => {
  const allQuests = account.quests?.ongoing.concat(account.quests?.completed);
  const curr = allQuests?.find((x) => x.index == quest.index);

  // has not accepted repeatable before
  if (curr === undefined) return true;

  // must be repeatable (should not get here)
  if (!quest.repeatable) return false;

  // must be completed
  if (!curr.complete) return false;

  const wait = curr.repeatDuration !== undefined ? curr.repeatDuration : 0;
  return Number(curr.startTime) + Number(wait) <= Number(now);
};

export const meetsObjectives = (quest: Quest): boolean => {
  for (const objective of quest.objectives) {
    if (!objective.status?.completable) {
      return false;
    }
  }
  return true;
};

export const meetsRequirements = (quest: Quest): boolean => {
  for (const requirement of quest.requirements) {
    if (!requirement.status?.completable) {
      return false;
    }
  }
  return true;
};

const getNumCompleted = (account: Account, questIndex: number): number => {
  let ongoing = 0;
  account.quests?.completed.forEach((q: Quest) => {
    if (q.index === questIndex) ongoing++;
  });
  return ongoing;
};

/////////////////
// GETTERS

export const parseStatus = (
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
export const parseStatuses = (
  world: World,
  components: Components,
  account: Account,
  quests: Quest[]
): Quest[] => {
  return quests.map((quest: Quest) => {
    return parseStatus(world, components, account, quest);
  });
};

/////////////////
// OBJECTIVE CHECKERS

// these are a bit odd as we ideally can just retrieve the quest from the registry
// q: should these be organized as objective.ts functions ?

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
