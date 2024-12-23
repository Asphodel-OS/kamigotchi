import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getSkill, NullSkill, querySkillRegistry, Skill } from 'network/shapes/Skill';

// cache for skill registry. doesnt ever change, assume stable once retrieved
const SkillCache = new Map<EntityIndex, Skill>(); // skill registry entity -> Skill
const IndexMap = new Map<number, EntityIndex>(); // skill index -> skill registry entity

// get the skill for a kami entity
export const get = (world: World, components: Components, entity: EntityIndex) => {
  if (!entity) return NullSkill;
  if (!SkillCache.has(entity)) process(world, components, entity);
  return SkillCache.get(entity)!;
};

// get a Skill object by Index from the cache. assume the Skill is already populated
export const getByIndex = (world: World, components: Components, index: number) => {
  const entity = IndexMap.get(index);
  if (!entity) return NullSkill;
  return get(world, components, entity);
};

export const initialize = (world: World, components: Components) => {
  const entities = querySkillRegistry(components);
  entities.forEach((entity) => process(world, components, entity));
};

// retrieve a skill's most recent data and update it on the cache
const process = (world: World, components: Components, entity: EntityIndex) => {
  const skill = getSkill(world, components, entity);
  if (skill.index != 0) {
    IndexMap.set(skill.index, entity);
    SkillCache.set(entity, skill);
  }
  return skill;
};
