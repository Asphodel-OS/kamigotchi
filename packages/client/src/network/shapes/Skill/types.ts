import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { getSkillBonuses } from '.';
import { Bonus } from '../Bonus';
import { Condition, queryConditionsOf } from '../Conditional';
import { DetailedEntity, getEntityByHash } from '../utils';
import {
  getCost,
  getDescription,
  getLevel,
  getMax,
  getName,
  getSkillIndex,
  getSkillPoints,
  getType,
} from '../utils/component';
import { getSkillImage } from '../utils/images';
import { queryByIndex } from './queries';

/////////////////
// SHAPES

export interface Skill extends DetailedEntity {
  id: EntityID;
  index: number;
  cost: number;
  tree: string;
  treeTier: number;
  points: {
    current?: number;
    max: number;
  };
  bonuses?: Bonus[];
  requirements?: Requirement[];
}

export interface Requirement extends Condition {}

export interface Options {
  requirements?: boolean;
  bonuses?: boolean;
}

export const NullSkill: Skill = {
  ObjectType: 'SKILL',
  id: '0' as EntityID,
  index: 0,
  name: '',
  description: '',
  image: '',
  cost: 0,
  points: {
    current: 0,
    max: 0,
  },
  treeTier: 0,
  tree: 'NONE',
  bonuses: [],
  requirements: [],
};

// Get a Skill Registry object with bonus and requirements
export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Skill => {
  const skillIndex = getSkillIndex(components, entity);
  const registryEntity = queryByIndex(world, components, skillIndex);
  if (!registryEntity) return NullSkill;

  const name = getName(components, registryEntity);

  let skill: Skill = {
    ObjectType: 'SKILL',
    id: world.entities[entity],
    index: skillIndex,
    name: name,
    description: getDescription(components, registryEntity),
    image: getSkillImage(name),
    cost: getCost(components, registryEntity),
    points: {
      current: getSkillPoints(components, entity),
      max: getMax(components, registryEntity),
    },
    tree: getType(components, registryEntity),
    treeTier: getLevel(components, registryEntity),
  };

  if (options?.bonuses) skill.bonuses = getSkillBonuses(world, components, skill.index);
  if (options?.requirements)
    skill.requirements = queryConditionsOf(
      world,
      components,
      'registry.skill.requirement',
      skillIndex
    );
  return skill;
};

// Get a Requirement Registry object
export const getRequirement = (
  world: World,
  components: Components,
  entity: EntityIndex
): Requirement => {
  const { Value, Index, LogicType, Type } = components;

  return {
    id: world.entities[entity],
    logic: getComponentValue(LogicType, entity)?.value || ('' as string),
    target: {
      type: getComponentValue(Type, entity)?.value || ('' as string),
      index: getComponentValue(Index, entity)?.value,
      value: getComponentValue(Value, entity)?.value,
    },
  };
};

//////////////////
// IDs

export const getInstanceEntity = (
  world: World,
  holderID: EntityID,
  index: number
): EntityIndex | undefined => {
  if (!holderID) return;
  return getEntityByHash(
    world,
    ['skill.instance', holderID, index],
    ['string', 'uint256', 'uint32']
  );
};
