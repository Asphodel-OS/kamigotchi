import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { BigNumber, utils } from 'ethers';

import { baseURI } from 'constants/media';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Condition, queryConditionsOf } from '../Conditional';
import { DetailedEntity } from '../utils';

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
  effects?: Effect[];
  requirements?: Requirement[];
}

export interface Effect {
  id: EntityID;
  type: string;
  subtype: string;
  value: number;
}

export interface Requirement extends Condition {}

export interface Options {
  requirements?: boolean;
  effects?: boolean;
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
  effects: [],
  requirements: [],
};

// Get a Skill Registry object with effect and requirements
export const getSkill = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  options?: Options
): Skill => {
  const {
    IsRegistry,
    IsSkill,
    Cost,
    Description,
    Level,
    Max,
    MediaURI,
    Name,
    SkillIndex,
    SkillPoint,
    Subtype,
  } = components;

  const skillIndex = getComponentValue(SkillIndex, entityIndex)?.value || (0 as number);
  const registryIndex = Array.from(
    runQuery([Has(IsRegistry), Has(IsSkill), HasValue(SkillIndex, { value: skillIndex })])
  )[0];

  let skill: Skill = {
    ObjectType: 'SKILL',
    id: world.entities[entityIndex],
    index: skillIndex,
    name: getComponentValue(Name, registryIndex)?.value || ('' as string),
    description: getComponentValue(Description, registryIndex)?.value || ('' as string),
    image: `${baseURI}${getComponentValue(MediaURI, registryIndex)?.value || ('' as string)}`,
    cost: Number(getComponentValue(Cost, registryIndex)?.value || 0),
    points: {
      current: Number(getComponentValue(SkillPoint, entityIndex)?.value || 0),
      max: Number(getComponentValue(Max, registryIndex)?.value || 0),
    },
    tree: getComponentValue(Subtype, registryIndex)?.value || ('' as string),
    treeTier: Number(getComponentValue(Level, registryIndex)?.value || 0),
  };

  if (options?.effects) skill.effects = getSkillEffects(world, components, skill.index);
  if (options?.requirements)
    skill.requirements = queryConditionsOf(
      world,
      components,
      'registry.skill.requirement',
      skillIndex
    );
  return skill;
};

// Get a Effect Registry object
export const getEffect = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Effect => {
  const { ValueSigned, Subtype, Type } = components;

  let effect: Effect = {
    id: world.entities[entityIndex],
    type: getComponentValue(Type, entityIndex)?.value || ('' as string),
    subtype: getComponentValue(Subtype, entityIndex)?.value || ('' as string),
    value:
      BigNumber.from(getComponentValue(ValueSigned, entityIndex)?.value || 0)
        .fromTwos(256)
        .toNumber() || (0 as number),
  };

  return effect;
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
