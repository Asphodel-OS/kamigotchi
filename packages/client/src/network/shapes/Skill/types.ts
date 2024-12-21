import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { getSkillBonuses } from '.';
import { Bonus } from '../Bonus';
import { Condition, queryConditionsOf } from '../Conditional';
import { DetailedEntity, getEntityByHash, hashArgs } from '../utils';
import { getSkillImage } from '../utils/images';

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
export const getSkill = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Skill => {
  const { Cost, Description, Level, Max, Name, Type, SkillIndex, SkillPoint } = components;

  const skillIndex = getComponentValue(SkillIndex, entity)?.value || (0 as number);
  const registryIndex = getRegistryEntity(world, skillIndex);
  if (!registryIndex) return NullSkill;

  const name = getComponentValue(Name, registryIndex)?.value || ('' as string);

  let skill: Skill = {
    ObjectType: 'SKILL',
    id: world.entities[entity],
    index: skillIndex,
    name: name,
    description: getComponentValue(Description, registryIndex)?.value || ('' as string),
    image: getSkillImage(name),
    cost: Number(getComponentValue(Cost, registryIndex)?.value || 0),
    points: {
      current: Number(getComponentValue(SkillPoint, entity)?.value || 0),
      max: Number(getComponentValue(Max, registryIndex)?.value || 0),
    },
    tree: getComponentValue(Type, registryIndex)?.value || ('' as string),
    treeTier: Number(getComponentValue(Level, registryIndex)?.value || 0),
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

export const getRegistryEntity = (world: World, index: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['registry.skill', index], ['string', 'uint32']);
};

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

export const getBonusParentID = (skillIndex: number): EntityID => {
  return hashArgs(['registry.skill.bonus', skillIndex], ['string', 'uint32']);
};
