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

// check whether a Parsed Quest has its Objectives met
export const meetsObjectives = (quest: Quest): boolean => {
  for (const objective of quest.objectives) {
    if (!objective.status?.completable) {
      return false;
    }
  }
  return true;
};

// check whether a Parsed Quest has its Requirements met
export const meetsRequirements = (quest: Quest): boolean => {
  for (const requirement of quest.requirements) {
    if (!requirement.status?.completable) {
      return false;
    }
  }
  return true;
};

/////////////////
// FILTERS

// filters a list of Parsed Quests to just the ones available to an Account
export const filterAvailable = (parsedRegistry: Quest[], completed: Quest[], ongoing: Quest[]) => {
  return parsedRegistry.filter((q: Quest) => {
    if (!meetsRequirements(q)) return false;
    return isAvailableByCount(q, completed, ongoing);
  });
};

// check whether a Parsed Quest is Available to accept based on the list of an
// Account's completed and ongoing Quests
const isAvailableByCount = (quest: Quest, completed: Quest[], ongoing: Quest[]) => {
  const ongoingInstance = ongoing.find((q: Quest) => q.index === quest.index);
  const completedInstance = completed.find((q: Quest) => q.index === quest.index);
  const now = Date.now() / 1000;

  if (ongoingInstance) return false;
  if (!completedInstance) return true;
  if (!quest.repeatable) return false; // assume attempt limit for all other quests is 1

  // assumed repeatable quest with no ongoing instance
  const waitRequirement = completedInstance.repeatDuration ?? 0;
  const startTime = completedInstance.startTime;
  return Number(startTime) + Number(waitRequirement) <= Number(now);
};

/////////////////
// SORTERS

// sorts Ongoing Quests by their completability
export const sortOngoing = (quests: Quest[]): Quest[] => {
  const completionStatus = new Map<number, boolean>();
  quests.forEach((q: Quest) => completionStatus.set(q.index, meetsObjectives(q)));

  return quests.reverse().sort((a: Quest, b: Quest) => {
    const aCompletable = completionStatus.get(a.index);
    const bCompletable = completionStatus.get(b.index);
    if (aCompletable && !bCompletable) return -1;
    else if (!aCompletable && bCompletable) return 1;
    else return 0;
  });
};

/////////////////
// PARSERS

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
