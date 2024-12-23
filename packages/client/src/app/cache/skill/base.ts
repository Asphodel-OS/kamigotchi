import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getSkill as getSkillShape, Skill } from 'network/shapes/Skill';

// cache for skill registry. doesnt ever change, assume stable once retrieved
const SkillCache = new Map<EntityIndex, Skill>(); // skill registry entity -> Skill

// get the skill for a kami entity
export const get = (world: World, components: Components, entity: EntityIndex) => {
  if (!SkillCache.has(entity)) process(world, components, entity);
  return SkillCache.get(entity)!;
};

// retrieve a skill's most recent data and update it on the cache
export const process = (world: World, components: Components, entity: EntityIndex) => {
  const skill = getSkillShape(world, components, entity);
  SkillCache.set(entity, skill);
  return skill;
};
