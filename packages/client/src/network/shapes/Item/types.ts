import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/components';
import { Allo, getAllosOf } from '../Allo';
import { Condition, queryConditionsOfID } from '../Conditional';
import { DetailedEntity, ForType, getFor, getItemImage } from '../utils';
import { getItemAlloAnchorID, getItemReqAnchorID } from './utils';

// The standard shape of a FE Item Entity
export interface Item extends DetailedEntity {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  for: ForType;
  type: string;
  requirements: ItemRequirements;
  effects: ItemEffects;
}

interface ItemRequirements {
  // burn: Condition[];
  // craft: Condition[];
  use: Condition[];
}

interface ItemEffects {
  // burn: Allo[];
  // craft: Allo[];
  use: Allo[];
}

export const NullItem: Item = {
  ObjectType: 'ITEM',
  id: '0' as EntityID,
  entityIndex: 0 as EntityIndex,
  index: 0,
  type: '',
  for: '',
  image: '',
  name: '',
  requirements: { use: [] },
  effects: { use: [] },
};

/**
 * Gets info about an item from an SC item registry
 * Supplements additional data for FE consumption if available
 * @param world - the world object
 * @param components - the list (as object) of registered components in the world
 * @param entityIndex - the entity index of the item in the registry
 */
export const getItem = (world: World, components: Components, entityIndex: EntityIndex): Item => {
  const { ItemIndex, Type } = components;

  const type = getComponentValue(Type, entityIndex)?.value as string;
  const index = getComponentValue(ItemIndex, entityIndex)?.value as number;

  let item: Item = {
    ...getItemDetails(components, entityIndex),
    entityIndex,
    id: world.entities[entityIndex],
    index: index,
    type: type,
    for: getFor(components, entityIndex),
    requirements: getItemRequirements(world, components, index),
    effects: getItemEffects(world, components, index),
  };

  return item;
};

export const getItemDetails = (
  components: Components,
  entityIndex: EntityIndex
): DetailedEntity => {
  const { Name, Description } = components;

  const name = (getComponentValue(Name, entityIndex)?.value as string) ?? 'Unknown Item';

  return {
    ObjectType: 'ITEM',
    image: getItemImage(name),
    name: name,
    description: getComponentValue(Description, entityIndex)?.value as string,
  };
};

const getItemRequirements = (
  world: World,
  components: Components,
  itemIndex: number
): ItemRequirements => {
  return {
    use: getUsecaseRequirements(world, components, itemIndex, 'USE'),
  };
};

const getItemEffects = (world: World, components: Components, itemIndex: number): ItemEffects => {
  return {
    use: getUsecaseAllos(world, components, itemIndex, 'USE'),
  };
};

export const getUsecaseRequirements = (
  world: World,
  components: Components,
  itemIndex: number,
  usecase: string
): Condition[] => {
  const parentID = getItemReqAnchorID(itemIndex, usecase);
  return queryConditionsOfID(world, components, parentID);
};

export const getUsecaseAllos = (
  world: World,
  components: Components,
  itemIndex: number,
  usecase: string
): Allo[] => {
  const parentID = getItemAlloAnchorID(itemIndex, usecase);
  return getAllosOf(world, components, parentID);
};
