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

import { Components } from 'network/components';
import { Stats, getStats } from '../Stats';
import { Commit, DetailedEntity, getItemImage } from '../utils';
import { For, getFor } from './utils';

// The standard shape of a FE Item Entity
export interface Item extends DetailedEntity {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  is: Is;
  for: For;
  type: string;
  stats?: Stats;
  experience?: number; // maybe merge in Stats in future?
  droptable?: Droptable;
}

export interface Is {
  consumable: boolean;
  lootbox: boolean;
}

export interface Lootbox extends Item {
  droptable: Droptable;
}

export interface Droptable {
  keys: number[];
  weights: number[];
  results?: number[];
}

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

  const name = (getComponentValue(Name, entityIndex)?.value as string) ?? 'Unknown Item';
  let item: Item = {
    ObjectType: 'ITEM',
    entityIndex,
    id: world.entities[entityIndex],
    index: getComponentValue(ItemIndex, entityIndex)?.value as number,
    type: getComponentValue(Type, entityIndex)?.value as string,
    name: name,
    description: getComponentValue(Description, entityIndex)?.value as string,
    image: getItemImage(name),
    for: getFor(components, entityIndex),
    stats: getStats(components, entityIndex),
    experience: (getComponentValue(Experience, entityIndex)?.value as number) * 1,
    is: {
      consumable: hasComponent(IsConsumable, entityIndex),
      lootbox: hasComponent(IsLootbox, entityIndex),
    },
  };

  // check if we want to process this item as a lootbox
  if (hasComponent(IsLootbox, entityIndex)) {
    item.type = 'LOOTBOX';
    const droptable: Droptable = {
      keys: getComponentValue(Keys, entityIndex)?.value as number[],
      weights: getComponentValue(Weights, entityIndex)?.value as number[],
    };
    item.droptable = droptable;
  }

  return item;
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

/////////////////
// LOOTBOX LOGS

export interface LootboxLog extends Commit {
  id: EntityID;
  entityIndex: EntityIndex;
  isRevealed: boolean;
  balance: number;
  index: number;
  time: number;
  revealBlock: number;
  droptable: Droptable;
}

// gets a lootbox log entity
export const getLootboxLog = (
  world: World,
  components: Components,
  index: EntityIndex
): LootboxLog => {
  const { Value, Values, IsRegistry, ItemIndex, RevealBlock, Keys, Time, Weights } = components;

  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const regID = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];
  const isRevealed = !hasComponent(RevealBlock, index);

  return {
    id: world.entities[index],
    entityIndex: index,
    isRevealed: isRevealed,
    balance: getComponentValue(Value, index)?.value as number,
    index: itemIndex,
    time: getComponentValue(Time, index)?.value as number,
    droptable: {
      keys: getComponentValue(Keys, regID)?.value as number[],
      weights: getComponentValue(Weights, regID)?.value as number[],
      results: isRevealed ? (getComponentValue(Values, index)?.value as number[]) : undefined,
    },
    revealBlock: isRevealed ? 0 : (getComponentValue(RevealBlock, index)?.value as number) * 1,
  };
};
