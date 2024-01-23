import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  hasComponent,
  runQuery,
  Not,
  QueryFragment,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account } from './Account';
import { getData } from './Data';
import { getInventoryByIndex } from './Inventory';


/////////////////
// GETTERS

export const getRegistryQuests = (layers: Layers): Quest[] => {
  return queryQuestsX(layers, { registry: true });
};

// get the ongoing quests for an account
export const getOngoingQuests = (layers: Layers, accountEntityID: EntityID): Quest[] => {
  return queryQuestsX(layers, { account: accountEntityID, completed: false });
}

// get the completed quests for an account
export const getCompletedQuests = (layers: Layers, accountEntityID: EntityID): Quest[] => {
  return queryQuestsX(layers, { account: accountEntityID, completed: true });
}

// parse detailed quest status 
export const parseQuestsStatus = (layers: Layers, account: Account, quests: Quest[]): Quest[] => {
  return quests.map((quest: Quest) => {
    return parseQuestStatus(layers, account, quest);
  });
}

export const getQuestByIndex = (layers: Layers, index: number): Quest | undefined => {
  return queryQuestsX(layers, { index: index, registry: true })[0];
}


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

export interface Objective {
  id: EntityID;
  index: number;
  name: string;
  logic: string;
  target: Target;
  status?: Status;
}

export interface Requirement {
  id: EntityID;
  logic: string;
  target: Target;
  status?: Status;
}

export interface Reward {
  id: EntityID;
  target: Target;
}

// Get a Quest Registry object, complete with all Requirements, Objectives, and Rewards
const getQuest = (layers: Layers, entityIndex: EntityIndex): Quest => {
  const {
    network: {
      components: {
        IsComplete,
        IsQuest,
        IsRegistry,
        IsRepeatable,
        Description,
        Name,
        Time,
        QuestIndex,
        StartTime,
      },
      world,
    },
  } = layers;


  const questIndex = getComponentValue(QuestIndex, entityIndex)?.value || 0 as number;
  const registryIndex = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsQuest),
      HasValue(QuestIndex, { value: questIndex })
    ])
  )[0];

  let result: Quest = {
    id: world.entities[entityIndex],
    index: questIndex,
    name: getComponentValue(Name, registryIndex)?.value || '' as string,
    description: getComponentValue(Description, registryIndex)?.value || '' as string,
    startTime: getComponentValue(StartTime, entityIndex)?.value || 0 as number,
    complete: hasComponent(IsComplete, entityIndex) || false as boolean,
    repeatable: hasComponent(IsRepeatable, registryIndex) || false as boolean,
    requirements: queryQuestRequirements(layers, questIndex),
    objectives: queryQuestObjectives(layers, questIndex),
    rewards: queryQuestRewards(layers, questIndex),
  };

  if (hasComponent(IsRepeatable, registryIndex)) {
    result.repeatDuration = getComponentValue(Time, registryIndex)?.value || 0 as number;
  }

  return result;
}

// Get a Requirement Registry object
const getRequirement = (layers: Layers, entityIndex: EntityIndex): Requirement => {
  const {
    network: {
      components: {
        Index,
        LogicType,
        Type,
        Value,
      },
      world,
    },
  } = layers;


  let requirement: Requirement = {
    id: world.entities[entityIndex],
    logic: getComponentValue(LogicType, entityIndex)?.value || '' as string,
    target: {
      type: getComponentValue(Type, entityIndex)?.value || '' as string,
    },
  }

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) requirement.target.index = index;

  const value = getComponentValue(Value, entityIndex)?.value
  if (value) requirement.target.value = value;

  return requirement;
}

// Get an Objective Registry object
const getObjective = (layers: Layers, entityIndex: EntityIndex): Objective => {
  const {
    network: {
      components: {
        Index,
        LogicType,
        Name,
        ObjectiveIndex,
        Type,
        Value,
      },
      world,
    },
  } = layers;


  let objective: Objective = {
    id: world.entities[entityIndex],
    index: getComponentValue(ObjectiveIndex, entityIndex)?.value || 0 as number,
    name: getComponentValue(Name, entityIndex)?.value || '' as string,
    logic: getComponentValue(LogicType, entityIndex)?.value || '' as string,
    target: {
      type: getComponentValue(Type, entityIndex)?.value || '' as string,
    },
  }

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) objective.target.index = index;

  const value = getComponentValue(Value, entityIndex)?.value
  if (value) objective.target.value = value;

  return objective;
}

// Get a Reward Registry object
const getReward = (layers: Layers, entityIndex: EntityIndex): Reward => {
  const {
    network: {
      components: {
        Index,
        Type,
        Value,
      },
      world,
    },
  } = layers;


  let reward: Reward = {
    id: world.entities[entityIndex],
    target: {
      type: getComponentValue(Type, entityIndex)?.value || '' as string,
    },
  }

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) reward.target.index = index;

  const value = getComponentValue(Value, entityIndex)?.value
  if (value) reward.target.value = value;

  return reward;
}

const parseQuestStatus = (layers: Layers, account: Account, quest: Quest): Quest => {
  for (let i = 0; i < quest.requirements.length; i++) {
    quest.requirements[i].status = checkRequirement(layers, quest.requirements[i], account);
  }

  for (let i = 0; i < quest.objectives.length; i++) {
    quest.objectives[i].status = checkObjective(layers, quest.objectives[i], quest, account);
  }

  return quest;
}

/////////////////
// QUERIES

export interface QueryOptions {
  account?: EntityID;
  completed?: boolean;
  index?: number;
  registry?: boolean;
}

// Query for Entity Indices of Quests, depending on the options provided
const queryQuestsX = (
  layers: Layers,
  options: QueryOptions,
): Quest[] => {
  const {
    network: {
      components: {
        AccountID,
        IsComplete,
        IsQuest,
        IsRegistry,
        QuestIndex,
      },
    },
  } = layers;

  const toQuery: QueryFragment[] = [Has(IsQuest)];

  if (options?.account) {
    toQuery.push(HasValue(AccountID, { value: options.account }));
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

  const raw = Array.from(
    runQuery(toQuery)
  );

  return raw.map(
    (index): Quest => getQuest(layers, index)
  );
}

// Get the Entity Indices of the Requirements of a Quest
const queryQuestRequirements = (layers: Layers, questIndex: number): Requirement[] => {
  const {
    network: {
      components: { IsRegistry, IsRequirement, QuestIndex },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsRequirement),
      HasValue(QuestIndex, { value: questIndex })
    ])
  );

  return entityIndices.map(
    (entityIndex): Requirement => getRequirement(layers, entityIndex)
  );
}

// Get the Entity Indices of the Objectives of a Quest
const queryQuestObjectives = (layers: Layers, questIndex: number): Objective[] => {
  const {
    network: {
      components: { IsObjective, IsRegistry, QuestIndex },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsObjective),
      HasValue(QuestIndex, { value: questIndex })
    ])
  );

  return entityIndices.map((index): Objective => getObjective(layers, index));
}

// Get the Entity Indices of the Rewards of a Quest
const queryQuestRewards = (layers: Layers, questIndex: number): Reward[] => {
  const {
    network: {
      components: { IsRegistry, IsReward, QuestIndex },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsReward),
      HasValue(QuestIndex, { value: questIndex })
    ])
  );

  return entityIndices.map(
    (entityIndex): Reward => getReward(layers, entityIndex)
  );
}

const querySnapshotObjective = (layers: Layers, questID: EntityID, objectiveIndex: number): Objective => {
  const {
    network: {
      components: { IsObjective, ObjectiveIndex, HolderID },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsObjective),
      HasValue(ObjectiveIndex, { value: objectiveIndex }),
      HasValue(HolderID, { value: questID })
    ])
  );

  return getObjective(layers, entityIndices[0]); // should only be one
}


///////////////////////
// CHECKS

export const checkRequirement = (
  layers: Layers,
  requirement: Requirement,
  account: Account
): Status => {
  switch (requirement.logic) {
    case 'AT':
      return checkCurrent(layers, requirement.target, account, 'EQUAL');
    case 'COMPLETE':
      return checkBoolean(layers, requirement.target, account, 'IS');
    case 'HAVE':
      return checkCurrent(layers, requirement.target, account, 'MIN');
    case 'GREATER':
      return checkCurrent(layers, requirement.target, account, 'MIN');
    case 'LESSER':
      return checkCurrent(layers, requirement.target, account, 'MAX');
    case 'EQUAL':
      return checkCurrent(layers, requirement.target, account, 'EQUAL');
    case 'USE':
      return checkCurrent(layers, requirement.target, account, 'MIN');
    default:
      return { completable: false }; // should not get here
  }
}

export const checkObjective = (
  layers: Layers,
  objective: Objective,
  quest: Quest,
  account: Account
): Status => {
  if (quest.complete) {
    return { completable: true }
  }

  const subLogics = objective.logic.split('_');
  const deltaType = subLogics[0];
  const operator = subLogics[1] as 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT';
  if (deltaType === 'CURR')
    return checkCurrent(layers, objective.target, account, operator);
  else if (deltaType === 'INC')
    return checkIncrease(layers, objective, quest, account, operator);
  else if (deltaType === 'DEC')
    return checkDecrease(layers, objective, quest, account, operator);
  else if (deltaType === 'BOOL')
    return checkBoolean(layers, objective.target, account, operator);
  else
    return { completable: false }; // should not get here
}


const checkCurrent = (
  layers: Layers,
  condition: Target,
  account: Account,
  logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'
): Status => {
  const accVal = getAccBal(layers, account, condition.index, condition.type) || 0;

  return {
    target: condition.value,
    current: accVal,
    completable: checkLogicOperator(accVal, condition.value ?? 0, logic)
  };
}

const checkIncrease = (
  layers: Layers,
  objective: Objective,
  quest: Quest,
  account: Account,
  logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'
): Status => {
  const prevVal = querySnapshotObjective(layers, quest.id, objective.index).target.value as number;
  const currVal = getData(layers, account.id, objective.target.type, objective.target.index);

  return {
    target: objective.target.value,
    current: currVal - prevVal,
    completable: checkLogicOperator(currVal - prevVal, objective.target.value ? objective.target.value : 0, logic)
  };
}

const checkDecrease = (
  layers: Layers,
  objective: Objective,
  quest: Quest,
  account: Account,
  logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'
): Status => {
  const prevVal = querySnapshotObjective(layers, quest.id, objective.index).target.value as number;
  const currVal = getData(layers, account.id, objective.target.type, objective.target.index);

  return {
    target: objective.target.value,
    current: prevVal - currVal,
    completable: checkLogicOperator(prevVal - currVal, objective.target.value ? objective.target.value : 0, logic)
  }
}

const checkBoolean = (
  layers: Layers,
  condition: Target,
  account: Account,
  logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'
): Status => {
  const _type = condition.type;

  let result = false;

  switch (_type) {
    case 'QUEST':
      result = checkQuestComplete(layers, condition.value as number, account);
      break;
    default:
      result = false; // should not get here
  }

  if (logic == 'NOT') result = !result;

  return {
    completable: result
  }
}

const checkQuestComplete = (
  layers: Layers,
  questIndex: number,
  account: Account
): boolean => {
  const quests = queryQuestsX(layers, { account: account.id, index: questIndex, completed: true });

  return quests.length > 0;
}

const getAccBal = (
  layers: Layers,
  account: Account,
  index: number | undefined,
  type: string
): number => {
  let balance = 0;
  if (['EQUIP', 'FOOD', 'MOD', 'REVIVE'].includes(type)) {
    balance = getInventoryBalance(account, index, type);
  } else if (type === 'COIN') {
    balance = getData(layers, account.id, "COIN_TOTAL", 0) || 0;
  } else if (type === 'KAMI') {
    balance = account.kamis?.length || 0;
  } else if (type === 'ROOM') {
    balance = account.location || 0;
  } else {
    console.log('getAccBal: invalid type');
  }
  return Number(balance);
}

///////////////////////
// UTILS

const getInventoryBalance = (
  account: Account,
  index: number | undefined,
  type: string
): number => {
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
}

const checkLogicOperator = (a: number, b: number, logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'): boolean => {
  if (logic == 'MIN') return a >= b;
  else if (logic == 'MAX') return a <= b;
  else if (logic == 'EQUAL') return a == b;
  else return false; // should not reach here
}



