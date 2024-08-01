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

import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/components';
import { Stats, getStats } from '../Stats';
import { DetailedEntity, ForType, getFor, getItemImage } from '../utils';

const IDStore = new Map<string, string>();

// The standard shape of a FE Item Entity
export interface Item extends DetailedEntity {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  is: Is;
  for: ForType;
  type: string;
  stats?: Stats;
  experience?: number; // maybe merge in Stats in future?
}

export interface Is {
  consumable: boolean;
  lootbox: boolean;
}

export const NullItem: Item = {
  ObjectType: 'ITEM',
  id: '0' as EntityID,
  entityIndex: 0 as EntityIndex,
  index: 0,
  type: '',
  is: { consumable: false, lootbox: false },
  for: '',
  image: '',
  name: '',
};

/**
 * Gets info about an item from an SC item registry
 * Supplements additional data for FE consumption if available
 * @param world - the world object
 * @param components - the list (as object) of registered components in the world
 * @param entityIndex - the entity index of the item in the registry
 */
export const getItem = (world: World, components: Components, entityIndex: EntityIndex): Item => {
  const { IsConsumable, IsLootbox, Description, Experience, ItemIndex, Keys, Name, Type, Weights } =
    components;

  let item: Item = {
    ...getItemDetails(components, entityIndex),
    entityIndex,
    id: world.entities[entityIndex],
    index: getComponentValue(ItemIndex, entityIndex)?.value as number,
    type: getComponentValue(Type, entityIndex)?.value as string,
    for: getFor(components, entityIndex),
    stats: getStats(components, entityIndex),
    experience: (getComponentValue(Experience, entityIndex)?.value as number) * 1,
    is: {
      consumable: hasComponent(IsConsumable, entityIndex),
      lootbox: hasComponent(IsLootbox, entityIndex),
    },
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

/////////////////
// INVENTORY

// standardized shape of a FE Inventory Entity
export interface Inventory {
  id: EntityID;
  entityIndex: EntityIndex;
  balance: number;
  item: Item;
}

// get an Inventory from its EntityIndex
export const getInventory = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Inventory => {
  const { Value, IsRegistry, ItemIndex } = components;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, entityIndex)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];

  const inventory = {
    id: world.entities[entityIndex],
    entityIndex: entityIndex,
    item: getItem(world, components, registryEntityIndex),
    balance: (getComponentValue(Value, entityIndex)?.value as number) * 1,
  };

  return inventory;
};

export const getRegEntityIndex = (world: World, itemIndex: number): EntityIndex | undefined => {
  let id = '';
  const key = 'registry.item' + itemIndex.toString();

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(['string', 'uint32'], ['registry.item', itemIndex])
    );
  }

  return world.entityToIndex.get(id as EntityID);
};
