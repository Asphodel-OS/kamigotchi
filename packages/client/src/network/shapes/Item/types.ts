import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { Address } from 'viem';

import { Components } from 'network/components';
import { hasFlag } from '../Flag';
import { DetailedEntity, getItemImage } from '../utils';
import {
  getDescription,
  getFor,
  getItemIndex,
  getName,
  getRarity,
  getTokenAddress,
  getType,
} from '../utils/component';
import { NullItem } from './constants';
import { Effects, getEffects } from './effects';
import { getRequirements, Requirements } from './requirements';

// The standard shape of a FE Item Entity
export interface Item extends DetailedEntity {
  id: EntityID;
  entity: EntityIndex;
  index: number;
  type: string;
  rarity: number;
  for: string;
  address?: Address;
  requirements: Requirements;
  effects: Effects;
  is: {
    tradeable: boolean;
  };
}

export const getItemDetails = (comps: Components, entity: EntityIndex): DetailedEntity => {
  const name = getName(comps, entity) ?? 'Unknown Item';
  return {
    ObjectType: 'ITEM',
    entity,
    name,
    description: getDescription(comps, entity),
    image: getItemImage(name),
  };
};

/**
 * Gets info about an item from an SC item registry
 * Supplements additional data for FE consumption if available
 * @param world - the world object
 * @param comps - the list (as object) of registered comps in the world
 * @param entity - the entity index of the item in the registry
 */
export const getItem = (world: World, comps: Components, entity: EntityIndex): Item => {
  if (!entity) return NullItem;
  const index = getItemIndex(comps, entity);

  let item: Item = {
    ...getItemDetails(comps, entity),
    entity,
    id: world.entities[entity],
    index,
    type: getType(comps, entity),
    rarity: getRarity(comps, entity),
    for: getFor(comps, entity),
    requirements: getRequirements(world, comps, index),
    effects: getEffects(world, comps, index),
    is: {
      tradeable: !hasFlag(world, comps, entity, 'NOT_TRADABLE'),
    },
  };

  if (item.type === 'ERC20') item.address = getTokenAddress(comps, entity);

  return item;
};
