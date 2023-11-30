import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
  QueryFragment,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account } from './Account';
import { Kami } from './Kami';

import { baseURI } from "src/constants/media";

/////////////////
// GETTERS

export const getRegistrySkills = (layers: Layers): Skill[] => {
  return querySkillsX(layers, { registry: true });
};

export const getSkills = (layers: Layers, holder: EntityID): Skill[] => {
  return querySkillsX(layers, { holder: holder });
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
const getSkill = (layers: Layers, entityIndex: EntityIndex): Skill => {
  const {
    network: {
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
      world,
    },
  } = layers;

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
    effects: querySkillEffects(layers, skillIndex),
    requirements: querySkillRequirements(layers, skillIndex),
    uri: `${baseURI}${getComponentValue(MediaURI, registryIndex)?.value || '' as string}`,
  };
}

// Get a Effect Registry object
const getEffect = (layers: Layers, entityIndex: EntityIndex): Effect => {
  const {
    network: {
      components: {
        Index,
        Type,
        Value,
      },
      world,
    },
  } = layers;


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
const getRequirement = (layers: Layers, entityIndex: EntityIndex): Requirement => {
  const {
    network: {
      components: {
        Index,
        LogicType,
        Type,
        Value,
      },
      world,
    },
  } = layers;


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
  layers: Layers,
  options: QueryOptions,
): Skill[] => {
  const {
    network: {
      components: {
        HolderID,
        IsRegistry,
        IsSkill,
        SkillIndex,
      },
    },
  } = layers;

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
    (index): Skill => getSkill(layers, index)
  );
}

// Get the Entity Indices of the Effect of a Skill
const querySkillEffects = (layers: Layers, skillIndex: number): Effect[] => {
  const {
    network: {
      components: { IsRegistry, IsEffect, SkillIndex },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsEffect),
      HasValue(SkillIndex, { value: skillIndex })
    ])
  );

  return entityIndices.map(
    (entityIndex): Effect => getEffect(layers, entityIndex)
  );
}

// Get the Entity Indices of the Requirements of a Skill
const querySkillRequirements = (layers: Layers, skillIndex: number): Requirement[] => {
  const {
    network: {
      components: { IsRegistry, IsRequirement, SkillIndex },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsRequirement),
      HasValue(SkillIndex, { value: skillIndex })
    ])
  );

  return entityIndices.map(
    (entityIndex): Requirement => getRequirement(layers, entityIndex)
  );
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
