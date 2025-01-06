import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { Allo } from '../Allo';
import { checkCondition } from '../Conditional';
import { getIsComplete } from '../utils/component';
import { Objective, checkObjective } from './objective';
import { queryInstance } from './queries';
import { BaseQuest, Quest, populate } from './quest';

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
  world: World,
  components: Components,
  questIndex: number,
  holder: EntityIndex
): boolean => {
  const instance = queryInstance(world, questIndex, holder);
  return instance !== undefined && getIsComplete(components, instance);
};

// find a Quest in a list of other Quests by its index
const find = (quest: BaseQuest, list: BaseQuest[]) => {
  return list.find((q: BaseQuest) => q.index === quest.index);
};

// check whether a Parsed Quest has its Objectives met
export const meetsObjectives = (quest: Quest): boolean => {
  for (const objective of quest.objectives) {
    const status = objective.status;
    if (!status?.completable) return false;
  }
  return true;
};

// check whether a Parsed Quest has its Requirements met
export const meetsRequirements = (quest: Quest): boolean => {
  for (const requirement of quest.requirements) {
    const status = requirement.status;
    if (!status?.completable) return false;
  }
  return true;
};

/////////////////
// FILTERS

// filter a list of Registry Quests to just the ones available to an Account
// - Ongoing autofails
// - Completed and nonrepeatable autofails
// - Completed and repeatable fails if on cooldown
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
    if (!!completedBase && !q.repeatable) return false;
    if (!!completedBase && q.repeatable) {
      const completedFull = populate(world, components, completedBase);
      if (!canRepeat(completedFull)) return false;
    }

    const fullQuest = populate(world, components, q);
    parseStatus(world, components, account, fullQuest);
    return meetsRequirements(fullQuest);
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

// filter a list of Quests (parsed or not) to ones with a Allo matching certain conditions
export const filterByReward = (quests: Quest[], faction?: number) => {
  return quests.filter((q: Quest) => {
    let result = true;
    if (faction && result) {
      result = q.rewards.some((r: Allo) => r.type === 'REPUTATION' && r.index === faction);
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

// sorts Completed Quests by their index
export const sortCompleted = (quests: Quest[]): Quest[] => {
  return quests.sort((a, b) => a.index - b.index);
};

/////////////////
// PARSERS

export const parseObjectives = (
  world: World,
  components: Components,
  account: Account,
  quest: Quest
): Quest => {
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

export const parseRequirements = (
  world: World,
  components: Components,
  account: Account,
  quest: Quest
): Quest => {
  for (let i = 0; i < quest.requirements.length; i++) {
    quest.requirements[i].status = checkCondition(
      world,
      components,
      quest.requirements[i],
      account
    );
  }
  return quest;
};

export const parseStatus = (
  world: World,
  components: Components,
  account: Account,
  quest: Quest
): Quest => {
  parseRequirements(world, components, account, quest);
  parseObjectives(world, components, account, quest);
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
