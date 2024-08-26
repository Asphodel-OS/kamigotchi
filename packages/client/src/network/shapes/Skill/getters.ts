import { EntityID, World, getComponentValue } from '@mud-classic/recs';
import { Components } from 'network/';
import { Effect, Skill, getEffect, getSkill, getSkillInstanceEntity, querySkillsX } from '.';
import { queryHolderSkills, querySkillByIndex, querySkillEffects } from './queries';
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
  return querySkillsX(components, { registry: true }).map((entityIndex) =>
    getSkill(world, components, entityIndex, { effects: true, requirements: true })
  );
};

export const getHolderSkills = (
  world: World,
  components: Components,
  holder: EntityID,
  options?: Options
): Skill[] => {
  return queryHolderSkills(components, holder, options).map((entityIndex) =>
    getSkill(world, components, entityIndex, options)
  );
};

export const getSkillByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Skill => {
  const entity = querySkillByIndex(components, index, options);
  return getSkill(world, components, entity, options);
};

export const getHolderSkillByIndex = (
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

export const getSkillEffects = (
  world: World,
  components: Components,
  skillIndex: number
): Effect[] => {
  return querySkillEffects(world, components, skillIndex).map((entityIndex) =>
    getEffect(world, components, entityIndex)
  );
};
