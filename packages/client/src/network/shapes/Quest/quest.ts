import { EntityID, EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';

import { Components } from 'network/';
import { Reward } from '../Rewards';
import { Objective, getObjectives } from './objective';
import { query } from './queries';
import { Requirement, getRequirements } from './requirement';
import { getRewards } from './reward';

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
  repeatDuration?: number;
}

export interface Quest extends BaseQuest {
  startTime: number;
  complete: boolean;
  repeatable: boolean;
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
  const { IsRepeatable, Description, Name, QuestIndex, Time } = components;
  const index = (getComponentValue(QuestIndex, entityIndex)?.value ?? 0) as number;
  const registryEntityIndex = query(components, { index: index, registry: true })[0];

  return {
    id: world.entities[entityIndex],
    index,
    entityIndex,
    registryEntityIndex,
    name: getComponentValue(Name, registryEntityIndex)?.value ?? '',
    description: getComponentValue(Description, registryEntityIndex)?.value ?? '',
    repeatable: hasComponent(IsRepeatable, registryEntityIndex),
    repeatDuration: getComponentValue(Time, registryEntityIndex)?.value ?? 0,
  };
};

// populate a BareQuest with all the details of a full Quest
export const populate = (world: World, components: Components, base: BaseQuest): Quest => {
  const { IsComplete, StartTime } = components;
  const entityIndex = base.entityIndex;

  return {
    ...base,
    startTime: (getComponentValue(StartTime, entityIndex)?.value ?? 0) as number,
    complete: hasComponent(IsComplete, entityIndex),
    requirements: getRequirements(world, components, base.index),
    objectives: getObjectives(world, components, base.index),
    rewards: getRewards(world, components, base.index),
  };
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
