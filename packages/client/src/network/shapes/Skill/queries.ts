import { EntityID, Has, HasValue, QueryFragment, World, runQuery } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryConditionsOf } from '../Conditional/queries';
import { Effect, Options, Requirement, Skill, getEffect, getSkill } from './types';

/////////////////
// GETTERS

// get all the skills in the registry
export const getRegistrySkills = (world: World, components: Components): Skill[] => {
  return querySkillsX(world, components, { registry: true }, { requirements: true, effects: true });
};

export const getHolderSkills = (
  world: World,
  components: Components,
  holder: EntityID,
  options?: Options
): Skill[] => {
  return querySkillsX(world, components, { holder: holder }, options);
};

export const getSkillByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Skill => {
  const { IsRegistry, SkillIndex } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(SkillIndex, { value: index })])
  );
  return getSkill(world, components, entityIndices[0], options);
};

/////////////////
// BASE QUERIES

export interface Filters {
  holder?: EntityID;
  index?: number;
  registry?: boolean;
}

// Query for a set of skill with an AND filter
const querySkillsX = (
  world: World,
  components: Components,
  filters: Filters,
  options?: Options
): Skill[] => {
  const { HolderID, IsRegistry, IsSkill, SkillIndex } = components;

  const toQuery: QueryFragment[] = [Has(IsSkill)];
  if (filters?.registry) toQuery.push(Has(IsRegistry));
  if (filters?.holder) toQuery.push(HasValue(HolderID, { value: filters.holder }));
  if (filters?.index) toQuery.push(HasValue(SkillIndex, { value: filters.index }));

  return Array.from(runQuery(toQuery)).map(
    (entityIndex): Skill => getSkill(world, components, entityIndex, options)
  );
};

// Get the Entity Indices of the Effect of a Skill
export const querySkillEffects = (
  world: World,
  components: Components,
  skillIndex: number
): Effect[] => {
  const { IsRegistry, IsEffect, SkillIndex } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), Has(IsEffect), HasValue(SkillIndex, { value: skillIndex })])
  );
  return entityIndices.map((entityIndex) => getEffect(world, components, entityIndex));
};

// Get the Entity Indices of the Requirements of a Skill
export const querySkillRequirements = (
  world: World,
  components: Components,
  skillIndex: number
): Requirement[] => {
  return queryConditionsOf(world, components, 'registry.skill.requirement', skillIndex);
};
