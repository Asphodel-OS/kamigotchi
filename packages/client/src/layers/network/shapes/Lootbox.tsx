import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  Not,
  getComponentValue,
  hasComponent,
  runQuery,
  QueryFragment,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { numberToHex } from 'utils/hex';
import { Item, getItem } from './Item';
import { Inventory, getTypedInventory } from './Inventory';

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
export const getLootbox = (
  layers: Layers,
  index: EntityIndex,
): Lootbox => {
  const {
    network: {
      components: {
        Keys,
        Weights,
      },
    },
  } = layers;
  const item: Item = getItem(layers, index);
  const droptable: Droptable = {
    keys: getComponentValue(Keys, index)?.value as number[],
    weights: getComponentValue(Weights, index)?.value as number[],
  }

  const lootbox: Lootbox = {
    ...item,
    droptable,
  }
  return lootbox;
}

export const getLootboxByIndex = (
  layers: Layers,
  index: number, // item index of the registry instance
): Lootbox => {
  const {
    network: {
      components: {
        IsRegistry,
        ItemIndex,
      },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(ItemIndex, { value: numberToHex(index) })
    ])
  );
  return getLootbox(layers, entityIndices[0]);
}

// Gets a lootbox in inventory form 
export const getLootboxes = (
  layers: Layers,
  index: EntityIndex, // entity index of the registry instance
): Inventory => {
  return getTypedInventory(layers, index, getLootbox);
}

// gets a lootbox log entity
export const getLootboxLog = (
  layers: Layers,
  index: EntityIndex,
): LootboxLog => {
  const {
    network: {
      world,
      components: {
        Balance,
        Balances,
        IsRegistry,
        ItemIndex,
        RevealBlock,
        Keys,
        Time,
        Weights,
        Name
      },
    },
  } = layers;
  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const regID = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(ItemIndex, { value: itemIndex })
    ])
  )[0];

  const log: LootboxLog = {
    id: world.entities[index],
    entityIndex: index,
    isRevealed: !hasComponent(RevealBlock, index),
    balance: getComponentValue(Balance, index)?.value as number,
    index: itemIndex,
    time: getComponentValue(Time, index)?.value as number,
    droptable: {
      keys: getComponentValue(Keys, regID)?.value as number[],
      weights: getComponentValue(Weights, regID)?.value as number[],
    }
  };

  if (!log.isRevealed) {
    log.revealBlock = getComponentValue(RevealBlock, index)?.value as number;
  } else {
    log.droptable.results = getComponentValue(Balances, index)?.value as number[];
  }

  return log;
}


////////////////////
// QUERIES

export const queryHolderLogs = (layers: Layers, holderID: EntityID, revealed: boolean): LootboxLog[] => {
  const {
    network: {
      components: {
        IsLootbox,
        IsLog,
        HolderID,
        RevealBlock,
      },
    },
  } = layers;

  const toQuery: QueryFragment[] = [
    Has(IsLootbox),
    Has(IsLog),
    HasValue(HolderID, { value: holderID })
  ];

  if (revealed) toQuery.push(Not(RevealBlock));
  else toQuery.push(Has(RevealBlock));

  const entityIndices = Array.from(runQuery(toQuery));

  return entityIndices.map(index => getLootboxLog(layers, index));
}
