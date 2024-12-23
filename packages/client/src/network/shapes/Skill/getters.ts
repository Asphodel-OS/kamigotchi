import { EntityID, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Skill, getSkill, getSkillInstanceEntity } from '.';
import { query, queryByIndex, queryForHolder } from './queries';
import { NullSkill, Options } from './types';

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
  return query(components, { registry: true }).map((entity) =>
    getSkill(world, components, entity, { bonuses: true, requirements: true })
  );
};

export const getForHolder = (
  world: World,
  components: Components,
  holder: EntityID,
  options?: Options
): Skill[] => {
  return queryForHolder(components, holder).map((entity) =>
    getSkill(world, components, entity, options)
  );
};

export const getByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Skill => {
  const entity = queryByIndex(world, components, index);
  if (!entity) return NullSkill;
  return getSkill(world, components, entity, options);
};

export const getForHolderByIndex = (
  world: World,
  components: Components,
  holder: EntityID,
  index: number,
  options?: Options
): Skill => {
  const entity = getSkillInstanceEntity(world, holder, index);
  if (!entity) return NullSkill;
  return getSkill(world, components, entity, options);
};
