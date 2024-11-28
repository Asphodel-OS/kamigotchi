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
import { queryChildrenOf } from '../utils';
import { Options, Requirement, getBonusParentID, getRegistryEntity } from './types';

/////////////////
// GETTERS

// get all the skills in the registry
export const queryRegistrySkills = (components: Components): EntityIndex[] => {
  return querySkillsX(components, { registry: true }, { requirements: true, bonuses: true });
};

export const queryHolderSkills = (
  components: Components,
  holder: EntityID,
  options?: Options
): EntityIndex[] => {
  return querySkillsX(components, { holder: holder }, options);
};

export const querySkillByIndex = (world: World, index: number): EntityIndex | undefined => {
  return getRegistryEntity(world, index);
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
  const { EntityType, OwnsSkillID, IsRegistry, SkillIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (filters?.holder) toQuery.push(HasValue(OwnsSkillID, { value: filters.holder }));
  if (filters?.registry) toQuery.push(Has(IsRegistry));
  if (filters?.index) toQuery.push(HasValue(SkillIndex, { value: filters.index }));
  toQuery.push(HasValue(EntityType, { value: 'SKILL' }));

  return Array.from(runQuery(toQuery));
};

// Get the Entity Indices of the bonuses of a Skill
export const querySkillBonuses = (components: Components, skillIndex: number): EntityIndex[] => {
  return queryChildrenOf(components, getBonusParentID(skillIndex));
};

// Get the Entity Indices of the Requirements of a Skill
export const querySkillRequirements = (
  world: World,
  components: Components,
  skillIndex: number
): Requirement[] => {
  return queryConditionsOf(world, components, 'registry.skill.requirement', skillIndex);
};
