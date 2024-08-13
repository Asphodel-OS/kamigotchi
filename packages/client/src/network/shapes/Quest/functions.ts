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
import { Reward } from '../Rewards';
import { getData } from '../utils';
import { Objective, querySnapshotObjective } from './objective';
import { query } from './queries';
import { BaseQuest, Quest, populate } from './quest';
import { checkRequirement } from './requirement';

/////////////////
// CHECKERS

// check whethter a Repeatable Quest is Available to be repeated now
const canRepeat = (completed: Quest) => {
  if (!completed.repeatable) return false;
  const now = Date.now() / 1000;
  const cooldown = completed.repeatDuration ?? 0;
  const startTime = completed.startTime;
  return Number(startTime) + Number(cooldown) <= Number(now);
};

export const hasCompleted = (
  components: Components,
  questIndex: number,
  account: Account
): boolean => {
  const results = query(components, {
    account: account.id,
    index: questIndex,
    completed: true,
  });

  return results.length > 0;
};

// find a Quest in a list of other Quests by its index
const find = (quest: BaseQuest, list: BaseQuest[]) => {
  return list.find((q: BaseQuest) => q.index === quest.index);
};

// // assumed repeatable quest with no ongoing instance
// const now = Date.now() / 1000;
// const waitRequirement = completedInstance.repeatDuration ?? 0;
// const startTime = completedInstance.startTime;
// return Number(startTime) + Number(waitRequirement) <= Number(now);

// // check whether a Parsed Quest has its Objectives met
// export const meetsObjectives = (quest: Quest): boolean => {
//   for (const objective of quest.objectives) {
//     const status = objective.status;
//     if (!status?.completable) return false;
//   }
//   return true;
// };

// // check whether a Parsed Quest has its Requirements met
// export const meetsRequirements = (quest: Quest): boolean => {
//   for (const requirement of quest.requirements) {
//     const status = requirement.status;
//     if (!status?.completable) return false;
//   }
//   return true;
// };

// check whether an Account meets the requirements of a Quest
export const meetsRequirements = (
  world: World,
  components: Components,
  quest: Quest,
  account: Account
): boolean => {
  return !quest.requirements.some((r) => !checkRequirement(world, components, r, account));
};

// check whether an Account meets the Objectives of a Quest
export const meetsObjectives = (
  world: World,
  components: Components,
  quest: Quest,
  account: Account
): boolean => {
  return !quest.objectives.some((o) => !checkObjective(world, components, o, quest, account));
};

/////////////////
// FILTERS

// filter a list of Registry Quests to just the ones available to an Account
// - Ongoing is autofail
// - Completed and nonrepeatable is fail
// - Completed and repeatable is pass based on cooldown
// - otherwise Available and needs to check against requirements
// TODO: return populated Quests rather than the BaseQuests
export const filterByAvailable = (
  world: World,
  components: Components,
  account: Account,
  registry: BaseQuest[],
  ongoing: BaseQuest[],
  completed: BaseQuest[]
) => {
  return registry.filter((q) => {
    const ongoingBase = find(q, ongoing);
    const completedBase = find(q, completed);

    if (!!ongoingBase) return false;
    if (!!completedBase) {
      if (!q.repeatable) return false;
      else {
        const completedFull = populate(world, components, completedBase);
        return canRepeat(completedFull);
      }
    }

    const fullQuest = populate(world, components, q);
    return meetsRequirements(world, components, fullQuest, account);
  });
};

// filter a list of Quests (parsed or not) to ones with an Objective matching certain conditions
export const filterByObjective = (quests: Quest[], faction?: number) => {
  return quests.filter((q: Quest) => {
    let result = true;
    if (faction && result) {
      result = q.objectives.some(
        (o: Objective) => o.target.type === 'REPUTATION' && o.target.index === faction
      );
    }
    return result;
  });
};

export const filterByNotObjective = (quests: Quest[], faction?: number) => {
  return quests.filter((q: Quest) => {
    let result = true;
    if (faction && result) {
      result = !q.objectives.some(
        (o: Objective) => o.target.type === 'REPUTATION' && o.target.index === faction
      );
    }
    return result;
  });
};

// filter a list of Quests (parsed or not) to ones with a Reward matching certain conditions
export const filterByReward = (quests: Quest[], faction?: number) => {
  return quests.filter((q: Quest) => {
    let result = true;
    if (faction && result) {
      result = q.rewards.some(
        (r: Reward) => r.target.type === 'REPUTATION' && r.target.index === faction
      );
    }
    return result;
  });
};

// filter out onwanted ongoing quests
export const filterOngoing = (quests: Quest[]) => {
  if (quests.length === 0) return [];
  quests = filterByNotObjective(quests, 1);
  return quests.filter((quest: Quest) => quest.index !== 10001);
};

/////////////////
// SORTERS

// // sorts Ongoing Quests by their completability
// export const sortOngoing = (quests: Quest[]): Quest[] => {
//   const completionStatus = new Map<number, boolean>();
//   quests.forEach((q: Quest) => completionStatus.set(q.index, meetsObjectives(q)));

//   return quests.reverse().sort((a: Quest, b: Quest) => {
//     const aCompletable = completionStatus.get(a.index);
//     const bCompletable = completionStatus.get(b.index);
//     if (aCompletable && !bCompletable) return -1;
//     else if (!aCompletable && bCompletable) return 1;
//     else return 0;
//   });
// };

// sorts Completed Quests by their index
export const sortCompleted = (quests: Quest[]): Quest[] => {
  return [...quests].sort((a: Quest, b: Quest) => a.index - b.index);
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
