import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  Not,
  QueryFragment,
  World,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'layers/network';
import { Inventory, getTypedInventory } from './Inventory';
import { Item, getItem } from './Item';

export interface Droptable {
  keys: number[];
  weights: number[];
  results?: number[];
}

export interface Lootbox extends Item {
  droptable: Droptable;
}

export interface LootboxLog {
  id: EntityID;
  entityIndex: EntityIndex;
  isRevealed: boolean;
  balance: number;
  index: number;
  time: number;
  droptable: Droptable;
  revealBlock?: number;
}

// get lootbox as an item with extra stuff
export const getLootbox = (world: World, components: Components, index: EntityIndex): Lootbox => {
  const { Keys, Weights } = components;

  const item: Item = getItem(world, components, index);
  const droptable: Droptable = {
    keys: getComponentValue(Keys, index)?.value as number[],
    weights: getComponentValue(Weights, index)?.value as number[],
  };

  const lootbox: Lootbox = {
    ...item,
    droptable,
  };
  return lootbox;
};

export const getLootboxByIndex = (
  world: World,
  components: Components,
  index: number // item index of the registry instance
): Lootbox => {
  const { IsRegistry, ItemIndex } = components;

  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: index })])
  );
  return getLootbox(world, components, entityIndices[0]);
};

// Gets a lootbox in inventory form
export const getLootboxes = (
  world: World,
  components: Components,
  index: EntityIndex // entity index of the registry instance
): Inventory => {
  return getTypedInventory(world, components, index, getLootbox);
};

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

  const log: LootboxLog = {
    id: world.entities[index],
    entityIndex: index,
    isRevealed: !hasComponent(RevealBlock, index),
    balance: getComponentValue(Value, index)?.value as number,
    index: itemIndex,
    time: getComponentValue(Time, index)?.value as number,
    droptable: {
      keys: getComponentValue(Keys, regID)?.value as number[],
      weights: getComponentValue(Weights, regID)?.value as number[],
    },
  };

  if (!log.isRevealed) {
    log.revealBlock = getComponentValue(RevealBlock, index)?.value as number;
  } else {
    log.droptable.results = getComponentValue(Values, index)?.value as number[];
  }

  return log;
};

////////////////////
// QUERIES

export const queryHolderLogs = (
  world: World,
  components: Components,
  holderID: EntityID,
  revealed: boolean
): LootboxLog[] => {
  const { IsLootbox, IsLog, HolderID, RevealBlock } = components;

  const toQuery: QueryFragment[] = [
    Has(IsLootbox),
    Has(IsLog),
    HasValue(HolderID, { value: holderID }),
  ];

  if (revealed) toQuery.push(Not(RevealBlock));
  else toQuery.push(Has(RevealBlock));

  const entityIndices = Array.from(runQuery(toQuery));

  return entityIndices.map((index) => getLootboxLog(world, components, index));
};
