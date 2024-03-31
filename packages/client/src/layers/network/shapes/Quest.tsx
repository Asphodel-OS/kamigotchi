import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  Not,
  QueryFragment,
  World,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'layers/network';
import { checkerSwitch } from 'layers/network/shapes/utils/LibBoolean';
import { Account } from './Account';
import { getData } from './Data';
import { getInventoryByIndex } from './Inventory';

/////////////////
// GETTERS

export const getRegistryQuests = (world: World, components: Components): Quest[] => {
  return queryQuestsX(world, components, { registry: true });
};

// get the ongoing quests for an account
export const getOngoingQuests = (
  world: World,
  components: Components,
  accountEntityID: EntityID
): Quest[] => {
  return queryQuestsX(world, components, { account: accountEntityID, completed: false });
};

// get the completed quests for an account
export const getCompletedQuests = (
  world: World,
  components: Components,
  accountEntityID: EntityID
): Quest[] => {
  return queryQuestsX(world, components, { account: accountEntityID, completed: true });
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

export const getQuestByIndex = (
  world: World,
  components: Components,
  index: number
): Quest | undefined => {
  return queryQuestsX(world, components, { index: index, registry: true })[0];
};

/////////////////
// SHAPES

export interface Quest {
  id: EntityID;
  index: number;
  name: string;
  description: string;
  startTime: number;
  complete: boolean;
  repeatable: boolean;
  repeatDuration?: number;
  requirements: Requirement[];
  objectives: Objective[];
  rewards: Reward[];
  points: number;
}

// the Target of a Condition (Objective, Requirement, Reward)
export interface Target {
  type: string;
  index?: number;
  value?: number;
}

export interface Status {
  target?: number;
  current?: number;
  completable: boolean;
}

export interface Condition {
  id: EntityID;
  logic: string;
  target: Target;
  status?: Status;
}

export interface Objective extends Condition {
  name: string;
}

export interface Requirement extends Condition {}

export interface Reward {
  id: EntityID;
  target: Target;
}

// Get a Quest Registry object, complete with all Requirements, Objectives, and Rewards
const getQuest = (world: World, components: Components, entityIndex: EntityIndex): Quest => {
  const {
    IsComplete,
    IsQuest,
    IsRegistry,
    IsRepeatable,
    Description,
    Name,
    Time,
    QuestIndex,
    QuestPoint,
    StartTime,
  } = components;

  const questIndex = getComponentValue(QuestIndex, entityIndex)?.value || (0 as number);
  const registryIndex = Array.from(
    runQuery([Has(IsRegistry), Has(IsQuest), HasValue(QuestIndex, { value: questIndex })])
  )[0];

  const points = (getComponentValue(QuestPoint, registryIndex)?.value || (0 as number)) * 1;

  let result: Quest = {
    id: world.entities[entityIndex],
    index: questIndex,
    name: getComponentValue(Name, registryIndex)?.value || ('' as string),
    description: getComponentValue(Description, registryIndex)?.value || ('' as string),
    startTime: getComponentValue(StartTime, entityIndex)?.value || (0 as number),
    complete: hasComponent(IsComplete, entityIndex) || (false as boolean),
    repeatable: hasComponent(IsRepeatable, registryIndex) || (false as boolean),
    requirements: queryQuestRequirements(world, components, questIndex),
    objectives: queryQuestObjectives(world, components, questIndex),
    rewards: queryQuestRewards(world, components, questIndex, world.entities[entityIndex], points),
    points: points,
  };

  if (hasComponent(IsRepeatable, registryIndex)) {
    result.repeatDuration = getComponentValue(Time, registryIndex)?.value || (0 as number);
  }

  return result;
};

// Get a Requirement Registry object
const getRequirement = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Requirement => {
  const { Balance, Index, LogicType, Type } = components;

  let requirement: Requirement = {
    id: world.entities[entityIndex],
    logic: getComponentValue(LogicType, entityIndex)?.value || ('' as string),
    target: {
      type: getComponentValue(Type, entityIndex)?.value || ('' as string),
    },
  };

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) requirement.target.index = index;

  const value = getComponentValue(Balance, entityIndex)?.value;
  if (value) requirement.target.value = value;

  return requirement;
};

// Get an Objective Registry object
const getObjective = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Objective => {
  const { Balance, Index, LogicType, Name, Type } = components;

  let objective: Objective = {
    id: world.entities[entityIndex],
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
    logic: getComponentValue(LogicType, entityIndex)?.value || ('' as string),
    target: {
      type: getComponentValue(Type, entityIndex)?.value || ('' as string),
    },
  };

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) objective.target.index = index;

  const value = getComponentValue(Balance, entityIndex)?.value;
  if (value) objective.target.value = value;

  return objective;
};

// Get a Reward Registry object
const getReward = (world: World, components: Components, entityIndex: EntityIndex): Reward => {
  const { Balance, Index, Type } = components;

  let reward: Reward = {
    id: world.entities[entityIndex],
    target: {
      type: getComponentValue(Type, entityIndex)?.value || ('' as string),
    },
  };

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) reward.target.index = index;

  const value = getComponentValue(Balance, entityIndex)?.value;
  if (value) reward.target.value = value;

  return reward;
};

const parseQuestStatus = (
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

/////////////////
// QUERIES

export interface QueryOptions {
  account?: EntityID;
  completed?: boolean;
  index?: number;
  registry?: boolean;
}

// Query for Entity Indices of Quests, depending on the options provided
const queryQuestsX = (world: World, components: Components, options: QueryOptions): Quest[] => {
  const { OwnsQuestID, IsComplete, IsQuest, IsRegistry, QuestIndex } = components;

  const toQuery: QueryFragment[] = [Has(IsQuest)];

  if (options?.account) {
    toQuery.push(HasValue(OwnsQuestID, { value: options.account }));
  }

  if (options?.registry) {
    toQuery.push(Has(IsRegistry));
  }

  if (options?.index) {
    toQuery.push(HasValue(QuestIndex, { value: options.index }));
  }

  if (options?.completed !== undefined) {
    if (options?.completed) {
      toQuery.push(Has(IsComplete));
    } else {
      toQuery.push(Not(IsComplete));
    }
  }

  const raw = Array.from(runQuery(toQuery));

  return raw.map((index): Quest => getQuest(world, components, index));
};

// Get the Entity Indices of the Requirements of a Quest
const queryQuestRequirements = (
  world: World,
  components: Components,
  questIndex: number
): Requirement[] => {
  const { IsRegistry, IsRequirement, QuestIndex } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), Has(IsRequirement), HasValue(QuestIndex, { value: questIndex })])
  );
  return entityIndices.map((entityIndex) => getRequirement(world, components, entityIndex));
};

// Get the Entity Indices of the Objectives of a Quest
const queryQuestObjectives = (
  world: World,
  components: Components,
  questIndex: number
): Objective[] => {
  const { IsRegistry, IsObjective, QuestIndex } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), Has(IsObjective), HasValue(QuestIndex, { value: questIndex })])
  );
  return entityIndices.map((index) => getObjective(world, components, index));
};

// Get the Entity Indices of the Rewards of a Quest
const queryQuestRewards = (
  world: World,
  components: Components,
  questIndex: number,
  questID: EntityID,
  points: number
): Reward[] => {
  const { IsRegistry, IsReward, QuestIndex } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), Has(IsReward), HasValue(QuestIndex, { value: questIndex })])
  );
  const queried = entityIndices.map((entityIndex) => getReward(world, components, entityIndex));

  if (points > 0)
    return [{ id: questID, target: { type: 'QUEST_POINTS', value: points } }, ...queried];
  else return queried;
};

const querySnapshotObjective = (
  world: World,
  components: Components,
  questID: EntityID
): Objective => {
  const { IsObjective, OwnsQuestID } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsObjective), HasValue(OwnsQuestID, { value: questID })])
  );
  return getObjective(world, components, entityIndices[0]); // should only be one
};

///////////////////////
// CHECKS

export const checkRequirement = (
  world: World,
  components: Components,
  requirement: Requirement,
  account: Account
): Status => {
  return checkerSwitch(
    requirement.logic,
    checkCurrent(world, components, requirement.target, account),
    undefined,
    undefined,
    checkBoolean(world, components, requirement.target, account),
    { completable: false }
  );
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

const checkCurrent = (
  world: World,
  components: Components,
  condition: Target,
  account: Account
): ((opt: any) => Status) => {
  const accVal = getAccBal(world, components, account, condition.index, condition.type) || 0;

  return (opt: any) => {
    return {
      target: condition.value,
      current: accVal,
      completable: checkLogicOperator(accVal, condition.value ?? 0, opt),
    };
  };
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

const checkBoolean = (
  world: World,
  components: Components,
  condition: Target,
  account: Account
): ((opt: any) => Status) => {
  const _type = condition.type;
  let current: number | undefined;
  let target: number | undefined;
  let result = false;

  switch (_type) {
    case 'QUEST':
      result = checkQuestComplete(world, components, condition.index as number, account);
      break;
    case 'ROOM':
      current = account.roomIndex;
      target = condition.index;
      result = current == target;
      break;
    default:
      result = false; // should not get here
  }

  return (opt: any) => {
    return {
      current,
      target,
      completable: opt === 'IS' ? result : !result,
    };
  };
};

const checkQuestComplete = (
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

const getAccBal = (
  world: World,
  components: Components,
  account: Account,
  index: number | undefined,
  type: string
): number => {
  let balance = 0;
  if (type === 'ITEM') {
    balance = getInventoryBalance(account, index, type);
  } else if (type === 'COIN') {
    balance = getData(world, components, account.id, 'COIN_TOTAL', 0) || 0;
  } else if (type === 'KAMI') {
    balance = account.kamis?.length || 0;
  } else if (type === 'KAMI_LEVEL_HIGHEST') {
    account.kamis?.forEach((kami) => {
      if (kami.level > balance) balance = kami.level;
    });
  } else if (type === 'ROOM') {
    balance = account.roomIndex || 0;
  } else {
    balance = getData(world, components, account.id, type, index ?? 0);
  }
  return Number(balance);
};

///////////////////////
// UTILS

const getInventoryBalance = (account: Account, index: number | undefined, type: string): number => {
  if (index === undefined) return 0; // should not reach here
  if (account.inventories === undefined) return 0; // should not reach here

  let balance = 0;
  switch (type) {
    case 'EQUIP':
      balance = getInventoryByIndex(account.inventories.gear, index)?.balance || 0;
    case 'FOOD':
      balance = getInventoryByIndex(account.inventories.food, index)?.balance || 0;
    case 'MOD':
      balance = getInventoryByIndex(account.inventories.mods, index)?.balance || 0;
    case 'REVIVE':
      balance = getInventoryByIndex(account.inventories.revives, index)?.balance || 0;
    default:
      balance = 0; // should not reach here
  }

  return Number(balance);
};

const checkLogicOperator = (
  a: number,
  b: number,
  logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'
): boolean => {
  if (logic == 'MIN') return a >= b;
  else if (logic == 'MAX') return a <= b;
  else if (logic == 'EQUAL') return a == b;
  else return false; // should not reach here
};

// parses common human readable words into machine types
export const parseToLogicType = (str: string): string => {
  const is = ['IS', 'COMPLETE', 'AT'];
  const min = ['MIN', 'HAVE', 'GREATER'];
  const max = ['MAX', 'LESSER'];
  const equal = ['EQUAL'];
  const not = ['NOT'];

  if (is.includes(str)) return 'BOOL_IS';
  else if (min.includes(str)) return 'CURR_MIN';
  else if (max.includes(str)) return 'CURR_MAX';
  else if (equal.includes(str)) return 'CURR_EQUAL';
  else if (not.includes(str)) return 'BOOL_NOT';
  else {
    console.error('unrecognized logic type');
    return '';
  }
};
