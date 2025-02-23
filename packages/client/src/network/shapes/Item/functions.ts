import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/index';
import { queryInventoryInstance } from '../Inventory';
import { Item } from './types';

/////////////////
// GETTERS
// TODO: move these to.. app/cache/inventory/helpers.ts?

// get the MUSU balance of a holder entity
export const getMusuBalance = (
  world: World,
  components: Components,
  entity: EntityIndex
): number => {
  const id = world.entities[entity];
  return getItemBalance(world, components, id, MUSU_INDEX);
};

// TODO: make this an Inventory function
export const getItemBalance = (
  world: World,
  components: Components,
  holderID: EntityID,
  itemIndex: number
): number => {
  const { Value } = components;
  const entity = queryInventoryInstance(world, holderID ?? 0, itemIndex);
  return entity ? (getComponentValue(Value, entity)?.value ?? 0) * 1 : 0;
};

// handles item balance if it's an ERC20 (assume 18dp)
export const formatItemBalance = (item: Item, balance: number): number => {
  if (item.address) {
    const bignum = BigInt(balance);
    return Number((bignum * 1000n) / BigInt(10 ** 18)) / 1000; // show up to 3dp
  }
  return balance;
};
