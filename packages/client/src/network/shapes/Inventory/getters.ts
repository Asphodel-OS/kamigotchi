import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { Inventory, getInventory } from '../Inventory';
import { query } from './queries';
import { NULL_INVENTORY } from './types';

// gets inventory by deterministic ID using the holder's ID and the item index.
// @returns Inventory. If empty, returns inventory with balance 0
export const getByHolderItem = (
  world: World,
  components: Components,
  holderID: EntityID,
  itemIndex: number
): Inventory => {
  const entities = query(components, { owner: holderID, itemIndex });
  if (!entities) return NULL_INVENTORY;
  return getInventory(world, components, entities[0]);
};
