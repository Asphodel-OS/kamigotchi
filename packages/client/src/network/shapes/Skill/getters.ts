import { EntityID, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Skill, getSkill, getSkillInstanceEntity } from '.';
import { NullSkill } from './constants';
import { query, queryByIndex, queryForHolder } from './queries';

/////////////////
// VALUES

export const getHolderSkillLevel = (
  world: World,
  components: Components,
  holder: EntityID,
  index: number
): number => {
  const { Level } = components;

  const entity = getSkillInstanceEntity(world, holder, index);
  if (!entity) return 0;

  return (getComponentValue(Level, entity)?.value ?? 0) * 1;
};

////////////////
// SHAPES

export const getRegistrySkills = (world: World, components: Components): Skill[] => {
  return query(components, { registry: true }).map((entity) => getSkill(world, components, entity));
};

export const getForHolder = (world: World, components: Components, holder: EntityID): Skill[] => {
  return queryForHolder(components, holder).map((entity) => getSkill(world, components, entity));
};

export const getByIndex = (world: World, components: Components, index: number): Skill => {
  const entity = queryByIndex(world, components, index);
  if (!entity) return NullSkill;
  return getSkill(world, components, entity);
};

export const getForHolderByIndex = (
  world: World,
  components: Components,
  holder: EntityID,
  index: number
): Skill => {
  const entity = getSkillInstanceEntity(world, holder, index);
  if (!entity) return NullSkill;
  return getSkill(world, components, entity);
};
