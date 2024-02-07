import { EntityID, Has, HasValue, QueryFragment, runQuery } from "@latticexyz/recs";
import { NetworkLayer } from "layers/network/types";
import {
  Skill,
  Effect,
  Requirement,
  getSkill,
  getEffect,
  getRequirement,
} from "./types";


/////////////////
// GETTERS

// get all the skills in the registry
export const getRegistrySkills = (network: NetworkLayer): Skill[] => {
  return querySkillsX(network, { registry: true });
};


export const getHolderSkills = (network: NetworkLayer, holder: EntityID): Skill[] => {
  return querySkillsX(network, { holder: holder });
};

export const getSkillByIndex = (network: NetworkLayer, index: number): Skill => {
  const { IsRegistry, SkillIndex } = network.components;
  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(SkillIndex, { value: index })
    ])
  );
  return getSkill(network, entityIndices[0]);
}


/////////////////
// BASE QUERIES

export interface QueryOptions {
  holder?: EntityID;
  index?: number;
  registry?: boolean;
}

// Query for a set of skill with an AND filter
const querySkillsX = (network: NetworkLayer, options: QueryOptions): Skill[] => {
  const {
    HolderID,
    IsRegistry,
    IsSkill,
    SkillIndex,
  } = network.components;

  const toQuery: QueryFragment[] = [Has(IsSkill)];
  if (options?.registry) toQuery.push(Has(IsRegistry));
  if (options?.holder) toQuery.push(HasValue(HolderID, { value: options.holder }));
  if (options?.index) toQuery.push(HasValue(SkillIndex, { value: options.index }));

  return Array.from(runQuery(toQuery)).map(
    (index): Skill => getSkill(network, index)
  );
}

// Get the Entity Indices of the Effect of a Skill
export const querySkillEffects = (network: NetworkLayer, skillIndex: number): Effect[] => {
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
export const querySkillRequirements = (network: NetworkLayer, skillIndex: number): Requirement[] => {
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