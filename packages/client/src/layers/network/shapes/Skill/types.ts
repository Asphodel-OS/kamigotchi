import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { baseURI } from 'constants/media';
import { Components } from 'layers/network';
import { querySkillEffects, querySkillRequirements } from './queries';

/////////////////
// SHAPES

export interface Skill {
  id: EntityID;
  index: number;
  name: string;
  description: string;
  uri: string;
  cost: number;
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
  logicType: string;
  value: number;
  index?: number;
}

export interface Requirement {
  id: EntityID;
  logic: string;
  type: string;
  index?: number;
  value?: number;
}

export interface Options {
  requirements?: boolean;
  effects?: boolean;
}

// Get a Skill Registry object with effect and requirements
export const getSkill = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  options?: Options
): Skill => {
  const { IsRegistry, IsSkill, Cost, Description, Max, MediaURI, Name, SkillIndex, SkillPoint } =
    components;

  const skillIndex = getComponentValue(SkillIndex, entityIndex)?.value || (0 as number);
  const registryIndex = Array.from(
    runQuery([Has(IsRegistry), Has(IsSkill), HasValue(SkillIndex, { value: skillIndex })])
  )[0];

  let skill: Skill = {
    id: world.entities[entityIndex],
    index: skillIndex,
    name: getComponentValue(Name, registryIndex)?.value || ('' as string),
    description: getComponentValue(Description, registryIndex)?.value || ('' as string),
    uri: `${baseURI}${getComponentValue(MediaURI, registryIndex)?.value || ('' as string)}`,
    cost: Number(getComponentValue(Cost, registryIndex)?.value || 0),
    points: {
      current: Number(getComponentValue(SkillPoint, entityIndex)?.value || 0),
      max: Number(getComponentValue(Max, registryIndex)?.value || 0),
    },
  };

  if (options?.effects) skill.effects = querySkillEffects(world, components, skill.index);
  if (options?.requirements)
    skill.requirements = querySkillRequirements(world, components, skill.index);
  return skill;
};

// Get a Effect Registry object
export const getEffect = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Effect => {
  const { Index, Subtype, LogicType, Type, Value } = components;

  let effect: Effect = {
    id: world.entities[entityIndex],
    type: getComponentValue(Type, entityIndex)?.value || ('' as string),
    subtype: getComponentValue(Subtype, entityIndex)?.value || ('' as string),
    logicType: getComponentValue(LogicType, entityIndex)?.value || ('' as string),
    value: getComponentValue(Value, entityIndex)?.value || (0 as number),
  };

  effect.index = getComponentValue(Index, entityIndex)?.value;
  return effect;
};

// Get a Requirement Registry object
export const getRequirement = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Requirement => {
  const { Index, LogicType, Type, Value } = components;

  let requirement: Requirement = {
    id: world.entities[entityIndex],
    logic: getComponentValue(LogicType, entityIndex)?.value || ('' as string),
    type: getComponentValue(Type, entityIndex)?.value || ('' as string),
  };

  requirement.index = getComponentValue(Index, entityIndex)?.value;
  requirement.value = getComponentValue(Value, entityIndex)?.value;
  return requirement;
};
