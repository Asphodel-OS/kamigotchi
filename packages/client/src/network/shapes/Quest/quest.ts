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
import { Reward } from '../Rewards';
import { Objective, queryQuestObjectives } from './objective';
import { Requirement, queryQuestRequirements } from './requirement';
import { queryQuestRewards } from './reward';

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

// Get a Quest Registry object, complete with all Requirements, Objectives, and Rewards
export const getQuest = (world: World, components: Components, entityIndex: EntityIndex): Quest => {
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

/////////////////
// GETTERS

export const getByIndex = (
  world: World,
  components: Components,
  index: number
): Quest | undefined => {
  return query(world, components, { index: index, registry: true })[0];
};

export const getRegistry = (world: World, components: Components): Quest[] => {
  return query(world, components, { registry: true });
};

// get the list of Completed Quests for an Account
export const getCompleted = (
  world: World,
  components: Components,
  accountID: EntityID
): Quest[] => {
  return query(world, components, { account: accountID, completed: true });
};

// get the list of Ongoing Quests for an Account
export const getOngoing = (world: World, components: Components, accountID: EntityID): Quest[] => {
  return query(world, components, { account: accountID, completed: false });
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
export const query = (world: World, components: Components, options: QueryOptions): Quest[] => {
  const { OwnsQuestID, IsComplete, IsQuest, IsRegistry, QuestIndex } = components;

  const toQuery: QueryFragment[] = [Has(IsQuest)];
  if (options?.registry) toQuery.push(Has(IsRegistry));
  if (options?.account) toQuery.push(HasValue(OwnsQuestID, { value: options.account }));
  if (options?.index) toQuery.push(HasValue(QuestIndex, { value: options.index }));
  if (options?.completed !== undefined) {
    if (options?.completed) toQuery.push(Has(IsComplete));
    else toQuery.push(Not(IsComplete));
  }

  const raw = Array.from(runQuery(toQuery));
  return raw.map((index): Quest => getQuest(world, components, index));
};
