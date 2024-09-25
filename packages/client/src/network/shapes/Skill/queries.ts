import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  World,
  runQuery,
} from '@mud-classic/recs';
import { Components } from 'network/';
import { queryConditionsOf } from '../Conditional/queries';
import { Options, Requirement } from './types';

/////////////////
// GETTERS

// get all the skills in the registry
export const queryRegistrySkills = (components: Components): EntityIndex[] => {
  return querySkillsX(components, { registry: true }, { requirements: true, effects: true });
};

export const queryHolderSkills = (
  components: Components,
  holder: EntityID,
  options?: Options
): EntityIndex[] => {
  return querySkillsX(components, { holder: holder }, options);
};

export const querySkillByIndex = (
  components: Components,
  index: number,
  options?: Options
): EntityIndex => {
  const { IsRegistry, SkillIndex } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(SkillIndex, { value: index })])
  );
  return entityIndices[0];
};

/////////////////
// BASE QUERIES

export interface Filters {
  holder?: EntityID;
  index?: number;
  registry?: boolean;
}

// Query for a set of skill with an AND filter
export const querySkillsX = (
  components: Components,
  filters: Filters,
  options?: Options
): EntityIndex[] => {
  const { EntityType, HolderID, IsRegistry, SkillIndex } = components;

  const toQuery: QueryFragment[] = [HasValue(EntityType, { value: 'SKILL' })];
  if (filters?.registry) toQuery.push(Has(IsRegistry));
  if (filters?.holder) toQuery.push(HasValue(HolderID, { value: filters.holder }));
  if (filters?.index) toQuery.push(HasValue(SkillIndex, { value: filters.index }));

  return Array.from(runQuery(toQuery));
};

// Get the Entity Indices of the Effect of a Skill
export const querySkillEffects = (
  world: World,
  components: Components,
  skillIndex: number
): EntityIndex[] => {
  const { IsRegistry, EntityType, SkillIndex } = components;
  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(EntityType, { value: 'EFFECT' }),
      HasValue(SkillIndex, { value: skillIndex }),
    ])
  );
  return entityIndices;
};

// Get the Entity Indices of the Requirements of a Skill
export const querySkillRequirements = (
  world: World,
  components: Components,
  skillIndex: number
): Requirement[] => {
  return queryConditionsOf(world, components, 'registry.skill.requirement', skillIndex);
};
