import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { DetailedEntity, getItemImage } from '../utils';
import { getDescription, getFor, getItemIndex, getName, getType } from '../utils/component';
import { Effects, getEffects } from './effects';
import { getRequirements, Requirements } from './requirements';

// The standard shape of a FE Item Entity
export interface Item extends DetailedEntity {
  id: EntityID;
  entity: EntityIndex;
  index: number;
  for: string;
  type: string;
  requirements: Requirements;
  effects: Effects;
}

export const NullItem: Item = {
  ObjectType: 'ITEM',
  id: '0' as EntityID,
  entity: 0 as EntityIndex,
  index: 0,
  type: '',
  for: '',
  image: '',
  name: '',
  requirements: { use: [] },
  effects: { use: [] },
};

export const getItemDetails = (comps: Components, entity: EntityIndex): DetailedEntity => {
  const name = getName(comps, entity) ?? 'Unknown Item';
  return {
    ObjectType: 'ITEM',
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
    for: getFor(comps, entity),
    requirements: getRequirements(world, comps, index),
    effects: getEffects(world, comps, index),
  };

  return item;
};
