import { EntityID, EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';

import { Components } from 'network/';
import { Reward } from '../Rewards';
import { Objective, queryQuestObjectives } from './objective';
import { query } from './queries';
import { Requirement, queryQuestRequirements } from './requirement';
import { queryQuestRewards } from './reward';

/////////////////
// SHAPES

export interface BaseQuest {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  registryEntityIndex: EntityIndex;
  name: string;
  description: string;
  repeatable: boolean;
}

export interface Quest extends BaseQuest {
  startTime: number;
  complete: boolean;
  repeatable: boolean;
  repeatDuration?: number;
  requirements: Requirement[];
  objectives: Objective[];
  rewards: Reward[];
}

// Get a Quest Registry object, complete with all Requirements, Objectives, and Rewards
export const get = (world: World, components: Components, entityIndex: EntityIndex): Quest => {
  const base = getBase(world, components, entityIndex);
  return populate(world, components, base);
};

// get a lightweight base quest without additional details
export const getBase = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): BaseQuest => {
  const { IsRepeatable, Description, Name, QuestIndex } = components;
  const index = (getComponentValue(QuestIndex, entityIndex)?.value || 0) as number;
  const registryEntityIndex = query(components, { index: index, registry: true })[0];

  return {
    id: world.entities[entityIndex],
    index,
    entityIndex,
    registryEntityIndex,
    name: getComponentValue(Name, registryEntityIndex)?.value || '',
    description: getComponentValue(Description, registryEntityIndex)?.value || '',
    repeatable: hasComponent(IsRepeatable, registryEntityIndex),
  };
};

// populate a BareQuest with all the details of a full Quest
export const populate = (world: World, components: Components, base: BaseQuest) => {
  const { IsComplete, IsRepeatable, Time, StartTime } = components;
  const entityIndex = base.entityIndex;
  const regEntityIndex = base.registryEntityIndex;

  let result: Quest = {
    ...base,
    startTime: (getComponentValue(StartTime, entityIndex)?.value || 0) as number,
    complete: hasComponent(IsComplete, entityIndex),
    requirements: queryQuestRequirements(world, components, base.index),
    objectives: queryQuestObjectives(world, components, base.index),
    rewards: queryQuestRewards(world, components, base.index),
  };

  if (hasComponent(IsRepeatable, regEntityIndex)) {
    result.repeatDuration = getComponentValue(Time, regEntityIndex)?.value || 0;
  }

  return result;
};

/////////////////
// GETTERS

export const getBaseByEntityIndex = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): BaseQuest => {
  return getBase(world, components, entityIndex);
};

export const getByEntityIndex = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Quest => {
  return get(world, components, entityIndex);
};

// retrieves a list of Quest Objects from a list of their EntityIndices
export const getByEntityIndices = (
  world: World,
  components: Components,
  entityIndices: EntityIndex[]
): Quest[] => {
  return entityIndices.map((index) => getByEntityIndex(world, components, index));
};

export const getByIndex = (
  world: World,
  components: Components,
  index: number
): Quest | undefined => {
  const entityIndex = query(components, { index: index, registry: true })[0];
  if (!entityIndex) return;
  return get(world, components, entityIndex);
};

// export const getRegistry = (world: World, components: Components): Quest[] => {
//   return query(world, components, { registry: true });
// };

// // get the list of Completed Quests for an Account
// export const getCompleted = (
//   world: World,
//   components: Components,
//   accountID: EntityID
// ): Quest[] => {
//   return query(world, components, { account: accountID, completed: true });
// };

// // get the list of Ongoing Quests for an Account
// export const getOngoing = (world: World, components: Components, accountID: EntityID): Quest[] => {
//   return query(world, components, { account: accountID, completed: false });
// };

// /////////////////
// // QUERIES

// export interface QueryOptions {
//   account?: EntityID;
//   completed?: boolean;
//   index?: number;
//   registry?: boolean;
// }

// // Query for Entity Indices of Quests, depending on the options provided
// export const query = (world: World, components: Components, options: QueryOptions): Quest[] => {
//   const { OwnsQuestID, IsComplete, IsQuest, IsRegistry, QuestIndex } = components;

//   const toQuery: QueryFragment[] = [Has(IsQuest)];
//   if (options?.registry) toQuery.push(Has(IsRegistry));
//   if (options?.account) toQuery.push(HasValue(OwnsQuestID, { value: options.account }));
//   if (options?.index) toQuery.push(HasValue(QuestIndex, { value: options.index }));
//   if (options?.completed !== undefined) {
//     if (options?.completed) toQuery.push(Has(IsComplete));
//     else toQuery.push(Not(IsComplete));
//   }

//   const raw = Array.from(runQuery(toQuery));
//   return raw.map((index): Quest => get(world, components, index));
// };
