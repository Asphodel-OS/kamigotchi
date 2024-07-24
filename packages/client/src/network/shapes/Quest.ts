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

import { Components } from 'network/';
import { Account } from './Account';
import {
  Condition,
  Status,
  Target,
  checkBoolean,
  checkCurrent,
  checkLogicOperator,
  checkerSwitch,
  getCondition,
} from './Conditional';
import { queryConditionsOf, queryConditionsOfEntityIndex } from './Conditional/queries';
import { getData } from './utils';

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
    StartTime,
  } = components;

  const questIndex = getComponentValue(QuestIndex, entityIndex)?.value || (0 as number);
  const registryIndex = Array.from(
    runQuery([Has(IsRegistry), Has(IsQuest), HasValue(QuestIndex, { value: questIndex })])
  )[0];

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
    rewards: queryQuestRewards(world, components, questIndex),
  };

  if (hasComponent(IsRepeatable, registryIndex)) {
    result.repeatDuration = getComponentValue(Time, registryIndex)?.value || (0 as number);
  }

  return result;
};

// Get an Objective Registry object
const getObjective = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Objective => {
  const { Name } = components;

  return {
    ...getCondition(world, components, entityIndex),
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
  };
};

// Get a Reward Registry object
const getReward = (world: World, components: Components, entityIndex: EntityIndex): Reward => {
  const { Value, Index, Type } = components;

  let reward: Reward = {
    id: world.entities[entityIndex],
    target: {
      type: getComponentValue(Type, entityIndex)?.value || ('' as string),
    },
  };

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) reward.target.index = index;

  const value = getComponentValue(Value, entityIndex)?.value;
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
  return queryConditionsOf(world, components, 'registry.quest.requirement', questIndex);
};

// Get the Entity Indices of the Objectives of a Quest
const queryQuestObjectives = (
  world: World,
  components: Components,
  questIndex: number
): Objective[] => {
  return queryConditionsOfEntityIndex(components, 'registry.quest.objective', questIndex).map(
    (index) => getObjective(world, components, index)
  );
};

// Get the Entity Indices of the Rewards of a Quest
const queryQuestRewards = (world: World, components: Components, questIndex: number): Reward[] => {
  return queryConditionsOfEntityIndex(components, 'registry.quest.reward', questIndex).map(
    (entityIndex) => getReward(world, components, entityIndex)
  );
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
