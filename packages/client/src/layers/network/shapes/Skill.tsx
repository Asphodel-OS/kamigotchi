import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
  QueryFragment,
} from '@latticexyz/recs';

import { Account } from './Account';
import { Kami } from './Kami';
import { baseURI } from "constants/media";
import { NetworkLayer } from 'layers/network/types';

/////////////////
// GETTERS

export const getRegistrySkills = (network: NetworkLayer): Skill[] => {
  return querySkillsX(network, { registry: true });
};

export const getSkills = (network: NetworkLayer, holder: EntityID): Skill[] => {
  return querySkillsX(network, { holder: holder });
};

/////////////////
// SHAPES

export interface Skill {
  id: EntityID;
  index: number;
  name: string;
  description: string;
  cost: number;
  level: number;
  max: number;
  effects: Effect[];
  requirements: Requirement[];
  uri: string;
}

export interface Effect {
  id: EntityID;
  type: string;
  index?: number;
  value?: number;
}

export interface Requirement {
  id: EntityID;
  logic: string;
  type: string;
  index?: number;
  value?: number;
  status?: Status;
}

export interface Status {
  target?: number;
  current?: number;
  completable: boolean;
}


// Get a Skill Registry object with effect and requirements
const getSkill = (network: NetworkLayer, entityIndex: EntityIndex): Skill => {
  const {
    world,
    components: {
      IsRegistry,
      IsSkill,
      Cost,
      Description,
      Max,
      MediaURI,
      Name,
      SkillIndex,
      SkillPoint
    },
  } = network;

  const skillIndex = getComponentValue(SkillIndex, entityIndex)?.value || 0 as number;
  const registryIndex = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsSkill),
      HasValue(SkillIndex, { value: skillIndex })
    ])
  )[0];

  return {
    id: world.entities[entityIndex],
    index: skillIndex,
    cost: Number(getComponentValue(Cost, registryIndex)?.value || 0),
    level: Number(getComponentValue(SkillPoint, entityIndex)?.value || 0),
    max: Number(getComponentValue(Max, registryIndex)?.value || 0),
    name: getComponentValue(Name, registryIndex)?.value || '' as string,
    description: getComponentValue(Description, registryIndex)?.value || '' as string,
    effects: querySkillEffects(network, skillIndex),
    requirements: querySkillRequirements(network, skillIndex),
    uri: `${baseURI}${getComponentValue(MediaURI, registryIndex)?.value || '' as string}`,
  };
}

export const getSkillByIndex = (
  network: NetworkLayer,
  index: number, // skill index of the registry instance
): Skill => {
  const { IsRegistry, SkillIndex } = network.components;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(SkillIndex, { value: index })
    ])
  );
  return getSkill(network, entityIndices[0]);
}

// Get a Effect Registry object
const getEffect = (network: NetworkLayer, entityIndex: EntityIndex): Effect => {
  const {
    world,
    components: {
      Index,
      Type,
      Value,
    },
  } = network;


  let effect: Effect = {
    id: world.entities[entityIndex],
    type: getComponentValue(Type, entityIndex)?.value || '' as string,
  }

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) effect.index = index;

  const value = getComponentValue(Value, entityIndex)?.value
  if (value) effect.value = value;

  return effect;
}

// Get a Requirement Registry object
const getRequirement = (network: NetworkLayer, entityIndex: EntityIndex): Requirement => {
  const {
    world,
    components: {
      Index,
      LogicType,
      Type,
      Value,
    },
  } = network;


  let requirement: Requirement = {
    id: world.entities[entityIndex],
    logic: getComponentValue(LogicType, entityIndex)?.value || '' as string,
    type: getComponentValue(Type, entityIndex)?.value || '' as string,
  }

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) requirement.index = index;

  const value = getComponentValue(Value, entityIndex)?.value
  if (value) requirement.value = value;

  return requirement;
}

/////////////////
// QUERIES

export interface QueryOptions {
  holder?: EntityID;
  index?: number;
  registry?: boolean;
}

const querySkillsX = (
  network: NetworkLayer,
  options: QueryOptions,
): Skill[] => {
  const {
    HolderID,
    IsRegistry,
    IsSkill,
    SkillIndex,
  } = network.components;

  const toQuery: QueryFragment[] = [Has(IsSkill)];

  if (options?.holder) {
    toQuery.push(HasValue(HolderID, { value: options.holder }));
  }

  if (options?.registry) {
    toQuery.push(Has(IsRegistry));
  }

  if (options?.index) {
    toQuery.push(HasValue(SkillIndex, { value: options.index }));
  }

  const raw = Array.from(
    runQuery(toQuery)
  );

  return raw.map(
    (index): Skill => getSkill(network, index)
  );
}

// Get the Entity Indices of the Effect of a Skill
const querySkillEffects = (network: NetworkLayer, skillIndex: number): Effect[] => {
  const { IsRegistry, IsEffect, SkillIndex } = network.components;
  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsEffect),
      HasValue(SkillIndex, { value: skillIndex })
    ])
  );
  return entityIndices.map((entityIndex) => getEffect(network, entityIndex));
}

// Get the Entity Indices of the Requirements of a Skill
const querySkillRequirements = (network: NetworkLayer, skillIndex: number): Requirement[] => {
  const { IsRegistry, IsRequirement, SkillIndex } = network.components;
  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsRequirement),
      HasValue(SkillIndex, { value: skillIndex })
    ])
  );
  return entityIndices.map((entityIndex) => getRequirement(network, entityIndex));
}

///////////////////////
// CHECKS

export const checkCost = (
  skill: Skill,
  holder: Account | Kami,
): boolean => {
  return holder.skillPoints >= skill.cost;
}

export const checkMaxxed = (
  skill: Skill,
  holder: Account | Kami,
): Status => {
  const target = skill.max;
  const current = holder.skills?.find((n) => n.index === skill.index)?.level || 0;
  return {
    target: target,
    current: current,
    completable: current < target
  };
}

export const checkRequirement = (
  requirement: Requirement,
  holder: Account | Kami,
): Status => {
  switch (requirement.type) {
    case 'LEVEL':
      return checkLevel(requirement, holder);
    case 'SKILL':
      return checkSkill(requirement, holder);
    default:
      return { completable: false }; // should not get here
  }
}

const checkLevel = (
  condition: Requirement,
  holder: Account | Kami,
): Status => {
  const target = Number(condition.value as number || 0);
  const current = Number(holder.level);
  return {
    target: target,
    current: current,
    completable: current >= target,
  };
}

const checkSkill = (
  condition: Requirement,
  holder: Account | Kami,
): Status => {
  const target = Number(condition.value as number || 0);
  const current = Number(holder.skills?.find((n) => n.index === condition.index)?.level || 0);
  return {
    target: target,
    current: current,
    completable: current >= target,
  }
}
