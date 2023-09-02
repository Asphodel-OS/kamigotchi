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


/////////////////
// SHAPES

export interface Quest {
  id: EntityID;
  index: number;
  name: string;
  description: string;
  complete: boolean;
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
        Description,
        Name,
        QuestIndex,
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

  return {
    id: world.entities[entityIndex],
    index: questIndex,
    name: getComponentValue(Name, registryIndex)?.value || '' as string,
    description: getComponentValue(Description, registryIndex)?.value || '' as string,
    complete: hasComponent(IsComplete, entityIndex) || false as boolean,
    requirements: queryQuestRequirements(layers, questIndex),
    objectives: queryQuestObjectives(layers, questIndex),
    rewards: queryQuestRewards(layers, questIndex),
  };
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
      return checkCurrent(requirement.target, account, 'EQUAL');
    case 'COMPLETE':
      return checkBoolean(layers, requirement.target, account, 'IS');
    case 'HAVE':
      return checkCurrent(requirement.target, account, 'MIN');
    case 'GREATER':
      return checkCurrent(requirement.target, account, 'MIN');
    case 'LESSER':
      return checkCurrent(requirement.target, account, 'MAX');
    case 'EQUAL':
      return checkCurrent(requirement.target, account, 'EQUAL');
    case 'USE':
      return checkCurrent(requirement.target, account, 'MIN');
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
  switch (objective.logic) {
    case 'AT':
      return checkCurrent(objective.target, account, 'EQUAL');
    case 'BUY':
      return checkIncrease(layers, objective, quest, account, 'MIN');
    case 'HAVE':
      return checkCurrent(objective.target, account, 'MIN');
    case 'GATHER':
      return checkIncrease(layers, objective, quest, account, 'MIN');
    case 'MINT':
      return checkIncrease(layers, objective, quest, account, 'MIN');
    case 'USE':
      return checkDecrease(layers, objective, quest, account, 'MIN');
    default:
      return { completable: false }; // should not get here
  }
}


const checkCurrent = (
  condition: Target,
  account: Account,
  logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'
): Status => {
  const accVal = getAccBal(account, condition.index, condition.type);

  return {
    target: condition.value,
    current: accVal,
    completable: checkLogicOperator(accVal, condition.value ? condition.value : 0, logic)
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
  const currVal = getAccBal(account, objective.target.index, objective.target.type);

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
  const currVal = getAccBal(account, objective.target.index, objective.target.type);

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
  account: Account,
  index: number | undefined,
  type: string
): number => {
  switch (type) {
    // inventories
    case 'EQUIP':
      return getInventoryBalance(account, index, type);
    case 'FOOD':
      return getInventoryBalance(account, index, type);
    case 'MOD':
      return getInventoryBalance(account, index, type);
    case 'REVIVE':
      return getInventoryBalance(account, index, type);
    // others
    case 'COIN':
      return account.coin;
    case 'KAMI':
      return account.kamis?.length || 0;
    case 'ROOM':
      return account.location;
    default:
      return 0; // should not reach here
  }
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

  switch (type) {
    case 'EQUIP':
      return getInventoryByIndex(account.inventories.gear, index)?.balance || 0;
    case 'FOOD':
      return getInventoryByIndex(account.inventories.food, index)?.balance || 0;
    case 'MOD':
      return getInventoryByIndex(account.inventories.mods, index)?.balance || 0;
    case 'REVIVE':
      return getInventoryByIndex(account.inventories.revives, index)?.balance || 0;
    default:
      return 0; // should not reach here
  }
}

const checkLogicOperator = (a: number, b: number, logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'): boolean => {
  if (logic == 'MIN') return a >= b;
  else if (logic == 'MAX') return a <= b;
  else if (logic == 'EQUAL') return a == b;
  else return false; // should not reach here
}



