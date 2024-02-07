import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { baseURI } from "constants/media";
import { NetworkLayer } from 'layers/network/types';
import { querySkillEffects, querySkillRequirements } from './queries';


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
export const getSkill = (network: NetworkLayer, entityIndex: EntityIndex): Skill => {
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


// Get a Effect Registry object
export const getEffect = (network: NetworkLayer, entityIndex: EntityIndex): Effect => {
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
export const getRequirement = (network: NetworkLayer, entityIndex: EntityIndex): Requirement => {
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

