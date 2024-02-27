import { EntityID, Has, HasValue, QueryFragment, runQuery } from '@latticexyz/recs';
import { NetworkLayer } from 'layers/network/types';
import { Effect, Options, Requirement, Skill, getEffect, getRequirement, getSkill } from './types';

/////////////////
// GETTERS

// get all the skills in the registry
export const getRegistrySkills = (network: NetworkLayer): Skill[] => {
  return querySkillsX(network, { registry: true }, { requirements: true, effects: true });
};

export const getHolderSkills = (
  network: NetworkLayer,
  holder: EntityID,
  options?: Options
): Skill[] => {
  return querySkillsX(network, { holder: holder }, options);
};

export const getSkillByIndex = (network: NetworkLayer, index: number, options?: Options): Skill => {
  const { IsRegistry, SkillIndex } = network.components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(SkillIndex, { value: index })])
  );
  return getSkill(network, entityIndices[0], options);
};

/////////////////
// BASE QUERIES

export interface Filters {
  holder?: EntityID;
  index?: number;
  registry?: boolean;
}

// Query for a set of skill with an AND filter
const querySkillsX = (network: NetworkLayer, filters: Filters, options?: Options): Skill[] => {
  const { HolderID, IsRegistry, IsSkill, SkillIndex } = network.components;

  const toQuery: QueryFragment[] = [Has(IsSkill)];
  if (filters?.registry) toQuery.push(Has(IsRegistry));
  if (filters?.holder) toQuery.push(HasValue(HolderID, { value: filters.holder }));
  if (filters?.index) toQuery.push(HasValue(SkillIndex, { value: filters.index }));

  return Array.from(runQuery(toQuery)).map(
    (entityIndex): Skill => getSkill(network, entityIndex, options)
  );
};

// Get the Entity Indices of the Effect of a Skill
export const querySkillEffects = (network: NetworkLayer, skillIndex: number): Effect[] => {
  const { IsRegistry, IsEffect, SkillIndex } = network.components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), Has(IsEffect), HasValue(SkillIndex, { value: skillIndex })])
  );
  return entityIndices.map((entityIndex) => getEffect(network, entityIndex));
};

// Get the Entity Indices of the Requirements of a Skill
export const querySkillRequirements = (
  network: NetworkLayer,
  skillIndex: number
): Requirement[] => {
  const { IsRegistry, IsRequirement, SkillIndex } = network.components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), Has(IsRequirement), HasValue(SkillIndex, { value: skillIndex })])
  );
  return entityIndices.map((entityIndex) => getRequirement(network, entityIndex));
};
