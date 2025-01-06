import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Bonus, getBonusRegistry } from '../Bonus';
import { hashArgs, queryChildrenOf } from '../utils';

// query the Entity Indices of the bonuses of a Skill by its index
export const queryBonuses = (components: Components, skillIndex: number): EntityIndex[] => {
  const parentID = genBonusParentID(skillIndex);
  return queryChildrenOf(components, parentID);
};

// get the Bonus objects associated with a Skill by its index
export const getBonuses = (world: World, components: Components, skillIndex: number): Bonus[] => {
  const entities = queryBonuses(components, skillIndex);
  const results = entities.map((entity) => getBonusRegistry(world, components, entity));
  // filter out tree bonuses
  return results.filter((bonus) => !bonus.type.startsWith('SKILL_TREE_'));
};

// generate the EntityID of the bonuses parent for a skill
export const genBonusParentID = (skillIndex: number): EntityID => {
  return hashArgs(['registry.skill.bonus', skillIndex], ['string', 'uint32']);
};
