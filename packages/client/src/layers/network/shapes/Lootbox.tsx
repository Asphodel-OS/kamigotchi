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

import { numberToHex } from 'utils/hex';
import { Item, getItem } from './Item';
import { Inventory, getTypedInventory } from './Inventory';
import { NetworkLayer } from 'layers/network/types';


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
  network: NetworkLayer,
  index: EntityIndex,
): Lootbox => {
  const {
    components: {
      Keys,
      Weights,
    },
  } = network;
  const item: Item = getItem(network, index);
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
  network: NetworkLayer,
  index: number, // item index of the registry instance
): Lootbox => {
  const {
    components: {
      IsRegistry,
      ItemIndex,
    },
  } = network;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(ItemIndex, { value: numberToHex(index) })
    ])
  );
  return getLootbox(network, entityIndices[0]);
}

// Gets a lootbox in inventory form 
export const getLootboxes = (
  network: NetworkLayer,
  index: EntityIndex, // entity index of the registry instance
): Inventory => {
  return getTypedInventory(network, index, getLootbox);
}

// gets a lootbox log entity
export const getLootboxLog = (
  network: NetworkLayer,
  index: EntityIndex,
): LootboxLog => {
  const {
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
  } = network;
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

export const queryHolderLogs = (network: NetworkLayer, holderID: EntityID, revealed: boolean): LootboxLog[] => {
  const {
    components: {
      IsLootbox,
      IsLog,
      HolderID,
      RevealBlock,
    },
  } = network;

  const toQuery: QueryFragment[] = [
    Has(IsLootbox),
    Has(IsLog),
    HasValue(HolderID, { value: holderID })
  ];

  if (revealed) toQuery.push(Not(RevealBlock));
  else toQuery.push(Has(RevealBlock));

  const entityIndices = Array.from(runQuery(toQuery));

  return entityIndices.map(index => getLootboxLog(network, index));
}
