import { EntityID, World, getComponentValue } from '@mud-classic/recs';
import { Components } from 'network/';
import { Skill, getSkill, getSkillInstanceEntity, querySkillsX } from '.';
import { Bonus, getBonusesByParent } from '../Bonus';
import { queryHolderSkills, querySkillByIndex } from './queries';
import { NullSkill, Options, getBonusParentID } from './types';

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
    getSkill(world, components, entityIndex, { bonuses: true, requirements: true })
  );
};

export const getHolderSkills = (
  world: World,
  components: Components,
  holder: EntityID,
  options?: Options
): Skill[] => {
  return queryHolderSkills(components, holder).map((entityIndex) =>
    getSkill(world, components, entityIndex, options)
  );
};

export const getSkillByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Skill => {
  const entity = querySkillByIndex(world, index);
  if (!entity) return NullSkill;
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

export const getSkillBonuses = (
  world: World,
  components: Components,
  skillIndex: number
): Bonus[] => {
  const unfiltered = getBonusesByParent(world, components, getBonusParentID(skillIndex));
  // filter out tree bonuses
  return unfiltered.filter((bonus) => !bonus.type.startsWith('SKILL_TREE_'));
};
