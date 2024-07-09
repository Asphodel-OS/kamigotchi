import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { Stats, getStats } from '../Stats';
import { DetailedEntity, getImage } from '../utils';

// The standard shape of a FE Item Entity
export interface Item extends DetailedEntity {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  is: {
    consumable: boolean;
    lootbox: boolean;
  };
  type: string;
  stats?: Stats;
  experience?: number; // maybe merge in Stats in future?
}

/**
 * Gets info about an item from an SC item registry
 * Supplements additional data for FE consumption if available
 * @param world - the world object
 * @param components - the list (as object) of registered components in the world
 * @param entityIndex - the entity index of the item in the registry
 */
export const getItem = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  index?: number
): Item => {
  const { Description, Experience, ItemIndex, IsConsumable, IsLootbox, Name, Type } = components;

  const name =
    (getComponentValue(Name, entityIndex)?.value as string) ??
    `Unknown Item ${index ? '(' + index + ')' : ''}`;
  let item: Item = {
    ObjectType: 'ITEM',
    entityIndex,
    id: world.entities[entityIndex],
    index: getComponentValue(ItemIndex, entityIndex)?.value as number,
    type: getComponentValue(Type, entityIndex)?.value as string,
    name: name,
    description: getComponentValue(Description, entityIndex)?.value as string,
    image: getImage(name),
    stats: getStats(components, entityIndex),
    experience: (getComponentValue(Experience, entityIndex)?.value as number) * 1,
    is: {
      consumable: hasComponent(IsConsumable, entityIndex),
      lootbox: hasComponent(IsLootbox, entityIndex),
    },
  };
  if (hasComponent(IsLootbox, entityIndex)) item.type = 'LOOTBOX';

  return item;
};

/**
 * get an item in the registry by index
 * @param world - the world object
 * @param components - the list (as object) of registered components in the world
 * @param index - the item index of the registry instance
 */

export const getItemByIndex = (world: World, components: Components, index: number): Item => {
  const { IsRegistry, ItemIndex } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: index })])
  );
  return getItem(world, components, entityIndices[0], index);
};

// get all items in the registry
export const getAllItems = (world: World, components: Components): Item[] => {
  const { IsRegistry, ItemIndex } = components;
  const entityIndices = Array.from(runQuery([Has(IsRegistry), Has(ItemIndex)]));
  return entityIndices.map((entityIndex) => getItem(world, components, entityIndex));
};
