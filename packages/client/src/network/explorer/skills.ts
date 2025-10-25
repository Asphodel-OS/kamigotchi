import { EntityIndex, World } from 'engine/recs';

import { Components } from 'network/';
import { getRegistrySkills, getSkill, getSkillByIndex } from 'network/shapes/Skill';

export const skills = (world: World, components: Components) => {
  return {
    all: () => getRegistrySkills(world, components),
    get: (entity: EntityIndex) => getSkill(world, components, entity),
    getByIndex: (index: number) => getSkillByIndex(world, components, index),
    indices: () => Array.from(components.SkillIndex.values.value.values()),
  };
};
