import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { utils } from 'ethers';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getSkillBonuses } from '.';
import { Bonus } from '../Bonus';
import { Condition, queryConditionsOf } from '../Conditional';
import { DetailedEntity } from '../utils';
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
  entityIndex: EntityIndex,
  options?: Options
): Skill => {
  const {
    EntityType,
    IsRegistry,
    Cost,
    Description,
    Level,
    Max,
    MediaURI,
    Name,
    Type,
    SkillIndex,
    SkillPoint,
  } = components;

  const skillIndex = getComponentValue(SkillIndex, entityIndex)?.value || (0 as number);
  const registryIndex = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(EntityType, { value: 'SKILL' }),
      HasValue(SkillIndex, { value: skillIndex }),
    ])
  )[0];

  const name = getComponentValue(Name, registryIndex)?.value || ('' as string);

  let skill: Skill = {
    ObjectType: 'SKILL',
    id: world.entities[entityIndex],
    index: skillIndex,
    name: name,
    description: getComponentValue(Description, registryIndex)?.value || ('' as string),
    image: getSkillImage(name),
    cost: Number(getComponentValue(Cost, registryIndex)?.value || 0),
    points: {
      current: Number(getComponentValue(SkillPoint, entityIndex)?.value || 0),
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
  entityIndex: EntityIndex
): Requirement => {
  const { Value, Index, LogicType, Type } = components;

  return {
    id: world.entities[entityIndex],
    logic: getComponentValue(LogicType, entityIndex)?.value || ('' as string),
    target: {
      type: getComponentValue(Type, entityIndex)?.value || ('' as string),
      index: getComponentValue(Index, entityIndex)?.value,
      value: getComponentValue(Value, entityIndex)?.value,
    },
  };
};

//////////////////
// IDs

const IDStore = new Map<string, string>();

export const getInstanceEntity = (
  world: World,
  holderID: EntityID,
  index: number
): EntityIndex | undefined => {
  let id = '';
  const key = 'registry.item' + holderID + index.toString();

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(['string', 'uint256', 'uint32'], ['skill.instance', holderID, index])
    );
    IDStore.set(key, id);
  }

  return world.entityToIndex.get(id as EntityID);
};

export const getBonusParentID = (skillIndex: number): EntityID => {
  let id = '';
  const key = 'registry.skill.bonus' + skillIndex.toString();

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(['string', 'uint32'], ['registry.skill.bonus', skillIndex])
    );
  }
  return id as EntityID;
};
