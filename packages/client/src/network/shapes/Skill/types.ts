import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Bonus } from '../Bonus';
import { Condition, getConditionsOf } from '../Conditional';
import { DetailedEntity, getEntityByHash } from '../utils';
import {
  getCost,
  getDescription,
  getLevel,
  getMax,
  getName,
  getSkillIndex,
  getType,
} from '../utils/component';
import { getSkillImage } from '../utils/images';
import { getBonuses } from './bonuses';
import { NullSkill } from './constants';

export interface Skill extends DetailedEntity {
  id: EntityID;
  index: number;
  type: string; // which skill tree this skill belongs to
  tier: number; // the tier of the skill
  cost: number; // the skillpoing cost of the skill (always 1 now)
  max: number; // max points that can be spent on this skill
  bonuses: Bonus[];
  requirements: Condition[];
}

// Get a Skill Registry object with bonus and requirements
export const get = (world: World, components: Components, entity: EntityIndex): Skill => {
  if (!entity) return NullSkill;
  const name = getName(components, entity);
  const skillIndex = getSkillIndex(components, entity);

  return {
    ObjectType: 'SKILL',
    id: world.entities[entity],
    index: skillIndex,
    name: name,
    description: getDescription(components, entity),
    image: getSkillImage(name),
    cost: getCost(components, entity),
    max: getMax(components, entity),
    // current: getSkillPoints(components, entity),
    type: getType(components, entity),
    tier: getLevel(components, entity),
    bonuses: getBonuses(world, components, skillIndex),
    requirements: getConditionsOf(world, components, 'registry.skill.requirement', skillIndex),
  };
};

//////////////////
// IDs

export const getInstanceEntity = (
  world: World,
  holderID: EntityID,
  index: number
): EntityIndex | undefined => {
  if (!holderID) return;
  return getEntityByHash(
    world,
    ['skill.instance', holderID, index],
    ['string', 'uint256', 'uint32']
  );
};
