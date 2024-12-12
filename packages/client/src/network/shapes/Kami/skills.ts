import { EntityIndex, getComponentValue, World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getHolderSkills, Skill } from '../Skill';

export interface Skills {
  points: number;
  tree: Skill[];
}

export const getSkills = (world: World, components: Components, entity: EntityIndex): Skills => {
  const { SkillPoint } = components;
  const id = world.entities[entity];
  return {
    points: (getComponentValue(SkillPoint, entity)?.value ?? 0) * 1,
    tree: getHolderSkills(world, components, id),
  };
};
