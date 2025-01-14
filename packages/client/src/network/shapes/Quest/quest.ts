import { EntityID, EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';

import { Components } from 'network/';
import { Allo } from '../Allo';
import { getEntityByHash } from '../utils';
import { meetsObjectives, meetsRequirements } from './functions';
import { Objective, getObjectives } from './objective';
import { query } from './queries';
import { Requirement, getRequirements } from './requirement';
import { getRewards } from './reward';

/////////////////
// SHAPES

export interface BaseQuest {
  id: EntityID;
  index: number;
  entity: EntityIndex;
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
  rewards: Allo[];
  meetsRequirements: boolean;
  meetsObjectives: boolean;
}

// Get a Quest Registry object, complete with all Requirements, Objectives, and Rewards
export const get = (world: World, components: Components, entity: EntityIndex): Quest => {
  const base = getBase(world, components, entity);
  return populate(world, components, base);
};

// get a lightweight base quest without additional details
export const getBase = (world: World, components: Components, entity: EntityIndex): BaseQuest => {
  const { IsRepeatable, Description, Name, QuestIndex, Time } = components;
  const index = (getComponentValue(QuestIndex, entity)?.value ?? 0) as number;
  const registryEntityIndex = query(components, { index: index, registry: true })[0];

  return {
    id: world.entities[entity],
    index,
    entity,
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
  const entity = base.entity;
  const quest = {
    ...base,
    startTime: (getComponentValue(StartTime, entity)?.value ?? 0) as number,
    complete: hasComponent(IsComplete, entity),
    requirements: getRequirements(world, components, base.index),
    objectives: getObjectives(world, components, base.index),
    rewards: getRewards(world, components, base.index),
    meetsRequirements: false,
    meetsObjectives: false,
  };
  quest.meetsRequirements = meetsRequirements(quest);
  quest.meetsObjectives = meetsObjectives(quest);
  return quest;
};

/////////////////
// GETTERS

export const getBaseByEntityIndex = (
  world: World,
  components: Components,
  entity: EntityIndex
): BaseQuest => {
  return getBase(world, components, entity);
};

export const getByEntityIndex = (
  world: World,
  components: Components,
  entity: EntityIndex
): Quest => {
  return get(world, components, entity);
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
  const entity = query(components, { index: index, registry: true })[0];
  if (!entity) return;
  return get(world, components, entity);
};

///////////////
// IDs

export const getInstanceEntity = (
  world: World,
  index: number,
  id: EntityID
): EntityIndex | undefined => {
  // world3: change to 'quest.instance'
  return getEntityByHash(world, ['registry.quest', index, id], ['string', 'uint32', 'uint256']);
};
